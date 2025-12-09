// Package repository provides data access layer for private user data
package repository

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github-api/backend/internal/database"
	"github-api/backend/internal/models"
)

// PrivateDataRepository handles private user data operations
type PrivateDataRepository struct {
	db *database.DB
}

// NewPrivateDataRepository creates a new private data repository
func NewPrivateDataRepository(db *database.DB) *PrivateDataRepository {
	return &PrivateDataRepository{db: db}
}

// GetByUserID retrieves private data for a user
func (r *PrivateDataRepository) GetByUserID(ctx context.Context, userID int) (*models.UserPrivateData, error) {
	query := `
		SELECT id, user_id, github_id,
			private_repos, owned_private_repos, total_private_repos,
			private_gists, disk_usage, collaborators, two_factor_enabled,
			plan_name, plan_space, plan_collaborators, plan_private_repos,
			primary_email, emails_count, verified_emails_count,
			organizations_count, organizations_data,
			starred_repos_count, watching_repos_count,
			ssh_keys_count, gpg_keys_count,
			recent_private_repos, recent_events,
			fetched_at, created_at, updated_at
		FROM user_private_data
		WHERE user_id = $1
	`

	var data models.UserPrivateData
	var planName, primaryEmail, orgsData, recentRepos, recentEvents sql.NullString

	err := r.db.QueryRowContext(ctx, query, userID).Scan(
		&data.ID, &data.UserID, &data.GitHubID,
		&data.PrivateRepos, &data.OwnedPrivateRepos, &data.TotalPrivateRepos,
		&data.PrivateGists, &data.DiskUsage, &data.Collaborators, &data.TwoFactorEnabled,
		&planName, &data.PlanSpace, &data.PlanCollaborators, &data.PlanPrivateRepos,
		&primaryEmail, &data.EmailsCount, &data.VerifiedEmailsCount,
		&data.OrganizationsCount, &orgsData,
		&data.StarredReposCount, &data.WatchingReposCount,
		&data.SSHKeysCount, &data.GPGKeysCount,
		&recentRepos, &recentEvents,
		&data.FetchedAt, &data.CreatedAt, &data.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get private data: %w", err)
	}

	// Handle nullable strings
	if planName.Valid {
		data.PlanName = planName.String
	}
	if primaryEmail.Valid {
		data.PrimaryEmail = primaryEmail.String
	}
	if orgsData.Valid {
		data.OrganizationsData = orgsData.String
	}
	if recentRepos.Valid {
		data.RecentPrivateRepos = recentRepos.String
	}
	if recentEvents.Valid {
		data.RecentEvents = recentEvents.String
	}

	return &data, nil
}

// GetByGitHubID retrieves private data by GitHub ID
func (r *PrivateDataRepository) GetByGitHubID(ctx context.Context, githubID int64) (*models.UserPrivateData, error) {
	query := `
		SELECT id, user_id, github_id,
			private_repos, owned_private_repos, total_private_repos,
			private_gists, disk_usage, collaborators, two_factor_enabled,
			plan_name, plan_space, plan_collaborators, plan_private_repos,
			primary_email, emails_count, verified_emails_count,
			organizations_count, organizations_data,
			starred_repos_count, watching_repos_count,
			ssh_keys_count, gpg_keys_count,
			recent_private_repos, recent_events,
			fetched_at, created_at, updated_at
		FROM user_private_data
		WHERE github_id = $1
	`

	var data models.UserPrivateData
	var planName, primaryEmail, orgsData, recentRepos, recentEvents sql.NullString

	err := r.db.QueryRowContext(ctx, query, githubID).Scan(
		&data.ID, &data.UserID, &data.GitHubID,
		&data.PrivateRepos, &data.OwnedPrivateRepos, &data.TotalPrivateRepos,
		&data.PrivateGists, &data.DiskUsage, &data.Collaborators, &data.TwoFactorEnabled,
		&planName, &data.PlanSpace, &data.PlanCollaborators, &data.PlanPrivateRepos,
		&primaryEmail, &data.EmailsCount, &data.VerifiedEmailsCount,
		&data.OrganizationsCount, &orgsData,
		&data.StarredReposCount, &data.WatchingReposCount,
		&data.SSHKeysCount, &data.GPGKeysCount,
		&recentRepos, &recentEvents,
		&data.FetchedAt, &data.CreatedAt, &data.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get private data: %w", err)
	}

	// Handle nullable strings
	if planName.Valid {
		data.PlanName = planName.String
	}
	if primaryEmail.Valid {
		data.PrimaryEmail = primaryEmail.String
	}
	if orgsData.Valid {
		data.OrganizationsData = orgsData.String
	}
	if recentRepos.Valid {
		data.RecentPrivateRepos = recentRepos.String
	}
	if recentEvents.Valid {
		data.RecentEvents = recentEvents.String
	}

	return &data, nil
}

// Upsert creates or updates private data for a user
func (r *PrivateDataRepository) Upsert(ctx context.Context, data *models.UserPrivateData) error {
	query := `
		INSERT INTO user_private_data (
			user_id, github_id,
			private_repos, owned_private_repos, total_private_repos,
			private_gists, disk_usage, collaborators, two_factor_enabled,
			plan_name, plan_space, plan_collaborators, plan_private_repos,
			primary_email, emails_count, verified_emails_count,
			organizations_count, organizations_data,
			starred_repos_count, watching_repos_count,
			ssh_keys_count, gpg_keys_count,
			recent_private_repos, recent_events,
			fetched_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
			$14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26
		)
		ON CONFLICT (user_id) DO UPDATE SET
			private_repos = EXCLUDED.private_repos,
			owned_private_repos = EXCLUDED.owned_private_repos,
			total_private_repos = EXCLUDED.total_private_repos,
			private_gists = EXCLUDED.private_gists,
			disk_usage = EXCLUDED.disk_usage,
			collaborators = EXCLUDED.collaborators,
			two_factor_enabled = EXCLUDED.two_factor_enabled,
			plan_name = EXCLUDED.plan_name,
			plan_space = EXCLUDED.plan_space,
			plan_collaborators = EXCLUDED.plan_collaborators,
			plan_private_repos = EXCLUDED.plan_private_repos,
			primary_email = EXCLUDED.primary_email,
			emails_count = EXCLUDED.emails_count,
			verified_emails_count = EXCLUDED.verified_emails_count,
			organizations_count = EXCLUDED.organizations_count,
			organizations_data = EXCLUDED.organizations_data,
			starred_repos_count = EXCLUDED.starred_repos_count,
			watching_repos_count = EXCLUDED.watching_repos_count,
			ssh_keys_count = EXCLUDED.ssh_keys_count,
			gpg_keys_count = EXCLUDED.gpg_keys_count,
			recent_private_repos = EXCLUDED.recent_private_repos,
			recent_events = EXCLUDED.recent_events,
			fetched_at = EXCLUDED.fetched_at,
			updated_at = EXCLUDED.updated_at
	`

	now := time.Now()
	var orgsData, recentRepos, recentEvents interface{}

	if data.OrganizationsData != "" {
		orgsData = data.OrganizationsData
	}
	if data.RecentPrivateRepos != "" {
		recentRepos = data.RecentPrivateRepos
	}
	if data.RecentEvents != "" {
		recentEvents = data.RecentEvents
	}

	_, err := r.db.ExecContext(ctx, query,
		data.UserID, data.GitHubID,
		data.PrivateRepos, data.OwnedPrivateRepos, data.TotalPrivateRepos,
		data.PrivateGists, data.DiskUsage, data.Collaborators, data.TwoFactorEnabled,
		data.PlanName, data.PlanSpace, data.PlanCollaborators, data.PlanPrivateRepos,
		data.PrimaryEmail, data.EmailsCount, data.VerifiedEmailsCount,
		data.OrganizationsCount, orgsData,
		data.StarredReposCount, data.WatchingReposCount,
		data.SSHKeysCount, data.GPGKeysCount,
		recentRepos, recentEvents,
		now, now,
	)

	if err != nil {
		return fmt.Errorf("failed to upsert private data: %w", err)
	}

	return nil
}

// Delete removes private data for a user
func (r *PrivateDataRepository) Delete(ctx context.Context, userID int) error {
	query := `DELETE FROM user_private_data WHERE user_id = $1`
	_, err := r.db.ExecContext(ctx, query, userID)
	if err != nil {
		return fmt.Errorf("failed to delete private data: %w", err)
	}
	return nil
}

// IsDataStale checks if the private data needs to be refreshed (older than 1 hour)
func (r *PrivateDataRepository) IsDataStale(ctx context.Context, userID int) (bool, error) {
	query := `SELECT fetched_at FROM user_private_data WHERE user_id = $1`

	var fetchedAt time.Time
	err := r.db.QueryRowContext(ctx, query, userID).Scan(&fetchedAt)

	if err == sql.ErrNoRows {
		return true, nil // No data, needs fetch
	}
	if err != nil {
		return false, fmt.Errorf("failed to check data staleness: %w", err)
	}

	// Data is stale if older than 1 hour
	return time.Since(fetchedAt) > time.Hour, nil
}
