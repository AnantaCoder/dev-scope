// Package handlers provides search history HTTP handlers
package handlers

import (
	"context"
	"log"
	"net/http"
	"strconv"

	"github-api/backend/internal/models"
	"github-api/backend/internal/repository"
)

// SearchHandler handles search history routes
type SearchHandler struct {
	userRepo *repository.UserRepository
}

// NewSearchHandler creates a new search handler
func NewSearchHandler(userRepo *repository.UserRepository) *SearchHandler {
	return &SearchHandler{
		userRepo: userRepo,
	}
}

// GetSearchHistoryHandler retrieves user's search history
func (h *SearchHandler) GetSearchHistoryHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]interface{}{
			"error":   true,
			"message": "Method not allowed",
		})
		return
	}

	user, ok := r.Context().Value("user").(*models.User)
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]interface{}{
			"error":   true,
			"message": "Unauthorized",
		})
		return
	}

	// Get limit from query params (default: 50, max: 100)
	limit := 50
	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil {
			if parsedLimit > 0 && parsedLimit <= 100 {
				limit = parsedLimit
			}
		}
	}

	ctx := r.Context()
	history, err := h.userRepo.GetUserSearchHistory(ctx, user.ID, limit)
	if err != nil {
		log.Printf("❌ [Search] Failed to get search history for user %d: %v", user.ID, err)
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{
			"error":   true,
			"message": "Failed to retrieve search history",
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"error":   false,
		"history": history,
		"count":   len(history),
	})
}

// LogSearchHistory logs a search to the user's history
func (h *SearchHandler) LogSearchHistory(ctx context.Context, userID int, searchedUsername, searchType string) {
	history := &models.SearchHistory{
		UserID:           userID,
		SearchedUsername: searchedUsername,
		SearchType:       searchType,
	}

	if err := h.userRepo.AddSearchHistory(ctx, history); err != nil {
		// Log but don't fail the request
		log.Printf("⚠️ [Search] Failed to log search history: %v", err)
	}
}
