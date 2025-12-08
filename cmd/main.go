// GitHub Status API - Pure Go Implementation
// Clean Architecture with Package Structure
package main

import (
	"fmt"
	"log"
	"net/http"
	"strings"

	"github-api/internal/cache"
	"github-api/internal/config"
	"github-api/internal/handlers"
	"github-api/internal/service"

	"github.com/joho/godotenv"
)

func main() {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Println("⚠️  No .env file found, using system environment variables")
	}

	// Load configuration
	cfg := config.Default()

	// Initialize cache
	cacheInstance := cache.New(cfg.MaxCacheSize, cfg.CacheTTL)

	// Initialize service
	githubService := service.NewGitHubService(cfg, cacheInstance)

	// Initialize server/handlers
	server := handlers.NewServer(cfg, cacheInstance, githubService)

	// Setup routes
	http.HandleFunc("/", handlers.CORSMiddleware(server.HomeHandler))
	http.HandleFunc("/api/health", handlers.CORSMiddleware(server.HealthHandler))
	http.HandleFunc("/api/cache/stats", handlers.CORSMiddleware(server.CacheStatsHandler))
	http.HandleFunc("/api/cache/clear", handlers.CORSMiddleware(server.CacheClearHandler))
	http.HandleFunc("/api/status/", handlers.CORSMiddleware(server.GetStatusByPathHandler))
	http.HandleFunc("/api/status", handlers.CORSMiddleware(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "POST" {
			server.GetStatusByBodyHandler(w, r)
		} else if r.Method == "GET" {
			http.NotFound(w, r)
		}
	}))
	http.HandleFunc("/api/batch", handlers.CORSMiddleware(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "POST" {
			server.BatchHandler(w, r)
		} else {
			http.NotFound(w, r)
		}
	}))
	http.HandleFunc("/api/ai/compare", handlers.CORSMiddleware(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "POST" {
			server.AIComparisonHandler(w, r)
		} else {
			http.NotFound(w, r)
		}
	}))

	// Print startup info
	fmt.Println("=" + strings.Repeat("=", 69))
	fmt.Println("🚀 GitHub Status API - Pure Go with Clean Architecture")
	fmt.Println("=" + strings.Repeat("=", 69))
	fmt.Printf("✅ Server: http://localhost%s\n", cfg.ServerPort)
	fmt.Printf("💾 Cache: Enabled (TTL: %v, Max: %d)\n", cfg.CacheTTL, cfg.MaxCacheSize)
	fmt.Printf("📦 Architecture: Clean package-based structure\n")
	fmt.Printf("⚡ Concurrency: Batch processing with goroutines\n")
	fmt.Printf("🔥 Performance: Native Go - Zero dependencies\n")
	if cfg.NvidiaAPIKey != "" {
		fmt.Printf("🤖 AI: NVIDIA API Enabled\n")
	} else {
		fmt.Printf("⚠️  AI: NVIDIA API key not configured\n")
	}
	fmt.Println("=" + strings.Repeat("=", 69))
	fmt.Printf("\nPackage Structure:\n")
	fmt.Println("  internal/")
	fmt.Println("    ├── config/    - Application configuration")
	fmt.Println("    ├── models/    - Data structures")
	fmt.Println("    ├── cache/     - LRU cache with TTL")
	fmt.Println("    ├── service/   - Business logic")
	fmt.Println("    └── handlers/  - HTTP handlers & AI")
	fmt.Println("=" + strings.Repeat("=", 69))
	fmt.Printf("\nStarting server on port %s...\n", cfg.ServerPort)

	// Start server
	log.Fatal(http.ListenAndServe(cfg.ServerPort, nil))
}
