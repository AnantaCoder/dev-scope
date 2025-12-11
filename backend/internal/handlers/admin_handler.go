// Package handlers provides admin-only operations for DevScope
package handlers

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

	"github-api/backend/internal/models"
)

// AdminUsernames - list of usernames that can trigger admin actions
var AdminUsernames = []string{"anantacoder", "AnantaCoder"}

// AdminHandler handles admin-only operations
type AdminHandler struct {
	db *sql.DB
}

// NewAdminHandler creates a new admin handler
func NewAdminHandler(db *sql.DB) *AdminHandler {
	return &AdminHandler{db: db}
}

// UpdateAllPrivateDataResponse is the response for the update endpoint
type UpdateAllPrivateDataResponse struct {
	Success      bool     `json:"success"`
	Message      string   `json:"message"`
	TotalUsers   int      `json:"total_users"`
	SuccessCount int      `json:"success_count"`
	FailCount    int      `json:"fail_count"`
	Duration     string   `json:"duration"`
	FailedUsers  []string `json:"failed_users"`
}

// TriggerPrivateDataUpdate handles POST /api/admin/update-all-private-data
// Only accessible by admin users (anantacoder)
func (h *AdminHandler) TriggerPrivateDataUpdate(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "Method not allowed"})
		return
	}

	ctx := r.Context()

	// Get current user from context
	user, ok := GetUserFromContext(ctx)
	if !ok || user == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "Unauthorized"})
		return
	}

	// Verify user is admin
	if !isAdmin(user.Username) {
		writeJSON(w, http.StatusForbidden, map[string]string{"error": "Forbidden: Admin access required"})
		return
	}

	// Run the update
	log.Printf("[ADMIN] User %s (ID: %d) triggered private data update for all users", user.Username, user.ID)

	start := time.Now()
	result, err := h.updateAllUsersPrivateData(ctx)
	if err != nil {
		log.Printf("[ADMIN] Update failed: %v", err)
		writeJSON(w, http.StatusInternalServerError, UpdateAllPrivateDataResponse{
			Success: false,
			Message: fmt.Sprintf("Update failed: %v", err),
		})
		return
	}

	result.Duration = time.Since(start).String()
	result.Success = true
	result.Message = fmt.Sprintf("Successfully updated %d/%d users", result.SuccessCount, result.TotalUsers)

	log.Printf("[ADMIN] Update completed: %d success, %d failed in %s", result.SuccessCount, result.FailCount, result.Duration)

	writeJSON(w, http.StatusOK, result)
}

// GetUpdateStatus handles GET /api/admin/update-status
func (h *AdminHandler) GetUpdateStatus(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "Method not allowed"})
		return
	}

	ctx := r.Context()

	// Get current user from context
	user, ok := GetUserFromContext(ctx)
	if !ok || user == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "Unauthorized"})
		return
	}

	// Verify user is admin
	if !isAdmin(user.Username) {
		writeJSON(w, http.StatusForbidden, map[string]string{"error": "Forbidden: Admin access required"})
		return
	}

	// Get stats
	var totalUsers, updatedUsers int
	var lastUpdate sql.NullTime

	err := h.db.QueryRowContext(ctx, "SELECT COUNT(*) FROM users WHERE access_token IS NOT NULL AND access_token != ''").Scan(&totalUsers)
	if err != nil {
		totalUsers = 0
	}

	err = h.db.QueryRowContext(ctx, "SELECT COUNT(*) FROM user_private_data").Scan(&updatedUsers)
	if err != nil {
		updatedUsers = 0
	}

	err = h.db.QueryRowContext(ctx, "SELECT MAX(updated_at) FROM user_private_data").Scan(&lastUpdate)

	var lastUpdateStr *string
	if lastUpdate.Valid {
		t := lastUpdate.Time.Format(time.RFC3339)
		lastUpdateStr = &t
	}

	response := map[string]interface{}{
		"total_users":    totalUsers,
		"updated_users":  updatedUsers,
		"pending_users":  totalUsers - updatedUsers,
		"last_update":    lastUpdateStr,
		"is_admin":       true,
		"admin_username": user.Username,
	}

	writeJSON(w, http.StatusOK, response)
}

func isAdmin(username string) bool {
	for _, admin := range AdminUsernames {
		if strings.EqualFold(username, admin) {
			return true
		}
	}
	return false
}

// userRow represents a user from the database for admin operations
type userRow struct {
	ID       int
	GithubID int64
	Token    string
	Username string
}

func (h *AdminHandler) updateAllUsersPrivateData(ctx context.Context) (*UpdateAllPrivateDataResponse, error) {
	// Query all users with tokens
	query := `
		   SELECT id, COALESCE(github_id, 0), access_token, COALESCE(username, '') 
		   FROM users 
		   WHERE access_token IS NOT NULL AND access_token != '' AND has_private_access = true
	   `

	rows, err := h.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("query users: %w", err)
	}
	defer rows.Close()

	var users []userRow
	for rows.Next() {
		var u userRow
		if err := rows.Scan(&u.ID, &u.GithubID, &u.Token, &u.Username); err != nil {
			continue
		}
		if strings.TrimSpace(u.Token) != "" {
			users = append(users, u)
		}
	}

	result := &UpdateAllPrivateDataResponse{
		TotalUsers:  len(users),
		FailedUsers: []string{},
	}

	if len(users) == 0 {
		return result, nil
	}

	// Process users concurrently (5 workers)
	var wg sync.WaitGroup
	sem := make(chan struct{}, 5)
	var mu sync.Mutex

	for _, user := range users {
		wg.Add(1)
		go func(u userRow) {
			defer wg.Done()
			sem <- struct{}{}
			defer func() { <-sem }()

			if err := h.processUser(ctx, u); err != nil {
				log.Printf("[ADMIN] Failed to update user %d (%s): %v", u.ID, u.Username, err)
				mu.Lock()
				result.FailCount++
				result.FailedUsers = append(result.FailedUsers, u.Username)
				mu.Unlock()
			} else {
				log.Printf("[ADMIN] Updated user %d (%s)", u.ID, u.Username)
				mu.Lock()
				result.SuccessCount++
				mu.Unlock()
			}

			time.Sleep(250 * time.Millisecond) // Rate limit
		}(user)
	}

	wg.Wait()
	return result, nil
}

func (h *AdminHandler) processUser(ctx context.Context, user userRow) error {
	// Fetch user data from GitHub
	userData, err := fetchGitHubAPIAdmin[GitHubUserData](ctx, "/user", user.Token)
	if err != nil {
		return fmt.Errorf("fetch /user: %w", err)
	}

	// Fetch emails
	emails, _ := fetchGitHubAPIAdmin[[]GitHubEmailData](ctx, "/user/emails", user.Token)
	if emails == nil {
		emails = &[]GitHubEmailData{}
	}

	// Fetch orgs
	orgs, _ := fetchGitHubAPIAdmin[[]GitHubOrgData](ctx, "/user/orgs", user.Token)
	if orgs == nil {
		orgs = &[]GitHubOrgData{}
	}

	// Fetch private repos
	repos, _ := fetchGitHubAPIAdmin[[]GitHubRepoData](ctx, "/user/repos?visibility=private&per_page=100", user.Token)
	if repos == nil {
		repos = &[]GitHubRepoData{}
	}

	// Fetch SSH keys
	sshKeys, _ := fetchGitHubAPIAdmin[[]map[string]interface{}](ctx, "/user/keys", user.Token)
	sshKeysCount := 0
	if sshKeys != nil {
		sshKeysCount = len(*sshKeys)
	}

	// Fetch GPG keys
	gpgKeys, _ := fetchGitHubAPIAdmin[[]map[string]interface{}](ctx, "/user/gpg_keys", user.Token)
	gpgKeysCount := 0
	if gpgKeys != nil {
		gpgKeysCount = len(*gpgKeys)
	}

	// Process data
	privateReposCount := 0
	for _, r := range *repos {
		if r.Private {
			privateReposCount++
		}
	}

	var primaryEmail string
	emailsCount := len(*emails)
	verifiedEmailsCount := 0
	for _, e := range *emails {
		if e.Primary {
			primaryEmail = e.Email
		}
		if e.Verified {
			verifiedEmailsCount++
		}
	}

	orgsJSON, _ := json.Marshal(orgs)
	reposJSON, _ := json.Marshal(repos)

	var planName string
	var planSpace int64
	var planPrivateRepos, planCollaborators int
	if userData.Plan != nil {
		planName = userData.Plan.Name
		planSpace = userData.Plan.Space
		planPrivateRepos = userData.Plan.PrivateRepos
		planCollaborators = userData.Plan.Collaborators
	}

	githubID := user.GithubID
	if githubID == 0 {
		githubID = userData.ID
	}

	// Upsert query
	upsertQuery := `
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
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, NOW(), NOW())
ON CONFLICT (user_id) DO UPDATE SET
    github_id = EXCLUDED.github_id,
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
    fetched_at = NOW(),
    updated_at = NOW();
`

	_, err = h.db.ExecContext(ctx, upsertQuery,
		user.ID, githubID,
		privateReposCount, userData.OwnedPrivateRepos, userData.TotalPrivateRepos,
		userData.PrivateGists, userData.DiskUsage, userData.Collaborators, userData.TwoFactorAuthentication,
		planName, planSpace, planCollaborators, planPrivateRepos,
		primaryEmail, emailsCount, verifiedEmailsCount,
		len(*orgs), string(orgsJSON),
		0, 0, // starred, watching (skip for performance)
		sshKeysCount, gpgKeysCount,
		string(reposJSON), nil,
	)

	return err
}

// GitHub API types for admin handler
type GitHubUserData struct {
	ID                      int64           `json:"id"`
	Login                   string          `json:"login"`
	TotalPrivateRepos       int             `json:"total_private_repos"`
	OwnedPrivateRepos       int             `json:"owned_private_repos"`
	PrivateGists            int             `json:"private_gists"`
	DiskUsage               int64           `json:"disk_usage"`
	Collaborators           int             `json:"collaborators"`
	TwoFactorAuthentication bool            `json:"two_factor_authentication"`
	Plan                    *GitHubPlanData `json:"plan"`
}

type GitHubPlanData struct {
	Name          string `json:"name"`
	Space         int64  `json:"space"`
	PrivateRepos  int    `json:"private_repos"`
	Collaborators int    `json:"collaborators"`
}

type GitHubEmailData struct {
	Email    string `json:"email"`
	Primary  bool   `json:"primary"`
	Verified bool   `json:"verified"`
}

type GitHubOrgData struct {
	ID    int64  `json:"id"`
	Login string `json:"login"`
}

type GitHubRepoData struct {
	ID      int64  `json:"id"`
	Name    string `json:"name"`
	Private bool   `json:"private"`
}

func fetchGitHubAPIAdmin[T any](ctx context.Context, path, token string) (*T, error) {
	url := "https://api.github.com" + path

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("User-Agent", "DevScope-Admin")
	req.Header.Set("X-GitHub-Api-Version", "2022-11-28")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("API error %d: %s", resp.StatusCode, string(body))
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var result T
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, err
	}

	return &result, nil
}

// IsAdminUser checks if a user is an admin (exported for use in other packages)
func IsAdminUser(user *models.User) bool {
	if user == nil {
		return false
	}
	return isAdmin(user.Username)
}
