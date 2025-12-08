// Package handlers provides HTTP request handlers
package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"

	"github-api/internal/models"
)

const (
	NVIDIA_API_BASE = "https://integrate.api.nvidia.com/v1"
)

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
	log.Printf("🤖 [AI] Received AI comparison request from %s", r.RemoteAddr)

	if r.Method != http.MethodPost {
		log.Printf("❌ [AI] Invalid method: %s", r.Method)
		writeJSON(w, http.StatusMethodNotAllowed, AIComparisonResponse{
			Error:   true,
			Message: "Method not allowed",
		})
		return
	}

	// Parse request
	var req AIComparisonRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("❌ [AI] Failed to parse request: %v", err)
		writeJSON(w, http.StatusBadRequest, AIComparisonResponse{
			Error:   true,
			Message: "Invalid request body",
		})
		return
	}

	log.Printf("📊 [AI] Comparing %d users", len(req.Users))

	// Check if NVIDIA API key is configured
	apiKey := s.config.NvidiaAPIKey
	if apiKey == "" {
		log.Printf("⚠️ [AI] NVIDIA API key not configured")
		writeJSON(w, http.StatusOK, AIComparisonResponse{
			Error:      false,
			Comparison: "NVIDIA API key not configured. Please set NVIDIA_API_KEY environment variable.",
		})
		return
	}

	// Build prompt
	prompt := "Compare these GitHub developers and provide insights:\n\n"
	for i, user := range req.Users {
		prompt += fmt.Sprintf("Developer %d: %s\n", i+1, user.Name)
		prompt += fmt.Sprintf("- Username: @%s\n", user.Login)
		prompt += fmt.Sprintf("- Repos: %d\n", user.PublicRepos)
		prompt += fmt.Sprintf("- Followers: %d\n", user.Followers)
		prompt += fmt.Sprintf("- Following: %d\n", user.Following)
		if user.Company != "" {
			prompt += fmt.Sprintf("- Company: %s\n", user.Company)
		}
		if user.Location != "" {
			prompt += fmt.Sprintf("- Location: %s\n", user.Location)
		}
		if user.Bio != "" {
			prompt += fmt.Sprintf("- Bio: %s\n", user.Bio)
		}
		prompt += "\n"
	}
	prompt += "Provide a brief comparison highlighting key differences, strengths, and suggestions. Keep it concise (2-3 sentences per section)."

	log.Printf("🔄 [AI] Sending request to NVIDIA API...")

	// Call NVIDIA API
	nvidiaReq := NVIDIARequest{
		Model: "meta/llama-3.1-8b-instruct",
		Messages: []NVIDIAMessage{
			{
				Role:    "user",
				Content: prompt,
			},
		},
		Temperature: 0.7,
		MaxTokens:   500,
	}

	jsonData, _ := json.Marshal(nvidiaReq)
	httpReq, err := http.NewRequest("POST", NVIDIA_API_BASE+"/chat/completions", bytes.NewBuffer(jsonData))
	if err != nil {
		log.Printf("❌ [AI] Failed to create request: %v", err)
		writeJSON(w, http.StatusInternalServerError, AIComparisonResponse{
			Error:   true,
			Message: "Failed to create AI request",
		})
		return
	}

	httpReq.Header.Set("Authorization", "Bearer "+apiKey)
	httpReq.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		log.Printf("❌ [AI] NVIDIA API request failed: %v", err)
		writeJSON(w, http.StatusInternalServerError, AIComparisonResponse{
			Error:   true,
			Message: "Failed to connect to NVIDIA API",
		})
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	if resp.StatusCode != http.StatusOK {
		log.Printf("❌ [AI] NVIDIA API returned error: %d - %s", resp.StatusCode, string(body))
		writeJSON(w, http.StatusInternalServerError, AIComparisonResponse{
			Error:   true,
			Message: fmt.Sprintf("NVIDIA API error: %d", resp.StatusCode),
		})
		return
	}

	var nvidiaResp NVIDIAResponse
	if err := json.Unmarshal(body, &nvidiaResp); err != nil {
		log.Printf("❌ [AI] Failed to parse NVIDIA response: %v", err)
		writeJSON(w, http.StatusInternalServerError, AIComparisonResponse{
			Error:   true,
			Message: "Failed to parse AI response",
		})
		return
	}

	comparison := ""
	if len(nvidiaResp.Choices) > 0 {
		comparison = nvidiaResp.Choices[0].Message.Content
	}

	duration := time.Since(startTime)
	log.Printf("✅ [AI] Comparison generated successfully in %v", duration)
	log.Printf("📝 [AI] Response length: %d characters", len(comparison))

	writeJSON(w, http.StatusOK, AIComparisonResponse{
		Error:      false,
		Comparison: comparison,
	})
}
