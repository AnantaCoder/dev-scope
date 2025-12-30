// Package handlers provides Dev AI chatbot functionality
package handlers

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github-api/backend/internal/models"
)

// DevAIMention represents an @ mention in the chat
type DevAIMention struct {
	Type  string `json:"type"`  // "repo" or "user"
	Value string `json:"value"` // e.g., "owner/repo" or "username"
}

// DevAIChatRequest represents a chat message request
type DevAIChatRequest struct {
	Message        string         `json:"message"`
	ConversationID int            `json:"conversation_id,omitempty"`
	Mentions       []DevAIMention `json:"mentions,omitempty"`
}

// DevAIChatResponse represents the AI chat response
type DevAIChatResponse struct {
	Error          bool   `json:"error"`
	Response       string `json:"response"`
	ConversationID int    `json:"conversation_id"`
	Message        string `json:"message,omitempty"`
}

// ConversationsResponse represents the list of conversations response
type ConversationsResponse struct {
	Error         bool                       `json:"error"`
	Conversations []models.DevAIConversation `json:"conversations"`
	Message       string                     `json:"message,omitempty"`
}

// ConversationResponse represents a single conversation response with messages
type ConversationResponse struct {
	Error        bool                                  `json:"error"`
	Conversation *models.DevAIConversationWithMessages `json:"conversation,omitempty"`
	Message      string                                `json:"message,omitempty"`
}

// CreateConversationRequest represents a request to create a conversation
type CreateConversationRequest struct {
	Title string `json:"title"`
}

// RepoSearchResult represents a repository search result
type RepoSearchResult struct {
	FullName    string `json:"full_name"`
	Description string `json:"description"`
	Stars       int    `json:"stars"`
	Language    string `json:"language"`
	HTMLURL     string `json:"html_url"`
}

// UserSearchResult represents a user search result
type UserSearchResult struct {
	Login     string `json:"login"`
	AvatarURL string `json:"avatar_url"`
	HTMLURL   string `json:"html_url"`
	Type      string `json:"type"`
}

// SearchResponse represents the search response
type SearchResponse struct {
	Error   bool        `json:"error"`
	Results interface{} `json:"results"`
	Message string      `json:"message,omitempty"`
}

// DevAIChatHandler handles the Dev AI chat requests
func (s *Server) DevAIChatHandler(w http.ResponseWriter, r *http.Request) {
	startTime := time.Now()
	clientIP := getClientIP(r)
	log.Printf("🤖 [DevAI] Received chat request from %s", clientIP)

	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, DevAIChatResponse{Error: true, Message: "Method not allowed"})
		return
	}

	// Check rate limit (using same AI limiter)
	if !s.aiLimiter.Allow(clientIP) {
		remaining := s.aiLimiter.GetRemaining(clientIP)
		log.Printf("⚠️ [DevAI] Rate limit exceeded for %s", clientIP)
		w.Header().Set("X-RateLimit-Remaining", fmt.Sprintf("%d", remaining))
		w.Header().Set("X-RateLimit-Limit", "10")
		w.Header().Set("Retry-After", "60")
		writeJSON(w, http.StatusTooManyRequests, DevAIChatResponse{
			Error:   true,
			Message: "Rate limit exceeded. Maximum 10 AI requests per minute. Please try again later.",
		})
		return
	}

	// Add rate limit headers
	remaining := s.aiLimiter.GetRemaining(clientIP)
	w.Header().Set("X-RateLimit-Remaining", fmt.Sprintf("%d", remaining))
	w.Header().Set("X-RateLimit-Limit", "10")

	// Get authenticated user
	user, ok := r.Context().Value("user").(*models.User)
	if !ok {
		writeJSON(w, http.StatusUnauthorized, DevAIChatResponse{Error: true, Message: "Authentication required"})
		return
	}

	var req DevAIChatRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, DevAIChatResponse{Error: true, Message: "Invalid request body"})
		return
	}

	if strings.TrimSpace(req.Message) == "" {
		writeJSON(w, http.StatusBadRequest, DevAIChatResponse{Error: true, Message: "Message cannot be empty"})
		return
	}

	apiKey := s.config.NvidiaAPIKey
	if apiKey == "" {
		log.Printf("⚠️ [DevAI] NVIDIA API key not configured")
		writeJSON(w, http.StatusOK, DevAIChatResponse{
			Error:          false,
			Response:       "AI chat unavailable. NVIDIA API key not configured.",
			ConversationID: req.ConversationID,
		})
		return
	}

	// Build context from mentions
	mentionContext := buildMentionContext(req.Mentions)

	// Build the prompt with user context
	prompt := buildDevAIPrompt(user, req.Message, mentionContext)
	log.Printf("🔄 [DevAI] Processing message for user %s...", user.Username)

	// Construct message history
	var messages []NVIDIAMessage
	messages = append(messages, NVIDIAMessage{Role: "system", Content: getDevAISystemPrompt(user)})

	// Fetch conversation history if available
	if req.ConversationID > 0 && s.devaiRepo != nil {
		history, err := s.devaiRepo.GetMessagesByConversationID(r.Context(), req.ConversationID)
		if err == nil {
			// Limit to last 20 messages to conserve context window
			startIdx := 0
			if len(history) > 20 {
				startIdx = len(history) - 20
			}

			for i := startIdx; i < len(history); i++ {
				role := history[i].Role
				// Map "assistant" to "assistant" (or whatever the API expects, typically "assistant")
				// Map "user" to "user"
				messages = append(messages, NVIDIAMessage{
					Role:    role,
					Content: history[i].Content,
				})
			}
		} else {
			log.Printf("⚠️ [DevAI] Failed to fetch conversation history: %v", err)
		}
	}

	// Append current user message
	messages = append(messages, NVIDIAMessage{Role: "user", Content: prompt})

	nvidiaReq := NVIDIARequest{
		Model:       AI_MODEL_NAME, // Uses single source of truth from ai_handler.go
		Messages:    messages,
		Temperature: 0.7,
		MaxTokens:   800,
	}

	jsonData, _ := json.Marshal(nvidiaReq)
	httpReq, err := http.NewRequest("POST", NVIDIA_API_BASE+"/chat/completions", bytes.NewBuffer(jsonData))
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, DevAIChatResponse{Error: true, Message: "Failed to create AI request"})
		return
	}

	httpReq.Header.Set("Authorization", "Bearer "+apiKey)
	httpReq.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 90 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		log.Printf("❌ [DevAI] Request failed: %v", err)
		writeJSON(w, http.StatusInternalServerError, DevAIChatResponse{Error: true, Message: "Failed to connect to AI service"})
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	if resp.StatusCode != http.StatusOK {
		log.Printf("❌ [DevAI] API error: %d", resp.StatusCode)
		writeJSON(w, http.StatusInternalServerError, DevAIChatResponse{Error: true, Message: fmt.Sprintf("AI service error: %d", resp.StatusCode)})
		return
	}

	var nvidiaResp NVIDIAResponse
	if err := json.Unmarshal(body, &nvidiaResp); err != nil {
		log.Printf("❌ [DevAI] Failed to parse response: %s", string(body))
		writeJSON(w, http.StatusInternalServerError, DevAIChatResponse{Error: true, Message: "Failed to parse AI response"})
		return
	}

	response := ""
	if len(nvidiaResp.Choices) > 0 {
		response = nvidiaResp.Choices[0].Message.Content
	}

	conversationID := req.ConversationID

	// Save to database if repository is available
	if s.devaiRepo != nil {
		ctx := context.Background()

		// Create new conversation if no ID provided
		if conversationID == 0 {
			title := req.Message
			if len(title) > 30 {
				title = title[:30] + "..."
			}
			conv, err := s.devaiRepo.CreateConversation(ctx, user.ID, title)
			if err != nil {
				log.Printf("⚠️ [DevAI] Failed to create conversation: %v", err)
			} else {
				conversationID = conv.ID
			}
		}

		// Save user message
		if conversationID > 0 {
			var mentionsJSON *string
			if len(req.Mentions) > 0 {
				if data, err := json.Marshal(req.Mentions); err == nil {
					s := string(data)
					mentionsJSON = &s
				}
			}
			_, err := s.devaiRepo.AddMessage(ctx, conversationID, "user", req.Message, mentionsJSON)
			if err != nil {
				log.Printf("⚠️ [DevAI] Failed to save user message: %v", err)
			}

			// Save assistant response
			_, err = s.devaiRepo.AddMessage(ctx, conversationID, "assistant", response, nil)
			if err != nil {
				log.Printf("⚠️ [DevAI] Failed to save assistant message: %v", err)
			}

			// Update conversation timestamp
			s.devaiRepo.UpdateConversationTimestamp(ctx, conversationID)
		}
	}

	log.Printf("✅ [DevAI] Response generated in %v (len=%d)", time.Since(startTime), len(response))
	writeJSON(w, http.StatusOK, DevAIChatResponse{
		Error:          false,
		Response:       response,
		ConversationID: conversationID,
	})
}

// getDevAISystemPrompt returns the system prompt for Dev AI
func getDevAISystemPrompt(user *models.User) string {
	return fmt.Sprintf(`You are Dev AI, a helpful coding assistant integrated into DevScope - a GitHub analytics platform.

You are chatting with %s (@%s), who has %d public repositories and %d followers on GitHub.

Your capabilities:
- Answer questions about GitHub, Git, and software development
- Provide information about repositories and users when they are mentioned with @repo or @user
- Help with coding questions, best practices, and debugging
- Explain GitHub features and workflows

Guidelines:
- Be concise but thorough
- Use markdown formatting for code blocks and lists
- When a repository or user is mentioned, provide relevant insights
- Be friendly and professional
- If you don't know something, say so honestly

Format your responses using markdown. Use code blocks with language specification when showing code.`,
		user.Name, user.Username, user.PublicRepos, user.Followers)
}

// buildDevAIPrompt builds the prompt with context
func buildDevAIPrompt(user *models.User, message string, mentionContext string) string {
	if mentionContext != "" {
		return fmt.Sprintf("Context from mentions:\n%s\n\nUser's question:\n%s", mentionContext, message)
	}
	return message
}

// buildMentionContext creates context string from mentions by fetching real data from GitHub
func buildMentionContext(mentions []DevAIMention) string {
	if len(mentions) == 0 {
		return ""
	}

	var parts []string
	client := &http.Client{Timeout: 15 * time.Second}

	for _, m := range mentions {
		switch m.Type {
		case "repo":
			// Fetch repository data from GitHub API
			repoData := fetchGitHubRepoData(client, m.Value)
			parts = append(parts, repoData)
		case "user":
			// Fetch user data from GitHub API
			userData := fetchGitHubUserData(client, m.Value)
			parts = append(parts, userData)
		case "file":
			// Fetch file content from GitHub API
			fileData := fetchGitHubFileContent(client, m.Value)
			parts = append(parts, fileData)
		case "pr":
			// Fetch PR data from GitHub API
			prData := fetchGitHubPRData(client, m.Value)
			parts = append(parts, prData)
		}
	}
	return strings.Join(parts, "\n\n")
}

// fetchGitHubPRData fetches Pull Request data from GitHub
func fetchGitHubPRData(client *http.Client, prRef string) string {
	// Format: owner/repo#123
	hashIndex := strings.LastIndex(prRef, "#")
	if hashIndex == -1 {
		return fmt.Sprintf("PR: %s (invalid format - use owner/repo#123)", prRef)
	}

	repoPath := prRef[:hashIndex]
	prNumber := prRef[hashIndex+1:]

	repoParts := strings.Split(repoPath, "/")
	if len(repoParts) != 2 {
		return fmt.Sprintf("PR: %s (invalid format - use owner/repo#123)", prRef)
	}

	owner := repoParts[0]
	repo := repoParts[1]

	// Fetch PR metadata
	prURL := fmt.Sprintf("https://api.github.com/repos/%s/%s/pulls/%s", owner, repo, prNumber)
	req, err := http.NewRequest("GET", prURL, nil)
	if err != nil {
		return fmt.Sprintf("PR: #%s (unable to fetch)", prNumber)
	}
	req.Header.Set("Accept", "application/vnd.github.v3+json")
	req.Header.Set("User-Agent", "DevScope-DevAI")

	resp, err := client.Do(req)
	if err != nil {
		log.Printf("⚠️ [DevAI] Failed to fetch PR %s: %v", prRef, err)
		return fmt.Sprintf("PR: #%s (unable to fetch)", prNumber)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Sprintf("PR: #%s (not found or private repository)", prNumber)
	}

	var pr struct {
		Number    int    `json:"number"`
		Title     string `json:"title"`
		Body      string `json:"body"`
		State     string `json:"state"`
		Merged    bool   `json:"merged"`
		Additions int    `json:"additions"`
		Deletions int    `json:"deletions"`
		Commits   int    `json:"commits"`
		Changed   int    `json:"changed_files"`
		HTMLURL   string `json:"html_url"`
		User      struct {
			Login string `json:"login"`
		} `json:"user"`
		Base struct {
			Ref string `json:"ref"`
		} `json:"base"`
		Head struct {
			Ref string `json:"ref"`
		} `json:"head"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&pr); err != nil {
		return fmt.Sprintf("PR: #%s (unable to parse)", prNumber)
	}

	// Fetch PR files (diffs)
	filesURL := fmt.Sprintf("https://api.github.com/repos/%s/%s/pulls/%s/files", owner, repo, prNumber)
	filesReq, _ := http.NewRequest("GET", filesURL, nil)
	filesReq.Header.Set("Accept", "application/vnd.github.v3+json")
	filesReq.Header.Set("User-Agent", "DevScope-DevAI")

	filesResp, err := client.Do(filesReq)
	if err != nil {
		log.Printf("⚠️ [DevAI] Failed to fetch PR files %s: %v", prRef, err)
	}

	var files []struct {
		Filename  string `json:"filename"`
		Status    string `json:"status"`
		Additions int    `json:"additions"`
		Deletions int    `json:"deletions"`
		Patch     string `json:"patch"`
	}

	if filesResp != nil && filesResp.StatusCode == http.StatusOK {
		json.NewDecoder(filesResp.Body).Decode(&files)
		filesResp.Body.Close()
	}

	// Build context
	var info strings.Builder
	info.WriteString(fmt.Sprintf("=== Pull Request #%d ===\n", pr.Number))
	info.WriteString(fmt.Sprintf("Title: %s\n", pr.Title))
	info.WriteString(fmt.Sprintf("Author: @%s\n", pr.User.Login))
	info.WriteString(fmt.Sprintf("State: %s", pr.State))
	if pr.Merged {
		info.WriteString(" (merged)")
	}
	info.WriteString("\n")
	info.WriteString(fmt.Sprintf("Branch: %s → %s\n", pr.Head.Ref, pr.Base.Ref))
	info.WriteString(fmt.Sprintf("Stats: +%d -%d across %d files (%d commits)\n", pr.Additions, pr.Deletions, pr.Changed, pr.Commits))
	info.WriteString(fmt.Sprintf("URL: %s\n", pr.HTMLURL))

	if pr.Body != "" {
		description := pr.Body
		if len(description) > 500 {
			description = description[:500] + "..."
		}
		info.WriteString(fmt.Sprintf("\nDescription:\n%s\n", description))
	}

	// Add file diffs (limit total size)
	if len(files) > 0 {
		info.WriteString("\n--- Changed Files ---\n")
		totalPatchSize := 0
		maxPatchSize := 30000 // 30KB max for all diffs

		for _, f := range files {
			info.WriteString(fmt.Sprintf("\n📄 %s (%s, +%d -%d)\n", f.Filename, f.Status, f.Additions, f.Deletions))

			if f.Patch != "" && totalPatchSize < maxPatchSize {
				patch := f.Patch
				if len(patch) > 5000 {
					patch = patch[:5000] + "\n... [truncated]"
				}
				info.WriteString("```diff\n")
				info.WriteString(patch)
				info.WriteString("\n```\n")
				totalPatchSize += len(patch)
			}
		}
	}

	log.Printf("✅ [DevAI] Fetched PR #%s from %s/%s (%d files)", prNumber, owner, repo, len(files))
	return info.String()
}

// fetchGitHubFileContent fetches a file from a GitHub repository
func fetchGitHubFileContent(client *http.Client, filePath string) string {
	// Format: owner/repo/path/to/file.ext
	parts := strings.SplitN(filePath, "/", 3)
	if len(parts) < 3 {
		return fmt.Sprintf("File: %s (invalid format - use owner/repo/path/to/file)", filePath)
	}

	owner := parts[0]
	repo := parts[1]
	path := parts[2]

	url := fmt.Sprintf("https://api.github.com/repos/%s/%s/contents/%s", owner, repo, path)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return fmt.Sprintf("File: %s (unable to fetch)", filePath)
	}
	req.Header.Set("Accept", "application/vnd.github.v3+json")
	req.Header.Set("User-Agent", "DevScope-DevAI")

	resp, err := client.Do(req)
	if err != nil {
		log.Printf("⚠️ [DevAI] Failed to fetch file %s: %v", filePath, err)
		return fmt.Sprintf("File: %s (unable to fetch)", filePath)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Sprintf("File: %s (file not found or private repository)", filePath)
	}

	var fileInfo struct {
		Name     string `json:"name"`
		Path     string `json:"path"`
		Size     int    `json:"size"`
		Content  string `json:"content"`
		Encoding string `json:"encoding"`
		HTMLURL  string `json:"html_url"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&fileInfo); err != nil {
		return fmt.Sprintf("File: %s (unable to parse response)", filePath)
	}

	// Size limit: 100KB
	if fileInfo.Size > 100000 {
		return fmt.Sprintf("=== File: %s ===\nPath: %s\nSize: %d bytes (too large to analyze, max 100KB)\nURL: %s",
			fileInfo.Name, fileInfo.Path, fileInfo.Size, fileInfo.HTMLURL)
	}

	// Decode base64 content
	var content string
	if fileInfo.Encoding == "base64" {
		decoded, err := base64.StdEncoding.DecodeString(strings.ReplaceAll(fileInfo.Content, "\n", ""))
		if err != nil {
			return fmt.Sprintf("File: %s (unable to decode content)", filePath)
		}
		content = string(decoded)
	} else {
		content = fileInfo.Content
	}

	// Truncate if too long for context
	if len(content) > 50000 {
		content = content[:50000] + "\n\n... [truncated - file too long]"
	}

	var info strings.Builder
	info.WriteString(fmt.Sprintf("=== File: %s ===\n", fileInfo.Name))
	info.WriteString(fmt.Sprintf("Path: %s\n", fileInfo.Path))
	info.WriteString(fmt.Sprintf("Size: %d bytes\n", fileInfo.Size))
	info.WriteString(fmt.Sprintf("URL: %s\n", fileInfo.HTMLURL))
	info.WriteString(fmt.Sprintf("--- Content ---\n%s", content))

	log.Printf("✅ [DevAI] Fetched file %s (%d bytes)", filePath, fileInfo.Size)
	return info.String()
}

// fetchGitHubUserData fetches user information from GitHub API
func fetchGitHubUserData(client *http.Client, username string) string {
	url := fmt.Sprintf("https://api.github.com/users/%s", username)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return fmt.Sprintf("GitHub User: @%s (unable to fetch data)", username)
	}
	req.Header.Set("Accept", "application/vnd.github.v3+json")
	req.Header.Set("User-Agent", "DevScope-DevAI")

	resp, err := client.Do(req)
	if err != nil {
		log.Printf("⚠️ [DevAI] Failed to fetch user %s: %v", username, err)
		return fmt.Sprintf("GitHub User: @%s (unable to fetch data)", username)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Sprintf("GitHub User: @%s (user not found or API error)", username)
	}

	var user struct {
		Login       string `json:"login"`
		Name        string `json:"name"`
		Bio         string `json:"bio"`
		Company     string `json:"company"`
		Location    string `json:"location"`
		Blog        string `json:"blog"`
		PublicRepos int    `json:"public_repos"`
		PublicGists int    `json:"public_gists"`
		Followers   int    `json:"followers"`
		Following   int    `json:"following"`
		CreatedAt   string `json:"created_at"`
		HTMLURL     string `json:"html_url"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&user); err != nil {
		return fmt.Sprintf("GitHub User: @%s (unable to parse data)", username)
	}

	// Build detailed context
	var info strings.Builder
	info.WriteString(fmt.Sprintf("=== GitHub User: @%s ===\n", user.Login))
	if user.Name != "" {
		info.WriteString(fmt.Sprintf("Name: %s\n", user.Name))
	}
	if user.Bio != "" {
		info.WriteString(fmt.Sprintf("Bio: %s\n", user.Bio))
	}
	if user.Company != "" {
		info.WriteString(fmt.Sprintf("Company: %s\n", user.Company))
	}
	if user.Location != "" {
		info.WriteString(fmt.Sprintf("Location: %s\n", user.Location))
	}
	info.WriteString(fmt.Sprintf("Public Repositories: %d\n", user.PublicRepos))
	info.WriteString(fmt.Sprintf("Followers: %d | Following: %d\n", user.Followers, user.Following))
	info.WriteString(fmt.Sprintf("Profile: %s", user.HTMLURL))

	log.Printf("✅ [DevAI] Fetched user data for @%s", username)
	return info.String()
}

// fetchGitHubRepoData fetches repository information from GitHub API
func fetchGitHubRepoData(client *http.Client, fullName string) string {
	url := fmt.Sprintf("https://api.github.com/repos/%s", fullName)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return fmt.Sprintf("Repository: %s (unable to fetch data)", fullName)
	}
	req.Header.Set("Accept", "application/vnd.github.v3+json")
	req.Header.Set("User-Agent", "DevScope-DevAI")

	resp, err := client.Do(req)
	if err != nil {
		log.Printf("⚠️ [DevAI] Failed to fetch repo %s: %v", fullName, err)
		return fmt.Sprintf("Repository: %s (unable to fetch data)", fullName)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Sprintf("Repository: %s (repository not found or API error)", fullName)
	}

	var repo struct {
		FullName        string   `json:"full_name"`
		Description     string   `json:"description"`
		Language        string   `json:"language"`
		StargazersCount int      `json:"stargazers_count"`
		ForksCount      int      `json:"forks_count"`
		OpenIssuesCount int      `json:"open_issues_count"`
		WatchersCount   int      `json:"watchers_count"`
		DefaultBranch   string   `json:"default_branch"`
		CreatedAt       string   `json:"created_at"`
		UpdatedAt       string   `json:"updated_at"`
		PushedAt        string   `json:"pushed_at"`
		HTMLURL         string   `json:"html_url"`
		Topics          []string `json:"topics"`
		License         *struct {
			Name string `json:"name"`
		} `json:"license"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&repo); err != nil {
		return fmt.Sprintf("Repository: %s (unable to parse data)", fullName)
	}

	// Build detailed context
	var info strings.Builder
	info.WriteString(fmt.Sprintf("=== Repository: %s ===\n", repo.FullName))
	if repo.Description != "" {
		info.WriteString(fmt.Sprintf("Description: %s\n", repo.Description))
	}
	if repo.Language != "" {
		info.WriteString(fmt.Sprintf("Primary Language: %s\n", repo.Language))
	}
	info.WriteString(fmt.Sprintf("Stars: %d | Forks: %d | Watchers: %d\n", repo.StargazersCount, repo.ForksCount, repo.WatchersCount))
	info.WriteString(fmt.Sprintf("Open Issues: %d\n", repo.OpenIssuesCount))
	if repo.License != nil && repo.License.Name != "" {
		info.WriteString(fmt.Sprintf("License: %s\n", repo.License.Name))
	}
	if len(repo.Topics) > 0 {
		info.WriteString(fmt.Sprintf("Topics: %s\n", strings.Join(repo.Topics, ", ")))
	}
	info.WriteString(fmt.Sprintf("Default Branch: %s\n", repo.DefaultBranch))
	info.WriteString(fmt.Sprintf("Last Push: %s\n", repo.PushedAt))
	info.WriteString(fmt.Sprintf("Repository URL: %s\n", repo.HTMLURL))

	// Fetch recent commits for activity feed
	recentActivity := fetchRecentCommits(client, fullName)
	if recentActivity != "" {
		info.WriteString("\n--- Recent Activity ---\n")
		info.WriteString(recentActivity)
	}

	log.Printf("✅ [DevAI] Fetched repo data for %s", fullName)
	return info.String()
}

// fetchRecentCommits fetches the 5 most recent commits
func fetchRecentCommits(client *http.Client, fullName string) string {
	url := fmt.Sprintf("https://api.github.com/repos/%s/commits?per_page=5", fullName)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return ""
	}
	req.Header.Set("Accept", "application/vnd.github.v3+json")
	req.Header.Set("User-Agent", "DevScope-DevAI")

	resp, err := client.Do(req)
	if err != nil {
		return ""
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return ""
	}

	var commits []struct {
		SHA    string `json:"sha"`
		Commit struct {
			Message string `json:"message"`
			Author  struct {
				Name string `json:"name"`
				Date string `json:"date"`
			} `json:"author"`
		} `json:"commit"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&commits); err != nil {
		return ""
	}

	if len(commits) == 0 {
		return ""
	}

	var activity strings.Builder
	for i, c := range commits {
		// Truncate long commit messages
		msg := c.Commit.Message
		if len(msg) > 60 {
			msg = msg[:60] + "..."
		}
		// Remove newlines
		msg = strings.ReplaceAll(msg, "\n", " ")
		activity.WriteString(fmt.Sprintf("%d. %s - %s (%s)\n", i+1, c.SHA[:7], msg, c.Commit.Author.Name))
	}
	return activity.String()
}

// DevAISearchReposHandler handles repository search for @ mentions
func (s *Server) DevAISearchReposHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, SearchResponse{Error: true, Message: "Method not allowed"})
		return
	}

	query := r.URL.Query().Get("q")
	if query == "" {
		writeJSON(w, http.StatusBadRequest, SearchResponse{Error: true, Message: "Query parameter 'q' is required"})
		return
	}

	// Search GitHub for repositories
	url := fmt.Sprintf("https://api.github.com/search/repositories?q=%s&per_page=5&sort=stars", query)
	resp, err := http.Get(url)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, SearchResponse{Error: true, Message: "Failed to search repositories"})
		return
	}
	defer resp.Body.Close()

	var result struct {
		Items []struct {
			FullName    string `json:"full_name"`
			Description string `json:"description"`
			Stars       int    `json:"stargazers_count"`
			Language    string `json:"language"`
			HTMLURL     string `json:"html_url"`
		} `json:"items"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		writeJSON(w, http.StatusInternalServerError, SearchResponse{Error: true, Message: "Failed to parse search results"})
		return
	}

	repos := make([]RepoSearchResult, 0, len(result.Items))
	for _, item := range result.Items {
		repos = append(repos, RepoSearchResult{
			FullName:    item.FullName,
			Description: item.Description,
			Stars:       item.Stars,
			Language:    item.Language,
			HTMLURL:     item.HTMLURL,
		})
	}

	writeJSON(w, http.StatusOK, SearchResponse{Error: false, Results: repos})
}

// DevAISearchUsersHandler handles user search for @ mentions
func (s *Server) DevAISearchUsersHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, SearchResponse{Error: true, Message: "Method not allowed"})
		return
	}

	query := r.URL.Query().Get("q")
	if query == "" {
		writeJSON(w, http.StatusBadRequest, SearchResponse{Error: true, Message: "Query parameter 'q' is required"})
		return
	}

	// Search GitHub for users
	url := fmt.Sprintf("https://api.github.com/search/users?q=%s&per_page=5", query)
	resp, err := http.Get(url)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, SearchResponse{Error: true, Message: "Failed to search users"})
		return
	}
	defer resp.Body.Close()

	var result struct {
		Items []struct {
			Login     string `json:"login"`
			AvatarURL string `json:"avatar_url"`
			HTMLURL   string `json:"html_url"`
			Type      string `json:"type"`
		} `json:"items"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		writeJSON(w, http.StatusInternalServerError, SearchResponse{Error: true, Message: "Failed to parse search results"})
		return
	}

	users := make([]UserSearchResult, 0, len(result.Items))
	for _, item := range result.Items {
		users = append(users, UserSearchResult{
			Login:     item.Login,
			AvatarURL: item.AvatarURL,
			HTMLURL:   item.HTMLURL,
			Type:      item.Type,
		})
	}

	writeJSON(w, http.StatusOK, SearchResponse{Error: false, Results: users})
}

// DevAIGetConversationsHandler returns all conversations for the authenticated user
func (s *Server) DevAIGetConversationsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, ConversationsResponse{Error: true, Message: "Method not allowed"})
		return
	}

	user, ok := r.Context().Value("user").(*models.User)
	if !ok {
		writeJSON(w, http.StatusUnauthorized, ConversationsResponse{Error: true, Message: "Authentication required"})
		return
	}

	if s.devaiRepo == nil {
		writeJSON(w, http.StatusInternalServerError, ConversationsResponse{Error: true, Message: "Database not configured"})
		return
	}

	// Parse pagination params
	limit := 20
	offset := 0
	if l := r.URL.Query().Get("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 {
			limit = parsed
		}
	}
	if o := r.URL.Query().Get("offset"); o != "" {
		if parsed, err := strconv.Atoi(o); err == nil && parsed >= 0 {
			offset = parsed
		}
	}

	ctx := context.Background()
	conversations, total, err := s.devaiRepo.GetConversationsByUserID(ctx, user.ID, limit, offset)
	if err != nil {
		log.Printf("❌ [DevAI] Failed to get conversations(api limit exceeded): %v", err)
		writeJSON(w, http.StatusInternalServerError, ConversationsResponse{Error: true, Message: "Failed to get conversations"})
		return
	}

	if conversations == nil {
		conversations = []models.DevAIConversation{}
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"error":         false,
		"conversations": conversations,
		"total":         total,
		"limit":         limit,
		"offset":        offset,
	})
}

// DevAICreateConversationHandler creates a new conversation
func (s *Server) DevAICreateConversationHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, ConversationResponse{Error: true, Message: "Method not allowed"})
		return
	}

	user, ok := r.Context().Value("user").(*models.User)
	if !ok {
		writeJSON(w, http.StatusUnauthorized, ConversationResponse{Error: true, Message: "Authentication required"})
		return
	}

	if s.devaiRepo == nil {
		writeJSON(w, http.StatusInternalServerError, ConversationResponse{Error: true, Message: "Database not configured"})
		return
	}

	var req CreateConversationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		req.Title = "New Chat"
	}

	ctx := context.Background()
	conv, err := s.devaiRepo.CreateConversation(ctx, user.ID, req.Title)
	if err != nil {
		log.Printf("❌ [DevAI] Failed to create conversation: %v", err)
		writeJSON(w, http.StatusInternalServerError, ConversationResponse{Error: true, Message: "Failed to create conversation"})
		return
	}

	writeJSON(w, http.StatusCreated, ConversationResponse{
		Error: false,
		Conversation: &models.DevAIConversationWithMessages{
			DevAIConversation: *conv,
			Messages:          []models.DevAIMessage{},
		},
	})
}

// DevAIGetConversationHandler returns a single conversation with messages
func (s *Server) DevAIGetConversationHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, ConversationResponse{Error: true, Message: "Method not allowed"})
		return
	}

	user, ok := r.Context().Value("user").(*models.User)
	if !ok {
		writeJSON(w, http.StatusUnauthorized, ConversationResponse{Error: true, Message: "Authentication required"})
		return
	}

	// Extract conversation ID from path
	path := strings.TrimPrefix(r.URL.Path, "/api/devai/conversations/")
	convID, err := strconv.Atoi(path)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, ConversationResponse{Error: true, Message: "Invalid conversation ID"})
		return
	}

	if s.devaiRepo == nil {
		writeJSON(w, http.StatusInternalServerError, ConversationResponse{Error: true, Message: "Database not configured"})
		return
	}

	ctx := context.Background()
	conv, err := s.devaiRepo.GetConversationWithMessages(ctx, convID, user.ID)
	if err != nil {
		log.Printf("❌ [DevAI] Failed to get conversation: %v", err)
		writeJSON(w, http.StatusInternalServerError, ConversationResponse{Error: true, Message: "Failed to get conversation"})
		return
	}

	if conv == nil {
		writeJSON(w, http.StatusNotFound, ConversationResponse{Error: true, Message: "Conversation not found"})
		return
	}

	writeJSON(w, http.StatusOK, ConversationResponse{Error: false, Conversation: conv})
}

// DevAIDeleteConversationHandler deletes a conversation
func (s *Server) DevAIDeleteConversationHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]interface{}{"error": true, "message": "Method not allowed"})
		return
	}

	user, ok := r.Context().Value("user").(*models.User)
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]interface{}{"error": true, "message": "Authentication required"})
		return
	}

	// Extract conversation ID from path
	path := strings.TrimPrefix(r.URL.Path, "/api/devai/conversations/")
	convID, err := strconv.Atoi(path)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{"error": true, "message": "Invalid conversation ID"})
		return
	}

	if s.devaiRepo == nil {
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{"error": true, "message": "Database not configured"})
		return
	}

	ctx := context.Background()
	if err := s.devaiRepo.DeleteConversation(ctx, convID, user.ID); err != nil {
		log.Printf("❌ [DevAI] Failed to delete conversation: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{"error": true, "message": "Failed to delete conversation"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{"error": false, "message": "Conversation deleted"})
}
