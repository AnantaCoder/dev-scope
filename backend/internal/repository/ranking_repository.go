// Package repository provides database operations for rankings
package repository

import (
	"context"
	"fmt"

	"github-api/backend/internal/database"
	"github-api/backend/internal/models"
)

// RankingRepository handles ranking database operations
type RankingRepository struct {
	db *database.DB
}

// NewRankingRepository creates a new ranking repository
func NewRankingRepository(db *database.DB) *RankingRepository {
	return &RankingRepository{db: db}
}

// UpsertRanking inserts or updates a user ranking
func (r *RankingRepository) UpsertRanking(ctx context.Context, ranking *models.UserRanking) error {
	query := `
		INSERT INTO user_rankings (
			username, github_id, avatar_url, score, followers, public_repos,
			total_stars, total_forks, contribution_count, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
		ON CONFLICT (github_id) DO UPDATE SET
			username = EXCLUDED.username,
			avatar_url = EXCLUDED.avatar_url,
			score = EXCLUDED.score,
			followers = EXCLUDED.followers,
			public_repos = EXCLUDED.public_repos,
			total_stars = EXCLUDED.total_stars,
			total_forks = EXCLUDED.total_forks,
			contribution_count = EXCLUDED.contribution_count,
			updated_at = NOW()
		RETURNING id
	`

	return r.db.QueryRowContext(
		ctx, query,
		ranking.Username, ranking.GitHubID, ranking.AvatarURL, ranking.Score,
		ranking.Followers, ranking.PublicRepos, ranking.TotalStars,
		ranking.TotalForks, ranking.ContributionCount,
	).Scan(&ranking.ID)
}

// UpdateRankPositions recalculates and updates rank positions
func (r *RankingRepository) UpdateRankPositions(ctx context.Context) error {
	query := `
		WITH ranked AS (
			SELECT id, ROW_NUMBER() OVER (ORDER BY score DESC, followers DESC) as new_rank
			FROM user_rankings
		)
		UPDATE user_rankings
		SET rank_position = ranked.new_rank
		FROM ranked
		WHERE user_rankings.id = ranked.id
	`
	_, err := r.db.ExecContext(ctx, query)
	return err
}

// GetTopRankings retrieves top N users by rank
func (r *RankingRepository) GetTopRankings(ctx context.Context, limit, offset int) ([]models.UserRanking, error) {
	query := `
		SELECT id, username, github_id, avatar_url, score, followers, public_repos,
			total_stars, total_forks, contribution_count, rank_position, updated_at
		FROM user_rankings
		ORDER BY rank_position ASC, score DESC
		LIMIT $1 OFFSET $2
	`
    fmt.Printf("Executing GetTopRankings query: %s, with params: limit=%d, offset=%d\n", query, limit, offset)

	rows, err := r.db.QueryContext(ctx, query, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var rankings []models.UserRanking
	for rows.Next() {
		var r models.UserRanking
		err := rows.Scan(
			&r.ID, &r.Username, &r.GitHubID, &r.AvatarURL, &r.Score,
			&r.Followers, &r.PublicRepos, &r.TotalStars, &r.TotalForks,
			&r.ContributionCount, &r.RankPosition, &r.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		rankings = append(rankings, r)
	}

	return rankings, rows.Err()
}

// GetTotalRankingsCount returns total number of ranked users
func (r *RankingRepository) GetTotalRankingsCount(ctx context.Context) (int64, error) {
	var count int64
	query := `SELECT COUNT(*) FROM user_rankings`
	err := r.db.QueryRowContext(ctx, query).Scan(&count)
	return count, err
}

// GetUserRanking retrieves a specific user's ranking
func (r *RankingRepository) GetUserRanking(ctx context.Context, username string) (*models.UserRanking, error) {
	query := `
		SELECT id, username, github_id, avatar_url, score, followers, public_repos,
			total_stars, total_forks, contribution_count, rank_position, updated_at
		FROM user_rankings
		WHERE username = $1
	`

	var ranking models.UserRanking
	err := r.db.QueryRowContext(ctx, query, username).Scan(
		&ranking.ID, &ranking.Username, &ranking.GitHubID, &ranking.AvatarURL,
		&ranking.Score, &ranking.Followers, &ranking.PublicRepos,
		&ranking.TotalStars, &ranking.TotalForks, &ranking.ContributionCount,
		&ranking.RankPosition, &ranking.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}
	return &ranking, nil
}

// DeleteOldRankings removes rankings older than specified duration
func (r *RankingRepository) DeleteOldRankings(ctx context.Context, days int) error {
	query := fmt.Sprintf(`DELETE FROM user_rankings WHERE updated_at < NOW() - INTERVAL '%d days'`, days)
	_, err := r.db.ExecContext(ctx, query)
	return err
}
