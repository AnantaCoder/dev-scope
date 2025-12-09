// Package auth provides GitHub OAuth authentication
package auth

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"

	"github-api/backend/internal/models"
	"github-api/backend/internal/repository"
)

// GitHubOAuthConfig holds OAuth configuration
type GitHubOAuthConfig struct {
	ClientID     string
	ClientSecret string
	RedirectURL  string
	Scopes       []string
}

// AuthService handles authentication operations
type AuthService struct {
	config   GitHubOAuthConfig
	userRepo *repository.UserRepository
}

// NewAuthService creates a new auth service
func NewAuthService(config GitHubOAuthConfig, userRepo *repository.UserRepository) *AuthService {
	return &AuthService{
		config:   config,
		userRepo: userRepo,
	}
}

// GenerateStateToken generates a random state token for OAuth
func GenerateStateToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(b), nil
}

// GetAuthorizationURL returns the GitHub OAuth authorization URL
func (s *AuthService) GetAuthorizationURL(state string) string {
	baseURL := "https://github.com/login/oauth/authorize"
	params := url.Values{}
	params.Add("client_id", s.config.ClientID)
	params.Add("redirect_uri", s.config.RedirectURL)
	params.Add("state", state)
	params.Add("scope", "read:user user:email repo")

	return fmt.Sprintf("%s?%s", baseURL, params.Encode())
}

// GitHubAccessTokenResponse represents GitHub's access token response
type GitHubAccessTokenResponse struct {
	AccessToken string `json:"access_token"`
	TokenType   string `json:"token_type"`
	Scope       string `json:"scope"`
}

// ExchangeCodeForToken exchanges authorization code for access token
func (s *AuthService) ExchangeCodeForToken(ctx context.Context, code string) (string, error) {
	tokenURL := "https://github.com/login/oauth/access_token"

	data := url.Values{}
	data.Set("client_id", s.config.ClientID)
	data.Set("client_secret", s.config.ClientSecret)
	data.Set("code", code)
	data.Set("redirect_uri", s.config.RedirectURL)

	req, err := http.NewRequestWithContext(ctx, "POST", tokenURL, nil)
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	req.URL.RawQuery = data.Encode()
	req.Header.Set("Accept", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to exchange code: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("GitHub returned status %d: %s", resp.StatusCode, body)
	}

	var tokenResp GitHubAccessTokenResponse
	if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil {
		return "", fmt.Errorf("failed to decode response: %w", err)
	}

	return tokenResp.AccessToken, nil
}

// GitHubUserResponse represents GitHub user API response
type GitHubUserResponse struct {
	ID                int64  `json:"id"`
	Login             string `json:"login"`
	Name              string `json:"name"`
	Email             string `json:"email"`
	AvatarURL         string `json:"avatar_url"`
	Bio               string `json:"bio"`
	Location          string `json:"location"`
	Company           string `json:"company"`
	Blog              string `json:"blog"`
	TwitterUsername   string `json:"twitter_username"`
	PublicRepos       int    `json:"public_repos"`
	PublicGists       int    `json:"public_gists"`
	Followers         int    `json:"followers"`
	Following         int    `json:"following"`
	TotalPrivateRepos int    `json:"total_private_repos"`
	OwnedPrivateRepos int    `json:"owned_private_repos"`
	PrivateGists      int    `json:"private_gists"`
	DiskUsage         int    `json:"disk_usage"`
	Collaborators     int    `json:"collaborators"`
}

// GetGitHubUser fetches user information from GitHub API
func (s *AuthService) GetGitHubUser(ctx context.Context, accessToken string) (*GitHubUserResponse, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", "https://api.github.com/user", nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Accept", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch user: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("GitHub API returned status: %d", resp.StatusCode)
	}

	var user GitHubUserResponse
	if err := json.NewDecoder(resp.Body).Decode(&user); err != nil {
		return nil, fmt.Errorf("failed to decode user: %w", err)
	}

	return &user, nil
}

// CheckPrivateRepoAccess checks if token has private repo access
func (s *AuthService) CheckPrivateRepoAccess(ctx context.Context, accessToken string) bool {
	req, err := http.NewRequestWithContext(ctx, "GET", "https://api.github.com/user/repos?type=private&per_page=1", nil)
	if err != nil {
		return false
	}

	req.Header.Set("Authorization", "Bearer "+accessToken)
	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return false
	}
	defer resp.Body.Close()

	return resp.StatusCode == http.StatusOK
}

// CreateOrUpdateUser creates or updates user in database
func (s *AuthService) CreateOrUpdateUser(ctx context.Context, ghUser *GitHubUserResponse, accessToken string) (*models.UserWithToken, error) {
	// Check for existing user
	existingUser, err := s.userRepo.GetUserByGitHubID(ctx, ghUser.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to check existing user: %w", err)
	}

	hasPrivateAccess := s.CheckPrivateRepoAccess(ctx, accessToken)

	user := &models.UserWithToken{
		User: models.User{
			GitHubID:         ghUser.ID,
			Username:         ghUser.Login,
			Name:             ghUser.Name,
			Email:            ghUser.Email,
			AvatarURL:        ghUser.AvatarURL,
			Bio:              ghUser.Bio,
			Location:         ghUser.Location,
			Company:          ghUser.Company,
			Blog:             ghUser.Blog,
			TwitterUsername:  ghUser.TwitterUsername,
			PublicRepos:      ghUser.PublicRepos,
			PublicGists:      ghUser.PublicGists,
			Followers:        ghUser.Followers,
			Following:        ghUser.Following,
			HasPrivateAccess: hasPrivateAccess,
		},
		AccessToken: accessToken,
	}

	if existingUser != nil {
		// Update existing user
		user.ID = existingUser.ID
		if err := s.userRepo.UpdateUser(ctx, user); err != nil {
			return nil, fmt.Errorf("failed to update user: %w", err)
		}
	} else {
		// Create new user
		if err := s.userRepo.CreateUser(ctx, user); err != nil {
			return nil, fmt.Errorf("failed to create user: %w", err)
		}
	}

	return user, nil
}

// CreateSession creates a new session for the user
func (s *AuthService) CreateSession(ctx context.Context, userID int) (*models.Session, error) {
	sessionID, err := GenerateStateToken()
	if err != nil {
		return nil, fmt.Errorf("failed to generate session ID: %w", err)
	}

	session := &models.Session{
		ID:        sessionID,
		UserID:    userID,
		ExpiresAt: time.Now().Add(30 * 24 * time.Hour), // 30 days
		CreatedAt: time.Now(),
	}

	if err := s.userRepo.CreateSession(ctx, session); err != nil {
		return nil, fmt.Errorf("failed to create session: %w", err)
	}

	return session, nil
}

// ValidateSession validates a session token
func (s *AuthService) ValidateSession(ctx context.Context, sessionID string) (*models.User, error) {
	session, err := s.userRepo.GetSession(ctx, sessionID)
	if err != nil {
		return nil, fmt.Errorf("failed to get session: %w", err)
	}

	if session == nil || session.ExpiresAt.Before(time.Now()) {
		return nil, fmt.Errorf("invalid or expired session")
	}

	user, err := s.userRepo.GetUserByID(ctx, session.UserID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	if user == nil {
		return nil, fmt.Errorf("user not found")
	}

	return user, nil
}

// DeleteSession logs out a user by deleting their session
func (s *AuthService) DeleteSession(ctx context.Context, sessionID string) error {
	return s.userRepo.DeleteSession(ctx, sessionID)
}

// GetFullGitHubUserData fetches the authenticated user's full GitHub data including private repos
func (s *AuthService) GetFullGitHubUserData(ctx context.Context, accessToken string) (*GitHubUserResponse, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", "https://api.github.com/user", nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Accept", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch user: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("GitHub API returned status: %d", resp.StatusCode)
	}

	var user GitHubUserResponse
	if err := json.NewDecoder(resp.Body).Decode(&user); err != nil {
		return nil, fmt.Errorf("failed to decode user: %w", err)
	}

	return &user, nil
}

// GetUserWithToken retrieves user with access token from database
func (s *AuthService) GetUserWithToken(ctx context.Context, userID int) (*models.UserWithToken, error) {
	return s.userRepo.GetUserWithTokenByID(ctx, userID)
}
