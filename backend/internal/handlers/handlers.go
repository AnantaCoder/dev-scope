// Package handlers provides HTTP request handlers
package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github-api/backend/internal/cache"
	"github-api/backend/internal/config"
	"github-api/backend/internal/models"
	"github-api/backend/internal/repository"
	"github-api/backend/internal/service"
)

// Server holds the application state
type Server struct {
	service        *service.GitHubService
	rankingService *service.RankingService
	cache          *cache.Cache
	config         *config.Config
	startTime      time.Time
	aiLimiter      *RateLimiter
	searchHandler  *SearchHandler
	devaiRepo      *repository.DevAIRepository
}

// NewServer creates a new server instance
func NewServer(cfg *config.Config, c *cache.Cache, svc *service.GitHubService, rankingSvc *service.RankingService, searchHandler *SearchHandler) *Server {
	return &Server{
		service:        svc,
		rankingService: rankingSvc,
		cache:          c,
		config:         cfg,
		startTime:      time.Now(),
		// AI rate limit: 10 requests per minute per IP
		aiLimiter:     NewRateLimiter(10, time.Minute),
		searchHandler: searchHandler,
	}
}

// SetDevAIRepository sets the DevAI repository (called from main.go after initialization)
func (s *Server) SetDevAIRepository(repo *repository.DevAIRepository) {
	s.devaiRepo = repo
}

// HomeHandler handles the home endpoint
func (s *Server) HomeHandler(w http.ResponseWriter, r *http.Request) {
	response := map[string]interface{}{
		"message":      "GitHub Status API v2.0.0 - Pure Go Implementation",
		"architecture": "Clean Architecture with Package Structure",
		"features": []string{
			"High-performance concurrent processing",
			"Thread-safe LRU cache with TTL",
			"Batch processing with goroutines",
			"Clean package-based architecture",
			"Native Go performance",
		},
		"endpoints": map[string]string{
			"GET /api/status/{username}":        "Fetch GitHub status for a username",
			"GET /api/user/{username}/extended": "Fetch extended user info with tech stack & streak",
			"POST /api/status":                  "Fetch GitHub status (JSON body)",
			"POST /api/batch":                   "Fetch status for multiple users",
			"POST /api/ai/compare":              "AI-powered user comparison",
			"POST /api/ai/analyze":              "AI-powered single user/repo analysis",
			"GET /api/search/history":           "Get user's search history (authenticated)",
			"GET /api/health":                   "Health check with cache stats",
			"GET /api/cache/stats":              "Cache statistics",
			"POST /api/cache/clear":             "Clear cache",
		},
	}
	writeJSON(w, http.StatusOK, response)
}

// HealthHandler handles health check endpoint
func (s *Server) HealthHandler(w http.ResponseWriter, r *http.Request) {
	// Set headers immediately for Railway health checks
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	uptime := time.Since(s.startTime).Seconds()
	response := models.HealthResponse{
		Status:        "healthy",
		Server:        "running",
		Language:      "Go",
		CacheEnabled:  true,
		CacheSize:     s.cache.Size(),
		UptimeSeconds: fmt.Sprintf("%.2f", uptime),
	}

	// Write response immediately
	json.NewEncoder(w).Encode(response)
}

// CacheStatsHandler returns cache statistics
func (s *Server) CacheStatsHandler(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, s.cache.Stats())
}

// CacheClearHandler clears the cache
func (s *Server) CacheClearHandler(w http.ResponseWriter, r *http.Request) {
	s.cache.Clear()
	writeJSON(w, http.StatusOK, map[string]string{"message": "Cache cleared successfully"})
}

// GetStatusByPathHandler handles GET /api/status/{username}
func (s *Server) GetStatusByPathHandler(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/api/status/")
	username := strings.TrimSpace(path)

	if username == "" {
		writeJSON(w, http.StatusBadRequest, models.APIResponse{Error: true, Message: "Username cannot be empty"})
		return
	}

	// Log search history if user is authenticated
	if user, ok := r.Context().Value("user").(*models.User); ok && s.searchHandler != nil {
		go s.searchHandler.LogSearchHistory(context.Background(), user.ID, username, "status")
	}

	useCache := r.URL.Query().Get("no_cache") != "true"
	result, err := s.service.GetUserStatus(username, useCache)
	if err != nil {
		status := http.StatusInternalServerError
		if strings.Contains(err.Error(), "404") {
			status = http.StatusNotFound
		}
		writeJSON(w, status, result)
		return
	}

	// Only update ranking if the searched username matches an authenticated user
	// This ensures only GitHub OAuth logged-in users appear in the leaderboard
	if authUser, ok := r.Context().Value("user").(*models.User); ok && authUser.Username == username {
		if s.rankingService != nil {
			go func(user string) {
				ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
				defer cancel()

				if err := s.rankingService.UpdateUserRanking(ctx, user); err != nil {
					fmt.Printf("⚠️ [Ranking] Failed to update ranking for %s: %v\n", user, err)
				}
			}(username)
		}
	}

	writeJSON(w, http.StatusOK, result)
}

// GetStatusByBodyHandler handles POST /api/status
func (s *Server) GetStatusByBodyHandler(w http.ResponseWriter, r *http.Request) {
	var req models.UsernameRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, models.APIResponse{Error: true, Message: "Invalid JSON body"})
		return
	}

	username := strings.TrimSpace(req.Username)
	if username == "" {
		writeJSON(w, http.StatusBadRequest, models.APIResponse{Error: true, Message: "Username cannot be empty"})
		return
	}

	// Log search history if user is authenticated
	if user, ok := r.Context().Value("user").(*models.User); ok && s.searchHandler != nil {
		go s.searchHandler.LogSearchHistory(context.Background(), user.ID, username, "status")
	}

	useCache := r.URL.Query().Get("no_cache") != "true"
	result, err := s.service.GetUserStatus(username, useCache)
	if err != nil {
		status := http.StatusInternalServerError
		if strings.Contains(err.Error(), "404") {
			status = http.StatusNotFound
		}
		writeJSON(w, status, result)
		return
	}

	writeJSON(w, http.StatusOK, result)
}

// BatchHandler handles POST /api/batch
func (s *Server) BatchHandler(w http.ResponseWriter, r *http.Request) {
	var req models.BatchRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, models.APIResponse{Error: true, Message: "Invalid JSON body"})
		return
	}

	if len(req.Usernames) == 0 {
		writeJSON(w, http.StatusBadRequest, models.APIResponse{Error: true, Message: "Usernames array cannot be empty"})
		return
	}

	if len(req.Usernames) > s.config.MaxBatchSize {
		writeJSON(w, http.StatusBadRequest, models.APIResponse{
			Error:   true,
			Message: fmt.Sprintf("Maximum %d usernames allowed per batch", s.config.MaxBatchSize),
		})
		return
	}

	// Log search history for batch/compare if user is authenticated
	if user, ok := r.Context().Value("user").(*models.User); ok && s.searchHandler != nil {
		for _, username := range req.Usernames {
			username = strings.TrimSpace(username)
			if username != "" {
				go s.searchHandler.LogSearchHistory(context.Background(), user.ID, username, "compare")
			}
		}
	}

	result := s.service.GetBatchStatus(req.Usernames)
	writeJSON(w, http.StatusOK, result)
}

// GetExtendedUserHandler handles GET /api/user/{username}/extended
func (s *Server) GetExtendedUserHandler(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/api/user/")
	path = strings.TrimSuffix(path, "/extended")
	username := strings.TrimSpace(path)

	if username == "" {
		writeJSON(w, http.StatusBadRequest, models.APIResponse{Error: true, Message: "Username cannot be empty"})
		return
	}

	// Log search history if user is authenticated
	if user, ok := r.Context().Value("user").(*models.User); ok && s.searchHandler != nil {
		go s.searchHandler.LogSearchHistory(context.Background(), user.ID, username, "extended")
	}

	useCache := r.URL.Query().Get("no_cache") != "true"
	result, err := s.service.GetExtendedUserInfo(username, useCache)
	if err != nil {
		status := http.StatusInternalServerError
		if strings.Contains(err.Error(), "404") {
			status = http.StatusNotFound
		}
		writeJSON(w, status, models.APIResponse{Error: true, Message: err.Error()})
		return
	}

	// Only update ranking if the searched username matches an authenticated user
	// This ensures only GitHub OAuth logged-in users appear in the leaderboard
	if authUser, ok := r.Context().Value("user").(*models.User); ok && authUser.Username == username {
		if s.rankingService != nil {
			go func(user string) {
				ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
				defer cancel()

				if err := s.rankingService.UpdateUserRanking(ctx, user); err != nil {
					fmt.Printf("⚠️ [Ranking] Failed to update ranking for %s: %v\n", user, err)
				}
			}(username)
		}
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{"error": false, "data": result})
}

// writeJSON writes JSON response
func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}
