// GitHub Analytics API - Full-Stack with Authentication
// Clean Architecture with PostgreSQL Integration
package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github-api/backend/internal/auth"
	"github-api/backend/internal/cache"
	"github-api/backend/internal/config"
	"github-api/backend/internal/database"
	"github-api/backend/internal/handlers"
	"github-api/backend/internal/repository"
	"github-api/backend/internal/service"

	"github.com/joho/godotenv"
)

func main() {
	// Load .env file - try multiple locations
	if err := godotenv.Load(); err != nil {
		if err := godotenv.Load("../.env"); err != nil {
			if err := godotenv.Load("../../.env"); err != nil {
				log.Println("⚠️  No .env file found, using system environment variables")
			}
		}
	}

	// Load configuration
	cfg := config.Default()

	// Log environment for debugging
	log.Printf("🔍 PORT from environment: %s", os.Getenv("PORT"))
	log.Printf("🔍 Final server port: %s", cfg.ServerPort)

	// Validate required configuration
	if cfg.DatabaseURL == "" {
		log.Fatal("❌ DATABASE_URL is required")
	}
	if cfg.GitHubClientID == "" || cfg.GitHubClientSecret == "" {
		log.Fatal("❌ GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET are required")
	}

	// Initialize database
	dbCfg := database.Config{
		ConnectionString: cfg.DatabaseURL,
		MaxOpenConns:     cfg.MaxDBConnections,
		MaxIdleConns:     5,
		ConnMaxLifetime:  cfg.DBConnMaxLifetime,
	}

	db, err := database.New(dbCfg)
	if err != nil {
		log.Fatalf("❌ Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Initialize database schema
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	if err := db.InitSchema(ctx); err != nil {
		cancel()
		log.Fatalf("❌ Failed to initialize schema: %v", err)
	}
	cancel()

	// Initialize cache
	cacheInstance := cache.New(cfg.MaxCacheSize, cfg.CacheTTL)

	// Initialize repositories
	userRepo := repository.NewUserRepository(db)
	rankingRepo := repository.NewRankingRepository(db)
	privateDataRepo := repository.NewPrivateDataRepository(db)

	// Initialize services
	githubService := service.NewGitHubService(cfg, cacheInstance)
	rankingService := service.NewRankingService(rankingRepo, githubService)
	privateDataService := service.NewPrivateDataService(privateDataRepo)

	// Initialize auth service
	authConfig := auth.GitHubOAuthConfig{
		ClientID:     cfg.GitHubClientID,
		ClientSecret: cfg.GitHubClientSecret,
		RedirectURL:  cfg.GitHubRedirectURL,
		Scopes:       []string{"read:user", "user:email", "repo"},
	}
	authService := auth.NewAuthService(authConfig, userRepo)

	// Initialize handlers
	searchHandler := handlers.NewSearchHandler(userRepo)
	server := handlers.NewServer(cfg, cacheInstance, githubService, rankingService, searchHandler)
	authHandler := handlers.NewAuthHandler(authService, userRepo, cfg.FrontendURL, rankingService)
	rankingHandler := handlers.NewRankingHandler(rankingService)
	privateDataHandler := handlers.NewPrivateDataHandler(privateDataService, authService)
	authMiddleware := handlers.NewAuthMiddleware(authService)

	// Setup routes - Public endpoints
	http.HandleFunc("/", handlers.SecureCORSMiddleware(server.HomeHandler))

	// Health check endpoints - NO CORS for Railway health checks
	http.HandleFunc("/api/health", handlers.SecurityMiddleware(server.HealthHandler))
	http.HandleFunc("/health", handlers.SecurityMiddleware(server.HealthHandler))  // Alternative endpoint
	http.HandleFunc("/healthz", handlers.SecurityMiddleware(server.HealthHandler)) // Kubernetes-style

	// Auth endpoints
	http.HandleFunc("/api/auth/login", handlers.SecureCORSMiddleware(authHandler.LoginHandler))
	http.HandleFunc("/api/auth/callback", handlers.SecurityMiddleware(authHandler.CallbackHandler)) // No CORS for OAuth callback
	http.HandleFunc("/api/auth/logout", handlers.SecureCORSMiddleware(authHandler.LogoutHandler))
	http.HandleFunc("/api/auth/me", handlers.SecureCORSMiddleware(authMiddleware.RequireAuth(authHandler.MeHandler)))
	http.HandleFunc("/api/auth/me/full", handlers.SecureCORSMiddleware(authMiddleware.RequireAuth(authHandler.MeFullHandler)))

	// Search history endpoints (protected)
	http.HandleFunc("/api/search/history", handlers.SecureCORSMiddleware(authMiddleware.RequireAuth(searchHandler.GetSearchHistoryHandler)))

	// Private data endpoints (protected - users can ONLY access their own data)
	http.HandleFunc("/api/me/private", handlers.SecureCORSMiddleware(authMiddleware.RequireAuth(privateDataHandler.GetMyPrivateDataHandler)))
	http.HandleFunc("/api/me/private/refresh", handlers.SecureCORSMiddleware(authMiddleware.RequireAuth(privateDataHandler.RefreshPrivateDataHandler)))

	// Notification endpoints (protected)
	http.HandleFunc("/api/notifications", handlers.SecureCORSMiddleware(authMiddleware.RequireAuth(authHandler.NotificationsHandler)))
	http.HandleFunc("/api/notifications/", handlers.SecureCORSMiddleware(authMiddleware.RequireAuth(authHandler.MarkNotificationReadHandler)))

	// Rankings endpoints (public)
	http.HandleFunc("/api/rankings", handlers.SecureCORSMiddleware(rankingHandler.GetRankingsHandler))
	http.HandleFunc("/api/rankings/", handlers.SecureCORSMiddleware(rankingHandler.GetUserRankHandler))

	// Protected endpoints (require authentication)
	http.HandleFunc("/api/rankings/update", handlers.SecureCORSMiddleware(authMiddleware.RequireAuth(rankingHandler.UpdateUserRankHandler)))

	// Cache endpoints (public for now, can be protected later)
	http.HandleFunc("/api/cache/stats", handlers.SecureCORSMiddleware(server.CacheStatsHandler))
	http.HandleFunc("/api/cache/clear", handlers.SecureCORSMiddleware(server.CacheClearHandler))

	// User lookup endpoints (optionally authenticated)
	http.HandleFunc("/api/status/", handlers.SecureCORSMiddleware(authMiddleware.OptionalAuth(server.GetStatusByPathHandler)))
	http.HandleFunc("/api/status", handlers.SecureCORSMiddleware(authMiddleware.OptionalAuth(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "POST" {
			server.GetStatusByBodyHandler(w, r)
		} else {
			http.NotFound(w, r)
		}
	})))
	http.HandleFunc("/api/batch", handlers.SecureCORSMiddleware(authMiddleware.OptionalAuth(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "POST" {
			server.BatchHandler(w, r)
		} else {
			http.NotFound(w, r)
		}
	})))
	http.HandleFunc("/api/ai/compare", handlers.SecureCORSMiddleware(authMiddleware.OptionalAuth(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "POST" {
			server.AIComparisonHandler(w, r)
		} else {
			http.NotFound(w, r)
		}
	})))
	http.HandleFunc("/api/user/", handlers.SecureCORSMiddleware(authMiddleware.OptionalAuth(server.GetExtendedUserHandler)))

	// Print startup info
	fmt.Println("=" + strings.Repeat("=", 75))
	fmt.Println("🚀 DevScope API - Full-Stack GitHub Analytics with Authentication")
	fmt.Println("=" + strings.Repeat("=", 75))
	fmt.Printf("✅ Server: http://localhost%s\n", cfg.ServerPort)
	fmt.Printf("🗄️  Database: PostgreSQL (Neon) Connected\n")
	fmt.Printf("💾 Cache: Enabled (TTL: %v, Max: %d)\n", cfg.CacheTTL, cfg.MaxCacheSize)
	fmt.Printf("🔐 Auth: GitHub OAuth Enabled\n")
	fmt.Printf("📊 Rankings: Enabled with scoring system\n")
	fmt.Printf("📦 Architecture: Clean MVC with repository pattern\n")
	fmt.Printf("⚡ Concurrency: Batch processing with goroutines\n")
	if cfg.NvidiaAPIKey != "" {
		fmt.Printf("🤖 AI: NVIDIA API Enabled\n")
	} else {
		fmt.Printf("⚠️  AI: NVIDIA API key not configured\n")
	}
	fmt.Println("=" + strings.Repeat("=", 75))
	fmt.Println("\n📌 Endpoints:")
	fmt.Println("   Auth:     POST /api/auth/login, /api/auth/logout, GET /api/auth/me")
	fmt.Println("   Rankings: GET  /api/rankings, /api/rankings/{username}")
	fmt.Println("   Users:    GET  /api/user/{username}, POST /api/batch")
	fmt.Println("   Search:   GET  /api/search/history (authenticated)")
	fmt.Println("   AI:       POST /api/ai/compare")
	fmt.Println("   Cache:    GET  /api/cache/stats, POST /api/cache/clear")
	fmt.Printf("\n🌐 Binding to 0.0.0.0%s (accessible from Railway)\n", cfg.ServerPort)
	fmt.Printf("📍 Health Check: http://0.0.0.0%s/api/health\n", cfg.ServerPort)
	fmt.Printf("🔧 Environment: %s\n\n", os.Getenv("ENVIRONMENT"))
	fmt.Println("✅ Server is ready to accept connections...")

	// Start server - explicitly bind to 0.0.0.0 for Railway
	addr := fmt.Sprintf("0.0.0.0%s", cfg.ServerPort)
	log.Printf("Starting HTTP server on %s\n", addr)
	log.Fatal(http.ListenAndServe(addr, nil))
}
