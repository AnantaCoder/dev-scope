// Package config provides application configuration
package config

import (
	"os"
	"time"
)

// Config holds application configuration
type Config struct {
	ServerPort         string
	CacheTTL           time.Duration
	MaxCacheSize       int
	MaxBatchSize       int
	GitHubAPIURL       string
	Timeout            time.Duration
	NvidiaAPIKey       string
	GitHubToken        string
	DatabaseURL        string
	GitHubClientID     string
	GitHubClientSecret string
	GitHubRedirectURL  string
	FrontendURL        string
	MaxDBConnections   int
	DBConnMaxLifetime  time.Duration
}

// Default returns default configuration
func Default() *Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:3000"
	}

	redirectURL := os.Getenv("GITHUB_REDIRECT_URL")
	if redirectURL == "" {
		redirectURL = "http://localhost:8080/api/auth/callback"
	}

	return &Config{
		ServerPort:         ":" + port,
		CacheTTL:           5 * time.Minute,
		MaxCacheSize:       1000,
		MaxBatchSize:       10,
		GitHubAPIURL:       "https://api.github.com/users/",
		Timeout:            10 * time.Second,
		NvidiaAPIKey:       os.Getenv("NVIDIA_API_KEY"),
		GitHubToken:        os.Getenv("GITHUB_TOKEN"),
		DatabaseURL:        os.Getenv("DATABASE_URL"),
		GitHubClientID:     os.Getenv("GITHUB_CLIENT_ID"),
		GitHubClientSecret: os.Getenv("GITHUB_CLIENT_SECRET"),
		GitHubRedirectURL:  redirectURL,
		FrontendURL:        frontendURL,
		MaxDBConnections:   25,
		DBConnMaxLifetime:  5 * time.Minute,
	}
}
