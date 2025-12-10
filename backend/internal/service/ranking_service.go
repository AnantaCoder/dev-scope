// Package service provides ranking calculation and management
package service

import (
	"context"
	"fmt"
	"log"
	"math"
	"sync"
	"time"

	"github-api/backend/internal/models"
	"github-api/backend/internal/repository"
)

// RankingService handles user ranking operations
type RankingService struct {
	rankingRepo   *repository.RankingRepository
	githubService *GitHubService
	mu            sync.RWMutex
	lastUpdate    time.Time
	updateLock    sync.Mutex
}

// NewRankingService creates a new ranking service
func NewRankingService(rankingRepo *repository.RankingRepository, githubService *GitHubService) *RankingService {
	return &RankingService{
		rankingRepo:   rankingRepo,
		githubService: githubService,
	}
}

// CalculateUserScore calculates a comprehensive score for a user
func CalculateUserScore(ranking *models.UserRanking) float64 {
	// Weighted scoring algorithm
	// Followers: 40%, Stars: 30%, Repos: 15%, Forks: 10%, Contributions: 5%

	followerScore := float64(ranking.Followers) * 0.40
	starScore := float64(ranking.TotalStars) * 0.30
	repoScore := float64(ranking.PublicRepos) * 0.15
	forkScore := float64(ranking.TotalForks) * 0.10
	contributionScore := float64(ranking.ContributionCount) * 0.05

	totalScore := followerScore + starScore + repoScore + forkScore + contributionScore

	// Apply logarithmic scaling to prevent extreme outliers
	if totalScore > 0 {
		totalScore = math.Log10(totalScore+1) * 100
	}

	return math.Round(totalScore*100) / 100
}

// FetchAndCalculateUserRanking fetches user data and calculates ranking
func (s *RankingService) FetchAndCalculateUserRanking(ctx context.Context, username string) (*models.UserRanking, error) {
	// Fetch user basic info
	user, err := s.githubService.FetchUser(username)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch user: %w", err)
	}

	// Fetch user repos to calculate stars and forks
	repos, err := s.githubService.FetchUserRepos(username)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch repos: %w", err)
	}

	totalStars := 0
	totalForks := 0
	for _, repo := range repos {
		totalStars += repo.StargazersCount
		totalForks += repo.ForksCount
	}

	// Fetch events to estimate contribution count
	events, err := s.githubService.FetchUserEvents(username)
	contributionCount := 0
	if err == nil {
		contributionCount = len(events)
	}

	ranking := &models.UserRanking{
		Username:          user.Login,
		GitHubID:          user.ID,
		AvatarURL:         user.AvatarURL,
		Followers:         user.Followers,
		PublicRepos:       user.PublicRepos,
		TotalStars:        totalStars,
		TotalForks:        totalForks,
		ContributionCount: contributionCount,
	}

	ranking.Score = CalculateUserScore(ranking)

	return ranking, nil
}

// UpdateUserRanking updates or inserts a user's ranking
func (s *RankingService) UpdateUserRanking(ctx context.Context, username string) error {
	ranking, err := s.FetchAndCalculateUserRanking(ctx, username)
	if err != nil {
		return err
	}

	if err := s.rankingRepo.UpsertRanking(ctx, ranking); err != nil {
		return fmt.Errorf("failed to upsert ranking: %w", err)
	}

	// Update rank positions
	if err := s.rankingRepo.UpdateRankPositions(ctx); err != nil {
		return fmt.Errorf("failed to update rank positions: %w", err)
	}

	log.Printf("✅ [Ranking] Updated ranking for %s (Score: %.2f)", username, ranking.Score)
	return nil
}

// GetTopRankings retrieves top N rankings with pagination
func (s *RankingService) GetTopRankings(ctx context.Context, page, pageSize int) (*models.RankingsResponse, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 50
	}

	offset := (page - 1) * pageSize

	rankings, err := s.rankingRepo.GetTopRankings(ctx, pageSize, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to get rankings: %w", err)
	}

	total, err := s.rankingRepo.GetTotalRankingsCount(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get total count: %w", err)
	}

	return &models.RankingsResponse{
		Error:    false,
		Rankings: rankings,
		Total:    int(total),
		Page:     page,
		PageSize: pageSize,
	}, nil
}

// GetUserRanking retrieves a specific user's ranking
func (s *RankingService) GetUserRanking(ctx context.Context, username string) (*models.UserRanking, error) {
	ranking, err := s.rankingRepo.GetUserRanking(ctx, username)
	if err != nil {
		return nil, err
	}
	return ranking, nil
}

// RefreshRankings refreshes rankings for all users (background job)
func (s *RankingService) RefreshRankings(ctx context.Context, usernames []string) error {
	s.updateLock.Lock()
	defer s.updateLock.Unlock()

	log.Printf("🔄 [Ranking] Starting refresh for %d users", len(usernames))

	var wg sync.WaitGroup
	errors := make(chan error, len(usernames))
	semaphore := make(chan struct{}, 5) // Limit to 5 concurrent updates

	for _, username := range usernames {
		wg.Add(1)
		go func(user string) {
			defer wg.Done()
			semaphore <- struct{}{}        // Acquire
			defer func() { <-semaphore }() // Release

			if err := s.UpdateUserRanking(ctx, user); err != nil {
				errors <- fmt.Errorf("failed to update %s: %w", user, err)
			}
		}(username)
	}

	wg.Wait()
	close(errors)

	// Collect errors
	var errList []error
	for err := range errors {
		errList = append(errList, err)
	}

	if len(errList) > 0 {
		log.Printf("⚠️ [Ranking] Completed with %d errors", len(errList))
		return fmt.Errorf("ranking refresh completed with errors: %v", errList)
	}

	s.lastUpdate = time.Now()
	log.Printf("✅ [Ranking] Refresh completed successfully")
	return nil
}

// StartPeriodicRefresh starts a background job to refresh rankings periodically
func (s *RankingService) StartPeriodicRefresh(ctx context.Context, interval time.Duration, usernames []string) {
	ticker := time.NewTicker(interval)
	go func() {
		for {
			select {
			case <-ticker.C:
				if err := s.RefreshRankings(ctx, usernames); err != nil {
					log.Printf("❌ [Ranking] Periodic refresh failed: %v", err)
				}
			case <-ctx.Done():
				ticker.Stop()
				return
			}
		}
	}()
}
