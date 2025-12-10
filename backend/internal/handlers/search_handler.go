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

	// Get page from query params (default: 1)
	page := 1
	if pageStr := r.URL.Query().Get("page"); pageStr != "" {
		if parsedPage, err := strconv.Atoi(pageStr); err == nil {
			if parsedPage > 0 {
				page = parsedPage
			}
		}
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

	// Calculate offset
	offset := (page - 1) * limit

	ctx := r.Context()

	// Fetch count and history in parallel for better performance
	type countResult struct {
		count int
		err   error
	}
	type historyResult struct {
		history []models.SearchHistory
		err     error
	}

	countChan := make(chan countResult, 1)
	historyChan := make(chan historyResult, 1)

	// Fetch count in goroutine
	go func() {
		count, err := h.userRepo.GetSearchHistoryCount(ctx, user.ID)
		countChan <- countResult{count: count, err: err}
	}()

	// Fetch history in goroutine
	go func() {
		history, err := h.userRepo.GetUserSearchHistory(ctx, user.ID, limit, offset)
		historyChan <- historyResult{history: history, err: err}
	}()

	// Wait for both results
	countRes := <-countChan
	historyRes := <-historyChan

	// Check for errors
	if countRes.err != nil {
		log.Printf("❌ [Search] Failed to get search history count for user %d: %v", user.ID, countRes.err)
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{
			"error":   true,
			"message": "Failed to retrieve search history count",
		})
		return
	}

	if historyRes.err != nil {
		log.Printf("❌ [Search] Failed to get search history for user %d: %v", user.ID, historyRes.err)
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{
			"error":   true,
			"message": "Failed to retrieve search history",
		})
		return
	}

	totalCount := countRes.count
	history := historyRes.history

	// Calculate total pages
	totalPages := (totalCount + limit - 1) / limit
	if totalPages < 1 {
		totalPages = 1
	}

	// Add cache control headers (cache for 30 seconds)
	w.Header().Set("Cache-Control", "private, max-age=30")

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"error":         false,
		"history":       history,
		"total_pages":   totalPages,
		"total_entries": totalCount,
		"pagination": map[string]interface{}{
			"page":  page,
			"limit": limit,
			"count": len(history),
		},
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
