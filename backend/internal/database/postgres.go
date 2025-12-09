// Package database provides PostgreSQL database connection and operations
package database

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"time"

	_ "github.com/lib/pq"
)

// DB wraps the database connection
type DB struct {
	*sql.DB
}

// Config holds database configuration
type Config struct {
	ConnectionString string
	MaxOpenConns     int
	MaxIdleConns     int
	ConnMaxLifetime  time.Duration
}

// New creates a new database connection
func New(cfg Config) (*DB, error) {
	db, err := sql.Open("postgres", cfg.ConnectionString)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	// Configure connection pool
	db.SetMaxOpenConns(cfg.MaxOpenConns)
	db.SetMaxIdleConns(cfg.MaxIdleConns)
	db.SetConnMaxLifetime(cfg.ConnMaxLifetime)

	// Test connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := db.PingContext(ctx); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	log.Println("✅ PostgreSQL connected successfully")

	return &DB{db}, nil
}

// Close closes the database connection
func (db *DB) Close() error {
	return db.DB.Close()
}

// InitSchema creates database tables if they don't exist
func (db *DB) InitSchema(ctx context.Context) error {
	schema := `
	-- Users table
	CREATE TABLE IF NOT EXISTS users (
		id SERIAL PRIMARY KEY,
		github_id BIGINT UNIQUE NOT NULL,
		username VARCHAR(255) UNIQUE NOT NULL,
		name VARCHAR(255),
		email VARCHAR(255),
		avatar_url TEXT,
		bio TEXT,
		location VARCHAR(255),
		company VARCHAR(255),
		blog VARCHAR(255),
		twitter_username VARCHAR(255),
		public_repos INT DEFAULT 0,
		public_gists INT DEFAULT 0,
		followers INT DEFAULT 0,
		following INT DEFAULT 0,
		access_token TEXT NOT NULL,
		refresh_token TEXT,
		token_expires_at TIMESTAMP,
		has_private_access BOOLEAN DEFAULT FALSE,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		last_login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

	-- User search history
	CREATE TABLE IF NOT EXISTS search_history (
		id SERIAL PRIMARY KEY,
		user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		searched_username VARCHAR(255) NOT NULL,
		search_type VARCHAR(50) NOT NULL, -- 'single', 'batch', 'comparison'
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

	-- User rankings cache
	CREATE TABLE IF NOT EXISTS user_rankings (
		id SERIAL PRIMARY KEY,
		username VARCHAR(255) UNIQUE NOT NULL,
		github_id BIGINT UNIQUE NOT NULL,
		avatar_url TEXT,
		score DECIMAL(10, 2) NOT NULL,
		followers INT DEFAULT 0,
		public_repos INT DEFAULT 0,
		total_stars INT DEFAULT 0,
		total_forks INT DEFAULT 0,
		contribution_count INT DEFAULT 0,
		rank_position INT,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

	-- User activity logs
	CREATE TABLE IF NOT EXISTS activity_logs (
		id SERIAL PRIMARY KEY,
		user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		action VARCHAR(100) NOT NULL,
		metadata JSONB,
		ip_address VARCHAR(45),
		user_agent TEXT,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

	-- Sessions table
	CREATE TABLE IF NOT EXISTS sessions (
		id VARCHAR(255) PRIMARY KEY,
		user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		expires_at TIMESTAMP NOT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

	-- User private GitHub data (only accessible to authenticated users)
	CREATE TABLE IF NOT EXISTS user_private_data (
		id SERIAL PRIMARY KEY,
		user_id INT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		github_id BIGINT UNIQUE NOT NULL,
		
		-- Private repository stats
		private_repos INT DEFAULT 0,
		owned_private_repos INT DEFAULT 0,
		total_private_repos INT DEFAULT 0,
		
		-- Private gists
		private_gists INT DEFAULT 0,
		
		-- Account details
		disk_usage BIGINT DEFAULT 0,
		collaborators INT DEFAULT 0,
		two_factor_enabled BOOLEAN DEFAULT FALSE,
		
		-- Plan information
		plan_name VARCHAR(100),
		plan_space BIGINT DEFAULT 0,
		plan_collaborators INT DEFAULT 0,
		plan_private_repos INT DEFAULT 0,
		
		-- Email settings
		primary_email VARCHAR(255),
		emails_count INT DEFAULT 0,
		verified_emails_count INT DEFAULT 0,
		
		-- Organization membership
		organizations_count INT DEFAULT 0,
		organizations_data JSONB,
		
		-- Repository details
		starred_repos_count INT DEFAULT 0,
		watching_repos_count INT DEFAULT 0,
		
		-- SSH/GPG keys
		ssh_keys_count INT DEFAULT 0,
		gpg_keys_count INT DEFAULT 0,
		
		-- Recent private activity (stored as JSON for flexibility)
		recent_private_repos JSONB,
		recent_events JSONB,
		
		-- Timestamps
		fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

	-- Indexes for performance
	CREATE INDEX IF NOT EXISTS idx_users_github_id ON users(github_id);
	CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
	CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id);
	CREATE INDEX IF NOT EXISTS idx_search_history_created_at ON search_history(created_at DESC);
	CREATE INDEX IF NOT EXISTS idx_user_rankings_score ON user_rankings(score DESC);
	CREATE INDEX IF NOT EXISTS idx_user_rankings_rank ON user_rankings(rank_position);
	CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
	CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
	CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
	CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
	CREATE INDEX IF NOT EXISTS idx_user_private_data_user_id ON user_private_data(user_id);
	CREATE INDEX IF NOT EXISTS idx_user_private_data_github_id ON user_private_data(github_id);
	`

	_, err := db.ExecContext(ctx, schema)
	if err != nil {
		return fmt.Errorf("failed to initialize schema: %w", err)
	}

	log.Println("✅ Database schema initialized")
	return nil
}
