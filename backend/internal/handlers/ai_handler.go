// Package handlers provides AI comparison functionality
package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"

	"github-api/backend/internal/models"
)

const NVIDIA_API_BASE = "https://integrate.api.nvidia.com/v1"

// AI_MODEL_NAME is the single source of truth for the AI model used across all handlers
const AI_MODEL_NAME = "qwen/qwen3-coder-480b-a35b-instruct"

// AIComparisonRequest represents the request for AI comparison
type AIComparisonRequest struct {
	Users []models.GitHubUser `json:"users"`
}

// AIComparisonResponse represents the AI comparison response
type AIComparisonResponse struct {
	Error      bool   `json:"error"`
	Comparison string `json:"comparison"`
	Message    string `json:"message,omitempty"`
}

// NVIDIARequest represents NVIDIA API request
type NVIDIARequest struct {
	Model       string          `json:"model"`
	Messages    []NVIDIAMessage `json:"messages"`
	Temperature float64         `json:"temperature"`
	MaxTokens   int             `json:"max_tokens"`
}

// NVIDIAMessage represents a message in NVIDIA API
type NVIDIAMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// NVIDIAResponse represents NVIDIA API response
type NVIDIAResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
}

// AIComparisonHandler handles AI comparison requests
func (s *Server) AIComparisonHandler(w http.ResponseWriter, r *http.Request) {
	startTime := time.Now()
	clientIP := getClientIP(r)
	log.Printf("🤖 [AI] Received comparison request from %s", clientIP)

	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, AIComparisonResponse{Error: true, Message: "Method not allowed"})
		return
	}

	// Check rate limit
	if !s.aiLimiter.Allow(clientIP) {
		remaining := s.aiLimiter.GetRemaining(clientIP)
		log.Printf("⚠️ [AI] Rate limit exceeded for %s", clientIP)
		w.Header().Set("X-RateLimit-Remaining", fmt.Sprintf("%d", remaining))
		w.Header().Set("X-RateLimit-Limit", "10")
		w.Header().Set("Retry-After", "60")
		writeJSON(w, http.StatusTooManyRequests, AIComparisonResponse{
			Error:   true,
			Message: "Rate limit exceeded. Maximum 10 AI requests per minute. Please try again later.",
		})
		return
	}

	// Add rate limit headers
	remaining := s.aiLimiter.GetRemaining(clientIP)
	w.Header().Set("X-RateLimit-Remaining", fmt.Sprintf("%d", remaining))
	w.Header().Set("X-RateLimit-Limit", "10")

	var req AIComparisonRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, AIComparisonResponse{Error: true, Message: "Invalid request body"})
		return
	}

	apiKey := s.config.NvidiaAPIKey
	if apiKey == "" {
		log.Printf("⚠️ [AI] NVIDIA API key not configured")
		writeJSON(w, http.StatusOK, AIComparisonResponse{
			Error:      false,
			Comparison: "AI comparison unavailable. NVIDIA API key not configured.",
		})
		return
	}

	// Build concise comparison prompt
	prompt := buildComparisonPrompt(req.Users)
	log.Printf("🔄 [AI] Comparing %d users...", len(req.Users))

	nvidiaReq := NVIDIARequest{
		Model: AI_MODEL_NAME,
		Messages: []NVIDIAMessage{
			{Role: "system", Content: "You are a detailed GitHub profile analyst. Provide comprehensive comparisons with insights. Use markdown formatting with headers and bullet points. Be thorough in your analysis."},
			{Role: "user", Content: prompt},
		},
		Temperature: 0.5,
		MaxTokens:   600,
	}

	jsonData, _ := json.Marshal(nvidiaReq)
	httpReq, err := http.NewRequest("POST", NVIDIA_API_BASE+"/chat/completions", bytes.NewBuffer(jsonData))
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, AIComparisonResponse{Error: true, Message: "Failed to create AI request"})
		return
	}

	httpReq.Header.Set("Authorization", "Bearer "+apiKey)
	httpReq.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		log.Printf("❌ [AI] Request failed: %v", err)
		writeJSON(w, http.StatusInternalServerError, AIComparisonResponse{Error: true, Message: "Failed to connect to NVIDIA API"})
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	if resp.StatusCode != http.StatusOK {
		log.Printf("❌ [AI] API error: %d", resp.StatusCode)
		writeJSON(w, http.StatusInternalServerError, AIComparisonResponse{Error: true, Message: fmt.Sprintf("NVIDIA API error: %d", resp.StatusCode)})
		return
	}

	var nvidiaResp NVIDIAResponse
	if err := json.Unmarshal(body, &nvidiaResp); err != nil {
		writeJSON(w, http.StatusInternalServerError, AIComparisonResponse{Error: true, Message: "Failed to parse AI response"})
		return
	}

	comparison := ""
	if len(nvidiaResp.Choices) > 0 {
		comparison = nvidiaResp.Choices[0].Message.Content
	}

	log.Printf("✅ [AI] Comparison generated in %v", time.Since(startTime))
	writeJSON(w, http.StatusOK, AIComparisonResponse{Error: false, Comparison: comparison})
}

// buildComparisonPrompt creates a concise prompt for AI comparison
func buildComparisonPrompt(users []models.GitHubUser) string {
	prompt := "Compare these GitHub developers briefly:\n\n"

	for i, user := range users {
		experience := calculateYears(user.CreatedAt)
		followerRatio := float64(user.Followers) / max(float64(user.Following), 1)

		prompt += fmt.Sprintf("**%s** (@%s)\n", user.Name, user.Login)
		prompt += fmt.Sprintf("• %d repos | %d followers | %.1fx ratio | %d yrs\n",
			user.PublicRepos, user.Followers, followerRatio, experience)

		if user.Company != "" {
			prompt += fmt.Sprintf("• Company: %s\n", user.Company)
		}
		if i < len(users)-1 {
			prompt += "\n"
		}
	}

	prompt += "\nProvide:\n"
	prompt += "1. **Winner**: Who has the strongest profile and why (1 sentence)\n"
	prompt += "2. **Key Differences**: 2-3 bullet points\n"
	prompt += "3. **Tip**: One actionable suggestion for each developer"

	return prompt
}

// calculateYears calculates years since account creation
func calculateYears(createdAt string) int {
	t, err := time.Parse(time.RFC3339, createdAt)
	if err != nil {
		return 0
	}
	return int(time.Since(t).Hours() / 24 / 365)
}

func max(a, b float64) float64 {
	if a > b {
		return a
	}
	return b
}

// AIAnalyzeRequest represents the request for single profile/repo analysis
type AIAnalyzeRequest struct {
	Type        string `json:"type"` // "user" or "repo"
	Username    string `json:"username,omitempty"`
	RepoOwner   string `json:"repo_owner,omitempty"`
	RepoName    string `json:"repo_name,omitempty"`
	Description string `json:"description,omitempty"`
	Language    string `json:"language,omitempty"`
	Stars       int    `json:"stars,omitempty"`
	Forks       int    `json:"forks,omitempty"`
	Followers   int    `json:"followers,omitempty"`
	PublicRepos int    `json:"public_repos,omitempty"`
}

// AIAnalyzeResponse represents the analysis response
type AIAnalyzeResponse struct {
	Error    bool   `json:"error"`
	Analysis string `json:"analysis"`
	Message  string `json:"message,omitempty"`
}

// AIAnalyzeHandler handles single profile or repo analysis
func (s *Server) AIAnalyzeHandler(w http.ResponseWriter, r *http.Request) {
	startTime := time.Now()
	clientIP := getClientIP(r)
	log.Printf("🔍 [AI] Received analyze request from %s", clientIP)

	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, AIAnalyzeResponse{Error: true, Message: "Method not allowed"})
		return
	}

	// Check rate limit
	if !s.aiLimiter.Allow(clientIP) {
		remaining := s.aiLimiter.GetRemaining(clientIP)
		log.Printf("⚠️ [AI] Rate limit exceeded for %s", clientIP)
		w.Header().Set("X-RateLimit-Remaining", fmt.Sprintf("%d", remaining))
		w.Header().Set("X-RateLimit-Limit", "10")
		w.Header().Set("Retry-After", "60")
		writeJSON(w, http.StatusTooManyRequests, AIAnalyzeResponse{
			Error:   true,
			Message: "Rate limit exceeded. Maximum 10 AI requests per minute. Please try again later.",
		})
		return
	}

	// Add rate limit headers
	remaining := s.aiLimiter.GetRemaining(clientIP)
	w.Header().Set("X-RateLimit-Remaining", fmt.Sprintf("%d", remaining))
	w.Header().Set("X-RateLimit-Limit", "10")

	var req AIAnalyzeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, AIAnalyzeResponse{Error: true, Message: "Invalid request body"})
		return
	}

	apiKey := s.config.NvidiaAPIKey
	if apiKey == "" {
		log.Printf("⚠️ [AI] NVIDIA API key not configured")
		writeJSON(w, http.StatusOK, AIAnalyzeResponse{
			Error:    false,
			Analysis: "AI analysis unavailable. NVIDIA API key not configured.",
		})
		return
	}

	// Build analysis prompt based on type
	prompt := buildAnalyzePrompt(req)
	log.Printf("🔄 [AI] Analyzing %s: %s...", req.Type, req.Username+req.RepoName)

	nvidiaReq := NVIDIARequest{
		Model: AI_MODEL_NAME,
		Messages: []NVIDIAMessage{
			{Role: "system", Content: "You are a concise GitHub analyst. Provide very brief insights in 2-3 bullet points. Maximum 80 words."},
			{Role: "user", Content: prompt},
		},
		Temperature: 0.5,
		MaxTokens:   150,
	}

	jsonData, _ := json.Marshal(nvidiaReq)
	httpReq, err := http.NewRequest("POST", NVIDIA_API_BASE+"/chat/completions", bytes.NewBuffer(jsonData))
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, AIAnalyzeResponse{Error: true, Message: "Failed to create AI request"})
		return
	}

	httpReq.Header.Set("Authorization", "Bearer "+apiKey)
	httpReq.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		log.Printf("❌ [AI] Request failed: %v", err)
		writeJSON(w, http.StatusInternalServerError, AIAnalyzeResponse{Error: true, Message: "Failed to connect to NVIDIA API"})
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	if resp.StatusCode != http.StatusOK {
		log.Printf("❌ [AI] API error: %d", resp.StatusCode)
		writeJSON(w, http.StatusInternalServerError, AIAnalyzeResponse{Error: true, Message: fmt.Sprintf("NVIDIA API error: %d", resp.StatusCode)})
		return
	}

	var nvidiaResp NVIDIAResponse
	if err := json.Unmarshal(body, &nvidiaResp); err != nil {
		log.Printf("❌ [AI] Failed to parse response: %s", string(body))
		writeJSON(w, http.StatusInternalServerError, AIAnalyzeResponse{Error: true, Message: "Failed to parse AI response"})
		return
	}

	analysis := ""
	if len(nvidiaResp.Choices) > 0 {
		analysis = nvidiaResp.Choices[0].Message.Content
	} else {
		log.Printf("⚠️ [AI] Empty choices in response: %s", string(body))
	}

	if analysis == "" {
		log.Printf("⚠️ [AI] Empty analysis, raw body: %s", string(body))
	}

	log.Printf("✅ [AI] Analysis generated in %v (len=%d)", time.Since(startTime), len(analysis))
	writeJSON(w, http.StatusOK, AIAnalyzeResponse{Error: false, Analysis: analysis})
}

// buildAnalyzePrompt creates a prompt for single entity analysis
func buildAnalyzePrompt(req AIAnalyzeRequest) string {
	if req.Type == "repo" {
		return fmt.Sprintf(`Analyze this GitHub repository briefly:

**%s/%s**
• Description: %s
• Language: %s
• Stars: %d | Forks: %d

Provide:
1. **Summary**: What this project is (1 sentence)
2. **Strengths**: 2 bullet points
3. **Suggestions**: 1-2 improvements`,
			req.RepoOwner, req.RepoName, req.Description, req.Language, req.Stars, req.Forks)
	}

	// User analysis
	return fmt.Sprintf(`Analyze this GitHub developer briefly:

**@%s**
• Public Repos: %d
• Followers: %d

Provide:
1. **Profile Summary**: 1 sentence overview
2. **Strengths**: 2 bullet points based on activity
3. **Growth Tip**: 1 actionable suggestion`,
		req.Username, req.PublicRepos, req.Followers)
}
