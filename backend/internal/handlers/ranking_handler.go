// Package handlers provides ranking HTTP handlers
package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	"github-api/backend/internal/models"
	"github-api/backend/internal/service"
)

// RankingHandler handles ranking routes
type RankingHandler struct {
	rankingService *service.RankingService
}

// NewRankingHandler creates a new ranking handler
func NewRankingHandler(rankingService *service.RankingService) *RankingHandler {
	return &RankingHandler{rankingService: rankingService}
}

// GetRankingsHandler returns paginated user rankings
func (h *RankingHandler) GetRankingsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]interface{}{
			"error":   true,
			"message": "Method not allowed",
		})
		return
	}

	// Parse query parameters
	pageStr := r.URL.Query().Get("page")
	pageSizeStr := r.URL.Query().Get("page_size")

	page := 1
	pageSize := 50

	if pageStr != "" {
		if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
			page = p
		}
	}

	if pageSizeStr != "" {
		if ps, err := strconv.Atoi(pageSizeStr); err == nil && ps > 0 && ps <= 100 {
			pageSize = ps
		}
	}

	ctx := r.Context()
	response, err := h.rankingService.GetTopRankings(ctx, page, pageSize)
	if err != nil {
		log.Printf("❌ [Rankings] Failed to get rankings: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{
			"error":   true,
			"message": "Failed to retrieve rankings",
		})
		return
	}

	log.Printf("📊 [Rankings] Returned page %d with %d users", page, len(response.Rankings))
	writeJSON(w, http.StatusOK, response)
}

// GetUserRankHandler returns a specific user's ranking
func (h *RankingHandler) GetUserRankHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]interface{}{
			"error":   true,
			"message": "Method not allowed",
		})
		return
	}

	// Extract username from URL path
	username := r.URL.Path[len("/api/rankings/"):]
	if username == "" {
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{
			"error":   true,
			"message": "Username required",
		})
		return
	}

	ctx := r.Context()
	ranking, err := h.rankingService.GetUserRanking(ctx, username)
	if err != nil {
		log.Printf("⚠️ [Rankings] User %s not found in rankings", username)
		writeJSON(w, http.StatusNotFound, map[string]interface{}{
			"error":   true,
			"message": "User not found in rankings",
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"error":   false,
		"ranking": ranking,
	})
}

// UpdateUserRankHandler updates a specific user's ranking (authenticated users only)
func (h *RankingHandler) UpdateUserRankHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]interface{}{
			"error":   true,
			"message": "Method not allowed",
		})
		return
	}

	// Get current user from context
	user, ok := r.Context().Value("user").(*models.User)
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]interface{}{
			"error":   true,
			"message": "Unauthorized",
		})
		return
	}

	// Verify user is admin (only admins can manually trigger updates)
	if !IsAdminUser(user) {
		writeJSON(w, http.StatusForbidden, map[string]interface{}{
			"error":   true,
			"message": "Forbidden: Admin access required",
		})
		return
	}

	var req struct {
		Username string `json:"username"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{
			"error":   true,
			"message": "Invalid request body",
		})
		return
	}

	if req.Username == "" {
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{
			"error":   true,
			"message": "Username required",
		})
		return
	}

	ctx := r.Context()
	if err := h.rankingService.UpdateUserRanking(ctx, req.Username); err != nil {
		log.Printf("❌ [Rankings] Failed to update ranking for %s: %v", req.Username, err)
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{
			"error":   true,
			"message": "Failed to update ranking",
		})
		return
	}

	// Get updated ranking
	ranking, err := h.rankingService.GetUserRanking(ctx, req.Username)
	if err != nil {
		writeJSON(w, http.StatusOK, map[string]interface{}{
			"error":   false,
			"message": "Ranking updated successfully",
		})
		return
	}

	log.Printf("✅ [Rankings] Updated ranking for %s", req.Username)
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"error":   false,
		"message": "Ranking updated successfully",
		"ranking": ranking,
	})
}
