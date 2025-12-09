// Package service provides business logic for fetching private GitHub data
package service

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"

	"github-api/backend/internal/models"
	"github-api/backend/internal/repository"
)

// PrivateDataService handles fetching and storing private GitHub data
type PrivateDataService struct {
	repo       *repository.PrivateDataRepository
	httpClient *http.Client
}

// NewPrivateDataService creates a new private data service
func NewPrivateDataService(repo *repository.PrivateDataRepository) *PrivateDataService {
	return &PrivateDataService{
		repo: repo,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// GitHubPrivateUser represents the authenticated user response from GitHub
type GitHubPrivateUser struct {
	ID                int64  `json:"id"`
	Login             string `json:"login"`
	PrivateGists      int    `json:"private_gists"`
	TotalPrivateRepos int    `json:"total_private_repos"`
	OwnedPrivateRepos int    `json:"owned_private_repos"`
	DiskUsage         int64  `json:"disk_usage"`
	Collaborators     int    `json:"collaborators"`
	TwoFactorAuth     bool   `json:"two_factor_authentication"`
	Plan              *struct {
		Name          string `json:"name"`
		Space         int64  `json:"space"`
		Collaborators int    `json:"collaborators"`
		PrivateRepos  int    `json:"private_repos"`
	} `json:"plan"`
}

// GitHubEmail represents a GitHub email
type GitHubEmail struct {
	Email      string `json:"email"`
	Primary    bool   `json:"primary"`
	Verified   bool   `json:"verified"`
	Visibility string `json:"visibility"`
}

// GitHubOrg represents a GitHub organization
type GitHubOrg struct {
	ID          int64  `json:"id"`
	Login       string `json:"login"`
	AvatarURL   string `json:"avatar_url"`
	Description string `json:"description"`
}

// GitHubRepo represents a private repository summary
type GitHubRepo struct {
	ID          int64  `json:"id"`
	Name        string `json:"name"`
	FullName    string `json:"full_name"`
	Private     bool   `json:"private"`
	Description string `json:"description"`
	Language    string `json:"language"`
	UpdatedAt   string `json:"updated_at"`
}

// FetchAndStorePrivateData fetches private data from GitHub and stores it
func (s *PrivateDataService) FetchAndStorePrivateData(ctx context.Context, userID int, githubID int64, accessToken string) (*models.UserPrivateData, error) {
	log.Printf("🔄 [PrivateData] Fetching private data for user %d", userID)

	privateData := &models.UserPrivateData{
		UserID:   userID,
		GitHubID: githubID,
	}

	// Fetch authenticated user data (includes private fields)
	userData, err := s.fetchAuthenticatedUser(ctx, accessToken)
	if err != nil {
		log.Printf("⚠️ [PrivateData] Failed to fetch user data: %v", err)
	} else {
		privateData.PrivateGists = userData.PrivateGists
		privateData.TotalPrivateRepos = userData.TotalPrivateRepos
		privateData.OwnedPrivateRepos = userData.OwnedPrivateRepos
		privateData.PrivateRepos = userData.TotalPrivateRepos // Alias
		privateData.DiskUsage = userData.DiskUsage
		privateData.Collaborators = userData.Collaborators
		privateData.TwoFactorEnabled = userData.TwoFactorAuth

		if userData.Plan != nil {
			privateData.PlanName = userData.Plan.Name
			privateData.PlanSpace = userData.Plan.Space
			privateData.PlanCollaborators = userData.Plan.Collaborators
			privateData.PlanPrivateRepos = userData.Plan.PrivateRepos
		}
	}

	// Fetch emails
	emails, err := s.fetchEmails(ctx, accessToken)
	if err != nil {
		log.Printf("⚠️ [PrivateData] Failed to fetch emails: %v", err)
	} else {
		privateData.EmailsCount = len(emails)
		verifiedCount := 0
		for _, email := range emails {
			if email.Verified {
				verifiedCount++
			}
			if email.Primary {
				privateData.PrimaryEmail = email.Email
			}
		}
		privateData.VerifiedEmailsCount = verifiedCount
	}

	// Fetch organizations
	orgs, err := s.fetchOrganizations(ctx, accessToken)
	if err != nil {
		log.Printf("⚠️ [PrivateData] Failed to fetch organizations: %v", err)
	} else {
		privateData.OrganizationsCount = len(orgs)
		if orgsJSON, err := json.Marshal(orgs); err == nil {
			privateData.OrganizationsData = string(orgsJSON)
		}
	}

	// Fetch starred repos count
	starredCount, err := s.fetchStarredCount(ctx, accessToken)
	if err != nil {
		log.Printf("⚠️ [PrivateData] Failed to fetch starred count: %v", err)
	} else {
		privateData.StarredReposCount = starredCount
	}

	// Fetch watching repos count
	watchingCount, err := s.fetchWatchingCount(ctx, accessToken)
	if err != nil {
		log.Printf("⚠️ [PrivateData] Failed to fetch watching count: %v", err)
	} else {
		privateData.WatchingReposCount = watchingCount
	}

	// Fetch SSH keys count
	sshCount, err := s.fetchSSHKeysCount(ctx, accessToken)
	if err != nil {
		log.Printf("⚠️ [PrivateData] Failed to fetch SSH keys count: %v", err)
	} else {
		privateData.SSHKeysCount = sshCount
	}

	// Fetch GPG keys count
	gpgCount, err := s.fetchGPGKeysCount(ctx, accessToken)
	if err != nil {
		log.Printf("⚠️ [PrivateData] Failed to fetch GPG keys count: %v", err)
	} else {
		privateData.GPGKeysCount = gpgCount
	}

	// Fetch recent private repos
	recentRepos, err := s.fetchRecentPrivateRepos(ctx, accessToken)
	if err != nil {
		log.Printf("⚠️ [PrivateData] Failed to fetch recent private repos: %v", err)
	} else {
		if reposJSON, err := json.Marshal(recentRepos); err == nil {
			privateData.RecentPrivateRepos = string(reposJSON)
		}
	}

	// Store the data
	if err := s.repo.Upsert(ctx, privateData); err != nil {
		return nil, fmt.Errorf("failed to store private data: %w", err)
	}

	log.Printf("✅ [PrivateData] Successfully stored private data for user %d", userID)
	return privateData, nil
}

// GetPrivateData retrieves private data, fetching from GitHub if stale
func (s *PrivateDataService) GetPrivateData(ctx context.Context, userID int, githubID int64, accessToken string) (*models.UserPrivateData, error) {
	// Check if data is stale
	isStale, err := s.repo.IsDataStale(ctx, userID)
	if err != nil {
		return nil, err
	}

	// If stale, fetch new data
	if isStale {
		return s.FetchAndStorePrivateData(ctx, userID, githubID, accessToken)
	}

	// Return cached data
	return s.repo.GetByUserID(ctx, userID)
}

// fetchAuthenticatedUser fetches the authenticated user's private data
func (s *PrivateDataService) fetchAuthenticatedUser(ctx context.Context, token string) (*GitHubPrivateUser, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", "https://api.github.com/user", nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Accept", "application/vnd.github.v3+json")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("GitHub API error: %d - %s", resp.StatusCode, string(body))
	}

	var user GitHubPrivateUser
	if err := json.NewDecoder(resp.Body).Decode(&user); err != nil {
		return nil, err
	}

	return &user, nil
}

// fetchEmails fetches the user's emails
func (s *PrivateDataService) fetchEmails(ctx context.Context, token string) ([]GitHubEmail, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", "https://api.github.com/user/emails", nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Accept", "application/vnd.github.v3+json")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to fetch emails: %d", resp.StatusCode)
	}

	var emails []GitHubEmail
	if err := json.NewDecoder(resp.Body).Decode(&emails); err != nil {
		return nil, err
	}

	return emails, nil
}

// fetchOrganizations fetches the user's organizations
func (s *PrivateDataService) fetchOrganizations(ctx context.Context, token string) ([]GitHubOrg, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", "https://api.github.com/user/orgs", nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Accept", "application/vnd.github.v3+json")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to fetch organizations: %d", resp.StatusCode)
	}

	var orgs []GitHubOrg
	if err := json.NewDecoder(resp.Body).Decode(&orgs); err != nil {
		return nil, err
	}

	return orgs, nil
}

// fetchStarredCount fetches the count of starred repositories
func (s *PrivateDataService) fetchStarredCount(ctx context.Context, token string) (int, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", "https://api.github.com/user/starred?per_page=1", nil)
	if err != nil {
		return 0, err
	}

	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Accept", "application/vnd.github.v3+json")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()

	// Parse Link header to get total count
	return parseLinkHeaderCount(resp.Header.Get("Link")), nil
}

// fetchWatchingCount fetches the count of watched repositories
func (s *PrivateDataService) fetchWatchingCount(ctx context.Context, token string) (int, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", "https://api.github.com/user/subscriptions?per_page=1", nil)
	if err != nil {
		return 0, err
	}

	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Accept", "application/vnd.github.v3+json")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()

	return parseLinkHeaderCount(resp.Header.Get("Link")), nil
}

// fetchSSHKeysCount fetches the count of SSH keys
func (s *PrivateDataService) fetchSSHKeysCount(ctx context.Context, token string) (int, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", "https://api.github.com/user/keys", nil)
	if err != nil {
		return 0, err
	}

	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Accept", "application/vnd.github.v3+json")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()

	var keys []interface{}
	if err := json.NewDecoder(resp.Body).Decode(&keys); err != nil {
		return 0, err
	}

	return len(keys), nil
}

// fetchGPGKeysCount fetches the count of GPG keys
func (s *PrivateDataService) fetchGPGKeysCount(ctx context.Context, token string) (int, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", "https://api.github.com/user/gpg_keys", nil)
	if err != nil {
		return 0, err
	}

	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Accept", "application/vnd.github.v3+json")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()

	var keys []interface{}
	if err := json.NewDecoder(resp.Body).Decode(&keys); err != nil {
		return 0, err
	}

	return len(keys), nil
}

// fetchRecentPrivateRepos fetches recent private repositories
func (s *PrivateDataService) fetchRecentPrivateRepos(ctx context.Context, token string) ([]GitHubRepo, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", "https://api.github.com/user/repos?type=private&sort=updated&per_page=10", nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Accept", "application/vnd.github.v3+json")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to fetch private repos: %d", resp.StatusCode)
	}

	var repos []GitHubRepo
	if err := json.NewDecoder(resp.Body).Decode(&repos); err != nil {
		return nil, err
	}

	return repos, nil
}

// parseLinkHeaderCount parses the Link header to extract total page count
func parseLinkHeaderCount(link string) int {
	if link == "" {
		return 0
	}

	// Simple parsing for the last page number
	// Format: <url?page=2>; rel="next", <url?page=10>; rel="last"
	// We want to extract 10 from page=10 in rel="last"

	// Find rel="last"
	lastIdx := -1
	for i := len(link) - 1; i >= 0; i-- {
		if link[i:] == `rel="last"` || (i+10 <= len(link) && link[i:i+10] == `rel="last"`) {
			lastIdx = i
			break
		}
	}

	if lastIdx == -1 {
		return 1 // No pagination, single page
	}

	// Find page= before rel="last"
	for i := lastIdx; i >= 0; i-- {
		if i+5 <= len(link) && link[i:i+5] == "page=" {
			// Extract number
			num := 0
			for j := i + 5; j < len(link) && link[j] >= '0' && link[j] <= '9'; j++ {
				num = num*10 + int(link[j]-'0')
			}
			return num
		}
	}

	return 1
}
