// Package handlers provides HTTP middleware
package handlers

import (
	"log"
	"net/http"
	"time"
)

// CORSMiddleware adds CORS headers and request logging
func CORSMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		startTime := time.Now()
		log.Printf("📥 [%s] %s %s from %s", time.Now().Format("15:04:05"), r.Method, r.URL.Path, r.RemoteAddr)

		// Get origin from request
		origin := r.Header.Get("Origin")
		if origin == "" {
			origin = "http://localhost:3000"
		}

		// Allow credentials with specific origin
		w.Header().Set("Access-Control-Allow-Origin", origin)
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie")
		w.Header().Set("Access-Control-Expose-Headers", "Set-Cookie")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next(w, r)

		duration := time.Since(startTime)
		log.Printf("📤 [%s] Response sent for %s - Duration: %v", time.Now().Format("15:04:05"), r.URL.Path, duration)
	}
}
