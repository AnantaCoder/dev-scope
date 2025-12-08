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
		Model: "meta/llama-3.1-8b-instruct",
		Messages: []NVIDIAMessage{
			{Role: "system", Content: "You are a concise GitHub profile analyst. Provide brief, actionable insights. Use bullet points. Keep total response under 200 words."},
			{Role: "user", Content: prompt},
		},
		Temperature: 0.5,
		MaxTokens:   300,
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
