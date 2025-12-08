// Package config provides application configuration
package config

import (
	"os"
	"time"
)

// Config holds application configuration
type Config struct {
	ServerPort   string
	CacheTTL     time.Duration
	MaxCacheSize int
	MaxBatchSize int
	GitHubAPIURL string
	Timeout      time.Duration
	NvidiaAPIKey string
	GitHubToken  string
}

// Default returns default configuration
func Default() *Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8000"
	}

	return &Config{
		ServerPort:   ":" + port,
		CacheTTL:     5 * time.Minute,
		MaxCacheSize: 1000,
		MaxBatchSize: 10,
		GitHubAPIURL: "https://api.github.com/users/",
		Timeout:      10 * time.Second,
		NvidiaAPIKey: os.Getenv("NVIDIA_API_KEY"),
		GitHubToken:  os.Getenv("GITHUB_TOKEN"),
	}
}
