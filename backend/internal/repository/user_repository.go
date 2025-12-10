// Package repository provides database operations for users
package repository

import (
	"context"
	"database/sql"
	"time"

	"github-api/backend/internal/database"
	"github-api/backend/internal/models"
)

// UserRepository handles user database operations
type UserRepository struct {
	db *database.DB
}

// NewUserRepository creates a new user repository
func NewUserRepository(db *database.DB) *UserRepository {
	return &UserRepository{db: db}
}

// CreateUser creates a new user
func (r *UserRepository) CreateUser(ctx context.Context, user *models.UserWithToken) error {
	query := `
		INSERT INTO users (
			github_id, username, name, email, avatar_url, bio, location, 
			company, blog, twitter_username, public_repos, public_gists, 
			followers, following, access_token, refresh_token, token_expires_at, 
			has_private_access, last_login_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
		RETURNING id, created_at, updated_at
	`

	err := r.db.QueryRowContext(
		ctx, query,
		user.GitHubID, user.Username, user.Name, user.Email, user.AvatarURL,
		user.Bio, user.Location, user.Company, user.Blog, user.TwitterUsername,
		user.PublicRepos, user.PublicGists, user.Followers, user.Following,
		user.AccessToken, user.RefreshToken, user.TokenExpiresAt, user.HasPrivateAccess,
		time.Now(),
	).Scan(&user.ID, &user.CreatedAt, &user.UpdatedAt)

	return err
}

// UpdateUser updates an existing user
func (r *UserRepository) UpdateUser(ctx context.Context, user *models.UserWithToken) error {
	query := `
		UPDATE users SET
			username = $1, name = $2, email = $3, avatar_url = $4, bio = $5,
			location = $6, company = $7, blog = $8, twitter_username = $9,
			public_repos = $10, public_gists = $11, followers = $12, following = $13,
			access_token = $14, refresh_token = $15, token_expires_at = $16,
			has_private_access = $17, updated_at = $18, last_login_at = $19
		WHERE github_id = $20
		RETURNING id
	`

	err := r.db.QueryRowContext(
		ctx, query,
		user.Username, user.Name, user.Email, user.AvatarURL, user.Bio,
		user.Location, user.Company, user.Blog, user.TwitterUsername,
		user.PublicRepos, user.PublicGists, user.Followers, user.Following,
		user.AccessToken, user.RefreshToken, user.TokenExpiresAt,
		user.HasPrivateAccess, time.Now(), time.Now(),
		user.GitHubID,
	).Scan(&user.ID)

	return err
}

// GetUserByGitHubID retrieves a user by GitHub ID
func (r *UserRepository) GetUserByGitHubID(ctx context.Context, githubID int64) (*models.UserWithToken, error) {
	query := `
		SELECT id, github_id, username, name, email, avatar_url, bio, location,
			company, blog, twitter_username, public_repos, public_gists, followers,
			following, access_token, refresh_token, token_expires_at, has_private_access,
			created_at, updated_at, last_login_at
		FROM users WHERE github_id = $1
	`

	user := &models.UserWithToken{}
	err := r.db.QueryRowContext(ctx, query, githubID).Scan(
		&user.ID, &user.GitHubID, &user.Username, &user.Name, &user.Email,
		&user.AvatarURL, &user.Bio, &user.Location, &user.Company, &user.Blog,
		&user.TwitterUsername, &user.PublicRepos, &user.PublicGists,
		&user.Followers, &user.Following, &user.AccessToken, &user.RefreshToken,
		&user.TokenExpiresAt, &user.HasPrivateAccess, &user.CreatedAt,
		&user.UpdatedAt, &user.LastLoginAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	return user, err
}

// GetUserByID retrieves a user by internal ID
func (r *UserRepository) GetUserByID(ctx context.Context, id int) (*models.User, error) {
	query := `
		SELECT id, github_id, username, name, email, avatar_url, bio, location,
			company, blog, twitter_username, public_repos, public_gists, followers,
			following, has_private_access, created_at, updated_at, last_login_at
		FROM users WHERE id = $1
	`

	user := &models.User{}
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&user.ID, &user.GitHubID, &user.Username, &user.Name, &user.Email,
		&user.AvatarURL, &user.Bio, &user.Location, &user.Company, &user.Blog,
		&user.TwitterUsername, &user.PublicRepos, &user.PublicGists,
		&user.Followers, &user.Following, &user.HasPrivateAccess,
		&user.CreatedAt, &user.UpdatedAt, &user.LastLoginAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	return user, err
}

// GetUserWithTokenByID retrieves a user with access token by internal ID
func (r *UserRepository) GetUserWithTokenByID(ctx context.Context, id int) (*models.UserWithToken, error) {
	query := `
		SELECT id, github_id, username, name, email, avatar_url, bio, location,
			company, blog, twitter_username, public_repos, public_gists, followers,
			following, access_token, refresh_token, token_expires_at, has_private_access,
			created_at, updated_at, last_login_at
		FROM users WHERE id = $1
	`

	user := &models.UserWithToken{}
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&user.ID, &user.GitHubID, &user.Username, &user.Name, &user.Email,
		&user.AvatarURL, &user.Bio, &user.Location, &user.Company, &user.Blog,
		&user.TwitterUsername, &user.PublicRepos, &user.PublicGists,
		&user.Followers, &user.Following, &user.AccessToken, &user.RefreshToken,
		&user.TokenExpiresAt, &user.HasPrivateAccess, &user.CreatedAt,
		&user.UpdatedAt, &user.LastLoginAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	return user, err
}

// CreateSession creates a new session
func (r *UserRepository) CreateSession(ctx context.Context, session *models.Session) error {
	query := `INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, $3)`
	_, err := r.db.ExecContext(ctx, query, session.ID, session.UserID, session.ExpiresAt)
	return err
}

// GetSession retrieves a session by ID
func (r *UserRepository) GetSession(ctx context.Context, sessionID string) (*models.Session, error) {
	query := `SELECT id, user_id, expires_at, created_at FROM sessions WHERE id = $1 AND expires_at > NOW()`

	session := &models.Session{}
	err := r.db.QueryRowContext(ctx, query, sessionID).Scan(
		&session.ID, &session.UserID, &session.ExpiresAt, &session.CreatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	return session, err
}

// DeleteSession deletes a session
func (r *UserRepository) DeleteSession(ctx context.Context, sessionID string) error {
	query := `DELETE FROM sessions WHERE id = $1`
	_, err := r.db.ExecContext(ctx, query, sessionID)
	return err
}

// DeleteExpiredSessions removes expired sessions
func (r *UserRepository) DeleteExpiredSessions(ctx context.Context) error {
	query := `DELETE FROM sessions WHERE expires_at < NOW()`
	_, err := r.db.ExecContext(ctx, query)
	return err
}

// AddSearchHistory adds a search history entry
func (r *UserRepository) AddSearchHistory(ctx context.Context, history *models.SearchHistory) error {
	query := `
		INSERT INTO search_history (user_id, searched_username, search_type)
		VALUES ($1, $2, $3)
		RETURNING id, created_at
	`
	return r.db.QueryRowContext(
		ctx, query,
		history.UserID, history.SearchedUsername, history.SearchType,
	).Scan(&history.ID, &history.CreatedAt)
}

// GetUserSearchHistory retrieves user's search history with pagination
func (r *UserRepository) GetUserSearchHistory(ctx context.Context, userID int, limit int, offset int) ([]models.SearchHistory, error) {
	query := `
		SELECT id, user_id, searched_username, search_type, created_at
		FROM search_history
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := r.db.QueryContext(ctx, query, userID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var history []models.SearchHistory
	for rows.Next() {
		var h models.SearchHistory
		if err := rows.Scan(&h.ID, &h.UserID, &h.SearchedUsername, &h.SearchType, &h.CreatedAt); err != nil {
			return nil, err
		}
		history = append(history, h)
	}

	return history, rows.Err()
}

// GetSearchHistoryCount returns the total count of search history entries for a user
func (r *UserRepository) GetSearchHistoryCount(ctx context.Context, userID int) (int, error) {
	var count int64
	query := `SELECT COUNT(*) FROM search_history WHERE user_id = $1`
	err := r.db.QueryRowContext(ctx, query, userID).Scan(&count)
	if err != nil {
		return 0, err
	}
	return int(count), nil
}

// LogActivity logs user activity
func (r *UserRepository) LogActivity(ctx context.Context, log *models.ActivityLog) error {
	query := `
		INSERT INTO activity_logs (user_id, action, metadata, ip_address, user_agent)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, created_at
	`
	return r.db.QueryRowContext(
		ctx, query,
		log.UserID, log.Action, log.Metadata, log.IPAddress, log.UserAgent,
	).Scan(&log.ID, &log.CreatedAt)
}
