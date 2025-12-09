// Package models defines data structures for users and authentication
package models

import (
	"time"
)

// User represents a registered user in the system
type User struct {
	ID               int        `json:"id" db:"id"`
	GitHubID         int64      `json:"github_id" db:"github_id"`
	Username         string     `json:"username" db:"username"`
	Name             string     `json:"name" db:"name"`
	Email            string     `json:"email,omitempty" db:"email"`
	AvatarURL        string     `json:"avatar_url" db:"avatar_url"`
	Bio              string     `json:"bio" db:"bio"`
	Location         string     `json:"location" db:"location"`
	Company          string     `json:"company" db:"company"`
	Blog             string     `json:"blog" db:"blog"`
	TwitterUsername  string     `json:"twitter_username" db:"twitter_username"`
	PublicRepos      int        `json:"public_repos" db:"public_repos"`
	PublicGists      int        `json:"public_gists" db:"public_gists"`
	Followers        int        `json:"followers" db:"followers"`
	Following        int        `json:"following" db:"following"`
	HasPrivateAccess bool       `json:"has_private_access" db:"has_private_access"`
	CreatedAt        time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at" db:"updated_at"`
	LastLoginAt      time.Time  `json:"last_login_at" db:"last_login_at"`
}

// UserWithToken includes sensitive token information (not for API responses)
type UserWithToken struct {
	User
	AccessToken   string     `json:"-" db:"access_token"`
	RefreshToken  string     `json:"-" db:"refresh_token"`
	TokenExpiresAt *time.Time `json:"-" db:"token_expires_at"`
}

// Session represents a user session
type Session struct {
	ID        string    `json:"id" db:"id"`
	UserID    int       `json:"user_id" db:"user_id"`
	ExpiresAt time.Time `json:"expires_at" db:"expires_at"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

// SearchHistory represents a user's search history entry
type SearchHistory struct {
	ID               int       `json:"id" db:"id"`
	UserID           int       `json:"user_id" db:"user_id"`
	SearchedUsername string    `json:"searched_username" db:"searched_username"`
	SearchType       string    `json:"search_type" db:"search_type"`
	CreatedAt        time.Time `json:"created_at" db:"created_at"`
}

// UserRanking represents a user's ranking in the leaderboard
type UserRanking struct {
	ID                int       `json:"id" db:"id"`
	Username          string    `json:"username" db:"username"`
	GitHubID          int64     `json:"github_id" db:"github_id"`
	AvatarURL         string    `json:"avatar_url" db:"avatar_url"`
	Score             float64   `json:"score" db:"score"`
	Followers         int       `json:"followers" db:"followers"`
	PublicRepos       int       `json:"public_repos" db:"public_repos"`
	TotalStars        int       `json:"total_stars" db:"total_stars"`
	TotalForks        int       `json:"total_forks" db:"total_forks"`
	ContributionCount int       `json:"contribution_count" db:"contribution_count"`
	RankPosition      int       `json:"rank_position" db:"rank_position"`
	UpdatedAt         time.Time `json:"updated_at" db:"updated_at"`
}

// ActivityLog represents a user activity log entry
type ActivityLog struct {
	ID         int       `json:"id" db:"id"`
	UserID     int       `json:"user_id" db:"user_id"`
	Action     string    `json:"action" db:"action"`
	Metadata   string    `json:"metadata,omitempty" db:"metadata"` // JSONB as string
	IPAddress  string    `json:"ip_address,omitempty" db:"ip_address"`
	UserAgent  string    `json:"user_agent,omitempty" db:"user_agent"`
	CreatedAt  time.Time `json:"created_at" db:"created_at"`
}

// AuthResponse represents the authentication response
type AuthResponse struct {
	Error   bool   `json:"error"`
	Message string `json:"message,omitempty"`
	User    *User  `json:"user,omitempty"`
	Token   string `json:"token,omitempty"`
}

// RankingsResponse represents the rankings list response
type RankingsResponse struct {
	Error    bool           `json:"error"`
	Rankings []UserRanking  `json:"rankings"`
	Total    int            `json:"total"`
	Page     int            `json:"page"`
	PageSize int            `json:"page_size"`
}
