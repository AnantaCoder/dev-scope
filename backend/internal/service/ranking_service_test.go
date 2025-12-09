// Package service_test provides tests for ranking service
package service

import (
	"testing"

	"github-api/backend/internal/models"
)

func TestCalculateUserScore(t *testing.T) {
	tests := []struct {
		name     string
		ranking  *models.UserRanking
		minScore float64
		maxScore float64
	}{
		{
			name: "High profile user",
			ranking: &models.UserRanking{
				Followers:         10000,
				PublicRepos:       100,
				TotalStars:        50000,
				TotalForks:        10000,
				ContributionCount: 1000,
			},
			minScore: 400.0,
			maxScore: 600.0,
		},
		{
			name: "Medium profile user",
			ranking: &models.UserRanking{
				Followers:         1000,
				PublicRepos:       50,
				TotalStars:        5000,
				TotalForks:        1000,
				ContributionCount: 500,
			},
			minScore: 300.0,
			maxScore: 450.0,
		},
		{
			name: "New user",
			ranking: &models.UserRanking{
				Followers:         10,
				PublicRepos:       5,
				TotalStars:        50,
				TotalForks:        10,
				ContributionCount: 20,
			},
			minScore: 0.0,
			maxScore: 300.0,
		},
		{
			name: "Zero stats user",
			ranking: &models.UserRanking{
				Followers:         0,
				PublicRepos:       0,
				TotalStars:        0,
				TotalForks:        0,
				ContributionCount: 0,
			},
			minScore: 0.0,
			maxScore: 0.0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			score := CalculateUserScore(tt.ranking)

			if score < tt.minScore || score > tt.maxScore {
				t.Errorf("Score %v outside expected range [%v, %v]", score, tt.minScore, tt.maxScore)
			}

			// Score should be non-negative
			if score < 0 {
				t.Errorf("Score should be non-negative, got %v", score)
			}
		})
	}
}

func TestScoreWeighting(t *testing.T) {
	// Test that followers have more weight than repos
	ranking1 := &models.UserRanking{
		Followers:         10000,
		PublicRepos:       10,
		TotalStars:        0,
		TotalForks:        0,
		ContributionCount: 0,
	}

	ranking2 := &models.UserRanking{
		Followers:         100,
		PublicRepos:       1000,
		TotalStars:        0,
		TotalForks:        0,
		ContributionCount: 0,
	}

	score1 := CalculateUserScore(ranking1)
	score2 := CalculateUserScore(ranking2)

	if score1 <= score2 {
		t.Errorf("Followers should have more weight: score1=%v, score2=%v", score1, score2)
	}
}

func TestScoreConsistency(t *testing.T) {
	// Same input should produce same output
	ranking := &models.UserRanking{
		Followers:         5000,
		PublicRepos:       50,
		TotalStars:        10000,
		TotalForks:        2000,
		ContributionCount: 500,
	}

	score1 := CalculateUserScore(ranking)
	score2 := CalculateUserScore(ranking)

	if score1 != score2 {
		t.Errorf("Score calculation should be deterministic: %v != %v", score1, score2)
	}
}
