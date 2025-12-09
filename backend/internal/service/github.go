// Package service provides GitHub API service layer
package service

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"sync"
	"time"

	"github-api/backend/internal/cache"
	"github-api/backend/internal/config"
	"github-api/backend/internal/models"
)

// Time helpers for streak calculation
var timeNow = time.Now
var timeParse = time.Parse

// GitHubService handles GitHub API operations
type GitHubService struct {
	cache      *cache.Cache
	httpClient *http.Client
	config     *config.Config
}

// NewGitHubService creates a new GitHub service
func NewGitHubService(cfg *config.Config, c *cache.Cache) *GitHubService {
	return &GitHubService{
		cache:  c,
		config: cfg,
		httpClient: &http.Client{
			Timeout: cfg.Timeout,
		},
	}
}

// setAuthHeaders adds authentication headers to request
func (s *GitHubService) setAuthHeaders(req *http.Request) {
	req.Header.Set("User-Agent", "DevScope-API")
	// Only add authorization if token is valid (not empty or placeholder)
	if s.config.GitHubToken != "" && s.config.GitHubToken != "YOUR_FINE_GRAINED_TOKEN_HERE" {
		req.Header.Set("Authorization", "Bearer "+s.config.GitHubToken)
	}
}

// FetchUser fetches GitHub user information from API
func (s *GitHubService) FetchUser(username string) (*models.GitHubUser, error) {
	url := s.config.GitHubAPIURL + username

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("error creating request: %v", err)
	}

	s.setAuthHeaders(req)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("error making request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("GitHub API returned status: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("error reading response: %v", err)
	}

	var user models.GitHubUser
	if err := json.Unmarshal(body, &user); err != nil {
		return nil, fmt.Errorf("error parsing JSON: %v", err)
	}

	return &user, nil
}

// GetUserStatus gets user status with caching
func (s *GitHubService) GetUserStatus(username string, useCache bool) (*models.APIResponse, error) {
	if useCache {
		if cachedUser, found := s.cache.Get(username); found {
			return &models.APIResponse{
				Error:  false,
				Cached: true,
				Data:   cachedUser,
			}, nil
		}
	}

	user, err := s.FetchUser(username)
	if err != nil {
		return &models.APIResponse{
			Error:   true,
			Message: err.Error(),
		}, err
	}

	if useCache {
		s.cache.Set(username, *user)
	}

	return &models.APIResponse{
		Error:  false,
		Cached: false,
		Data:   user,
	}, nil
}

// GetBatchStatus fetches multiple users concurrently
func (s *GitHubService) GetBatchStatus(usernames []string) *models.BatchResponse {
	results := make(map[string]interface{})
	var mu sync.Mutex
	var wg sync.WaitGroup

	for _, username := range usernames {
		if username == "" {
			continue
		}

		wg.Add(1)
		go func(user string) {
			defer wg.Done()
			result, _ := s.GetUserStatus(user, true)
			mu.Lock()
			results[user] = result
			mu.Unlock()
		}(username)
	}

	wg.Wait()

	return &models.BatchResponse{
		Error:   false,
		Results: results,
	}
}

// FetchUserRepos fetches user repositories
func (s *GitHubService) FetchUserRepos(username string) ([]models.GitHubRepo, error) {
	url := fmt.Sprintf("https://api.github.com/users/%s/repos?per_page=100&sort=updated", username)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("error creating request: %v", err)
	}
	s.setAuthHeaders(req)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("error making request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("GitHub API returned status: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("error reading response: %v", err)
	}

	var repos []models.GitHubRepo
	if err := json.Unmarshal(body, &repos); err != nil {
		return nil, fmt.Errorf("error parsing JSON: %v", err)
	}

	return repos, nil
}

// FetchUserEvents fetches user events for streak calculation
func (s *GitHubService) FetchUserEvents(username string) ([]models.GitHubEvent, error) {
	url := fmt.Sprintf("https://api.github.com/users/%s/events?per_page=100", username)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("error creating request: %v", err)
	}
	s.setAuthHeaders(req)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("error making request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("GitHub API returned status: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("error reading response: %v", err)
	}

	var events []models.GitHubEvent
	if err := json.Unmarshal(body, &events); err != nil {
		return nil, fmt.Errorf("error parsing JSON: %v", err)
	}

	return events, nil
}

// GetTechStack calculates tech stack from repos
func (s *GitHubService) GetTechStack(username string) (*models.TechStack, error) {
	repos, err := s.FetchUserRepos(username)
	if err != nil {
		return nil, err
	}

	languages := make(map[string]int)
	for _, repo := range repos {
		if repo.Language != "" {
			languages[repo.Language]++
		}
	}

	topLang := ""
	maxCount := 0
	for lang, count := range languages {
		if count > maxCount {
			maxCount = count
			topLang = lang
		}
	}

	return &models.TechStack{
		Languages:   languages,
		TopLanguage: topLang,
		TotalRepos:  len(repos),
	}, nil
}

// GetStreak calculates contribution streak from events
func (s *GitHubService) GetStreak(username string) (*models.StreakInfo, error) {
	events, err := s.FetchUserEvents(username)
	if err != nil {
		return nil, err
	}

	if len(events) == 0 {
		return &models.StreakInfo{
			CurrentStreak: 0,
			LongestStreak: 0,
			TotalDays:     0,
			LastActive:    "",
		}, nil
	}

	activeDays := make(map[string]bool)
	for _, event := range events {
		if event.CreatedAt != "" {
			day := event.CreatedAt[:10]
			activeDays[day] = true
		}
	}

	var days []string
	for day := range activeDays {
		days = append(days, day)
	}

	for i := 0; i < len(days)-1; i++ {
		for j := i + 1; j < len(days); j++ {
			if days[i] < days[j] {
				days[i], days[j] = days[j], days[i]
			}
		}
	}

	lastActive := ""
	if len(days) > 0 {
		lastActive = days[0]
	}

	currentStreak := 0
	now := timeNow()
	today := fmt.Sprintf("%d-%02d-%02d", now.Year(), now.Month(), now.Day())

	checkDate := today
	for {
		if activeDays[checkDate] {
			currentStreak++
			checkDate = previousDay(checkDate)
		} else if checkDate == today {
			checkDate = previousDay(checkDate)
		} else {
			break
		}
	}

	longestStreak := 0
	streak := 0
	prevDay := ""

	for i := len(days) - 1; i >= 0; i-- {
		if prevDay == "" || isConsecutive(prevDay, days[i]) {
			streak++
		} else {
			if streak > longestStreak {
				longestStreak = streak
			}
			streak = 1
		}
		prevDay = days[i]
	}
	if streak > longestStreak {
		longestStreak = streak
	}

	return &models.StreakInfo{
		CurrentStreak: currentStreak,
		LongestStreak: longestStreak,
		TotalDays:     len(activeDays),
		LastActive:    lastActive,
	}, nil
}

func previousDay(date string) string {
	t, err := timeParse("2006-01-02", date)
	if err != nil {
		return date
	}
	prev := t.AddDate(0, 0, -1)
	return prev.Format("2006-01-02")
}

func isConsecutive(day1, day2 string) bool {
	return previousDay(day2) == day1
}

// GetExtendedUserInfo fetches user info with tech stack and streak
func (s *GitHubService) GetExtendedUserInfo(username string, useCache bool) (*models.UserExtendedInfo, error) {
	userResp, err := s.GetUserStatus(username, useCache)
	if err != nil {
		return nil, err
	}

	user, ok := userResp.Data.(*models.GitHubUser)
	if !ok {
		if userData, ok := userResp.Data.(models.GitHubUser); ok {
			user = &userData
		} else {
			return nil, fmt.Errorf("invalid user data type")
		}
	}

	var techStack *models.TechStack
	var streak *models.StreakInfo
	var wg sync.WaitGroup
	var techErr, streakErr error

	wg.Add(2)
	go func() {
		defer wg.Done()
		techStack, techErr = s.GetTechStack(username)
	}()
	go func() {
		defer wg.Done()
		streak, streakErr = s.GetStreak(username)
	}()
	wg.Wait()

	if techErr != nil {
		techStack = &models.TechStack{Languages: make(map[string]int)}
	}
	if streakErr != nil {
		streak = &models.StreakInfo{}
	}

	return &models.UserExtendedInfo{
		User:      user,
		TechStack: techStack,
		Streak:    streak,
	}, nil
}
