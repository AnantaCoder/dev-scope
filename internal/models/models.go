// Package models defines data structures
package models

// GitHubUser represents the GitHub user data structure
type GitHubUser struct {
	Login           string `json:"login"`
	Name            string `json:"name"`
	Bio             string `json:"bio"`
	PublicRepos     int    `json:"public_repos"`
	Followers       int    `json:"followers"`
	Following       int    `json:"following"`
	CreatedAt       string `json:"created_at"`
	UpdatedAt       string `json:"updated_at"`
	AvatarURL       string `json:"avatar_url"`
	HTMLURL         string `json:"html_url"`
	Location        string `json:"location"`
	Company         string `json:"company"`
	Blog            string `json:"blog"`
	TwitterUsername string `json:"twitter_username"`
	PublicGists     int    `json:"public_gists"`
}

// APIResponse represents a standard API response
type APIResponse struct {
	Error   bool        `json:"error"`
	Cached  bool        `json:"cached,omitempty"`
	Data    interface{} `json:"data,omitempty"`
	Message string      `json:"message,omitempty"`
}

// BatchResponse represents a batch request response
type BatchResponse struct {
	Error   bool                   `json:"error"`
	Results map[string]interface{} `json:"results"`
}

// UsernameRequest represents a username request body
type UsernameRequest struct {
	Username string `json:"username"`
}

// BatchRequest represents a batch request body
type BatchRequest struct {
	Usernames []string `json:"usernames"`
}

// HealthResponse represents health check response
type HealthResponse struct {
	Status        string `json:"status"`
	Server        string `json:"server"`
	Language      string `json:"language"`
	CacheEnabled  bool   `json:"cache_enabled"`
	CacheSize     int    `json:"cache_size"`
	UptimeSeconds string `json:"uptime_seconds"`
}

// CacheStats represents cache statistics
type CacheStats struct {
	Size    int    `json:"size"`
	Hits    int64  `json:"hits"`
	Misses  int64  `json:"misses"`
	HitRate string `json:"hit_rate"`
}
