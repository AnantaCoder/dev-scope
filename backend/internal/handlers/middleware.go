// Package handlers provides HTTP middleware
package handlers

import (
	"log"
	"net/http"
	"os"
	"strings"
	"time"
)

// CORSMiddleware adds CORS headers and request logging
func CORSMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		startTime := time.Now()
		log.Printf("📥 [%s] %s %s from %s", time.Now().Format("15:04:05"), r.Method, r.URL.Path, r.RemoteAddr)

		// Get origin from request
		origin := r.Header.Get("Origin")

		// Validate origin against allowed origins
		allowedOrigin := getAllowedOrigin(origin)

		// Allow credentials with specific origin
		w.Header().Set("Access-Control-Allow-Origin", allowedOrigin)
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie")
		w.Header().Set("Access-Control-Expose-Headers", "Set-Cookie")
		w.Header().Set("Vary", "Origin")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next(w, r)

		duration := time.Since(startTime)
		log.Printf("📤 [%s] Response sent for %s - Duration: %v", time.Now().Format("15:04:05"), r.URL.Path, duration)
	}
}

// getAllowedOrigin validates and returns the allowed origin
func getAllowedOrigin(origin string) string {
	// Get frontend URL from environment
	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:3000"
	}

	// Normalize frontend URL (remove trailing slash)
	frontendURL = strings.TrimSuffix(frontendURL, "/")

	// List of allowed origins
	allowedOrigins := []string{
		frontendURL,
		"http://localhost:3000",
		"http://localhost:8000",
		"https://dev-scope-roan.vercel.app", // Production Vercel frontend
		"https://*.vercel.app",              // All Vercel preview deployments
	}

	// Normalize origin (remove trailing slash)
	origin = strings.TrimSuffix(origin, "/")

	// Check if origin is in allowed list
	for _, allowed := range allowedOrigins {
		// Normalize allowed origin
		allowed = strings.TrimSuffix(allowed, "/")

		if origin == allowed {
			return origin
		}
		// Handle wildcard domains (e.g., *.vercel.app)
		if strings.Contains(allowed, "*") {
			domain := strings.TrimPrefix(allowed, "https://*")
			if strings.HasSuffix(origin, domain) && strings.HasPrefix(origin, "https://") {
				return origin
			}
		}
	}

	// Default to frontend URL if origin is not recognized
	return frontendURL
}
