// Package handlers provides HTTP middleware
package handlers

import (
	"log"
	"net/http"
	"time"
)

// CORSMiddleware adds CORS headers
func CORSMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Log request
		startTime := time.Now()
		log.Printf("📥 [%s] %s %s from %s", time.Now().Format("15:04:05"), r.Method, r.URL.Path, r.RemoteAddr)

		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			log.Printf("✅ [%s] OPTIONS preflight for %s - %v", time.Now().Format("15:04:05"), r.URL.Path, time.Since(startTime))
			return
		}

		next(w, r)

		// Log response
		duration := time.Since(startTime)
		log.Printf("📤 [%s] Response sent for %s - Duration: %v", time.Now().Format("15:04:05"), r.URL.Path, duration)
	}
}
