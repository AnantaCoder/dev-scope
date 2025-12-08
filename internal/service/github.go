// Package service provides GitHub API service layer
package service

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"sync"

	"github-api/internal/cache"
	"github-api/internal/config"
	"github-api/internal/models"
)

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

// FetchUser fetches GitHub user information from API
func (s *GitHubService) FetchUser(username string) (*models.GitHubUser, error) {
	url := s.config.GitHubAPIURL + username

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("error creating request: %v", err)
	}

	req.Header.Set("User-Agent", "GitHub-Status-API-Go")

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
	// Check cache first
	if useCache {
		if cachedUser, found := s.cache.Get(username); found {
			return &models.APIResponse{
				Error:  false,
				Cached: true,
				Data:   cachedUser,
			}, nil
		}
	}

	// Fetch from GitHub API
	user, err := s.FetchUser(username)
	if err != nil {
		return &models.APIResponse{
			Error:   true,
			Message: err.Error(),
		}, err
	}

	// Cache the result
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
