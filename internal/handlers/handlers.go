// Package handlers provides HTTP request handlers
package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github-api/internal/cache"
	"github-api/internal/config"
	"github-api/internal/models"
	"github-api/internal/service"
)

// Server holds the application state
type Server struct {
	service   *service.GitHubService
	cache     *cache.Cache
	config    *config.Config
	startTime time.Time
}

// NewServer creates a new server instance
func NewServer(cfg *config.Config, c *cache.Cache, svc *service.GitHubService) *Server {
	return &Server{
		service:   svc,
		cache:     c,
		config:    cfg,
		startTime: time.Now(),
	}
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
			"GET /api/status/{username}": "Fetch GitHub status for a username",
			"POST /api/status":           "Fetch GitHub status (JSON body)",
			"POST /api/batch":            "Fetch status for multiple users",
			"GET /api/health":            "Health check with cache stats",
			"GET /api/cache/stats":       "Cache statistics",
			"POST /api/cache/clear":      "Clear cache",
		},
		"performance_features": map[string]string{
			"caching":          fmt.Sprintf("Enabled (TTL: %v, Max: %d)", s.config.CacheTTL, s.config.MaxCacheSize),
			"concurrent_batch": fmt.Sprintf("Up to %d users simultaneously", s.config.MaxBatchSize),
			"architecture":     "Clean separation of concerns",
		},
	}
	writeJSON(w, http.StatusOK, response)
}

// HealthHandler handles health check endpoint
func (s *Server) HealthHandler(w http.ResponseWriter, r *http.Request) {
	uptime := time.Since(s.startTime).Seconds()
	response := models.HealthResponse{
		Status:        "healthy",
		Server:        "running",
		Language:      "Go",
		CacheEnabled:  true,
		CacheSize:     s.cache.Size(),
		UptimeSeconds: fmt.Sprintf("%.2f", uptime),
	}
	writeJSON(w, http.StatusOK, response)
}

// CacheStatsHandler returns cache statistics
func (s *Server) CacheStatsHandler(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, s.cache.Stats())
}

// CacheClearHandler clears the cache
func (s *Server) CacheClearHandler(w http.ResponseWriter, r *http.Request) {
	s.cache.Clear()
	writeJSON(w, http.StatusOK, map[string]string{
		"message": "Cache cleared successfully",
	})
}

// GetStatusByPathHandler handles GET /api/status/{username}
func (s *Server) GetStatusByPathHandler(w http.ResponseWriter, r *http.Request) {
	// Extract username from path
	path := strings.TrimPrefix(r.URL.Path, "/api/status/")
	username := strings.TrimSpace(path)

	if username == "" {
		writeJSON(w, http.StatusBadRequest, models.APIResponse{
			Error:   true,
			Message: "Username cannot be empty",
		})
		return
	}

	// Check for no_cache query parameter
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

// GetStatusByBodyHandler handles POST /api/status
func (s *Server) GetStatusByBodyHandler(w http.ResponseWriter, r *http.Request) {
	var req models.UsernameRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, models.APIResponse{
			Error:   true,
			Message: "Invalid JSON body",
		})
		return
	}

	username := strings.TrimSpace(req.Username)
	if username == "" {
		writeJSON(w, http.StatusBadRequest, models.APIResponse{
			Error:   true,
			Message: "Username cannot be empty",
		})
		return
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
		writeJSON(w, http.StatusBadRequest, models.APIResponse{
			Error:   true,
			Message: "Invalid JSON body",
		})
		return
	}

	if len(req.Usernames) == 0 {
		writeJSON(w, http.StatusBadRequest, models.APIResponse{
			Error:   true,
			Message: "Usernames array cannot be empty",
		})
		return
	}

	if len(req.Usernames) > s.config.MaxBatchSize {
		writeJSON(w, http.StatusBadRequest, models.APIResponse{
			Error:   true,
			Message: fmt.Sprintf("Maximum %d usernames allowed per batch", s.config.MaxBatchSize),
		})
		return
	}

	result := s.service.GetBatchStatus(req.Usernames)
	writeJSON(w, http.StatusOK, result)
}

// writeJSON writes JSON response
func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}
