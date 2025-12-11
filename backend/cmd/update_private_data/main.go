package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

const (
	defaultInterval = 60 * time.Minute
	defaultWorkers  = 5
	githubAPIBase   = "https://api.github.com"

	// Upsert query matching the existing schema in database/postgres.go
	upsertQuery = `
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
)

// GitHubUser represents the GitHub API user response
type GitHubUser struct {
	ID                      int64  `json:"id"`
	Login                   string `json:"login"`
	TotalPrivateRepos       int    `json:"total_private_repos"`
	OwnedPrivateRepos       int    `json:"owned_private_repos"`
	PrivateGists            int    `json:"private_gists"`
	DiskUsage               int64  `json:"disk_usage"`
	Collaborators           int    `json:"collaborators"`
	TwoFactorAuthentication bool   `json:"two_factor_authentication"`
	Plan                    *Plan  `json:"plan"`
}

// Plan represents GitHub plan info
type Plan struct {
	Name          string `json:"name"`
	Space         int64  `json:"space"`
	PrivateRepos  int    `json:"private_repos"`
	Collaborators int    `json:"collaborators"`
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
	Description string `json:"description"`
	AvatarURL   string `json:"avatar_url"`
}

// GitHubRepo represents a GitHub repository
type GitHubRepo struct {
	ID          int64  `json:"id"`
	Name        string `json:"name"`
	FullName    string `json:"full_name"`
	Private     bool   `json:"private"`
	Description string `json:"description"`
	Language    string `json:"language"`
	Size        int64  `json:"size"`
	StarCount   int    `json:"stargazers_count"`
	ForkCount   int    `json:"forks_count"`
	CreatedAt   string `json:"created_at"`
	UpdatedAt   string `json:"updated_at"`
	PushedAt    string `json:"pushed_at"`
}

// UserRow represents a user from the database
type UserRow struct {
	ID       int
	GithubID int64
	Token    string
	Username string
}

func main() {
	// CLI flags
	once := flag.Bool("once", false, "Run once and exit")
	interval := flag.Duration("interval", defaultInterval, "Interval for periodic updates (e.g., 60m, 2h)")
	workers := flag.Int("workers", defaultWorkers, "Number of concurrent workers")
	envFile := flag.String("env-file", ".env", "Path to .env file")
	flag.Parse()

	// Load .env file
	if *envFile != "" {
		if err := godotenv.Load(*envFile); err != nil {
			log.Printf("Warning: could not load %s: %v", *envFile, err)
		}
	}

	// Get DATABASE_URL
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL environment variable is required")
	}

	ctx := context.Background()

	// Connect to database
	pool, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer pool.Close()

	// Test connection
	if err := pool.Ping(ctx); err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}
	log.Println("Connected to database successfully")

	// Run function
	runUpdate := func() {
		log.Println("Starting private data update...")
		start := time.Now()
		if err := updateAllUsers(ctx, pool, *workers); err != nil {
			log.Printf("Update failed: %v", err)
		} else {
			log.Printf("Update completed in %v", time.Since(start))
		}
	}

	if *once {
		runUpdate()
		return
	}

	// Run immediately, then on interval
	runUpdate()

	ticker := time.NewTicker(*interval)
	defer ticker.Stop()

	log.Printf("Scheduled to run every %v", *interval)

	for {
		select {
		case <-ticker.C:
			runUpdate()
		case <-ctx.Done():
			log.Println("Shutting down...")
			return
		}
	}
}

func updateAllUsers(ctx context.Context, db *pgxpool.Pool, workers int) error {
	// Detect token column
	tokenCol, err := detectTokenColumn(ctx, db)
	if err != nil {
		return fmt.Errorf("detect token column: %w", err)
	}
	if tokenCol == "" {
		return fmt.Errorf("no token column found in users table")
	}
	log.Printf("Using token column: %s", tokenCol)

	// Query all users with tokens and who have granted private access
	query := fmt.Sprintf(`
		SELECT id, COALESCE(github_id, 0), %s, COALESCE(username, '') 
		FROM users 
		WHERE %s IS NOT NULL AND %s != '' AND has_private_access = true
	`, tokenCol, tokenCol, tokenCol)

	rows, err := db.Query(ctx, query)
	if err != nil {
		return fmt.Errorf("query users: %w", err)
	}
	defer rows.Close()

	var users []UserRow
	for rows.Next() {
		var u UserRow
		if err := rows.Scan(&u.ID, &u.GithubID, &u.Token, &u.Username); err != nil {
			log.Printf("Error scanning user: %v", err)
			continue
		}
		if strings.TrimSpace(u.Token) != "" {
			users = append(users, u)
		}
	}

	log.Printf("Found %d users with tokens to update", len(users))

	if len(users) == 0 {
		return nil
	}

	// Process users concurrently
	var wg sync.WaitGroup
	sem := make(chan struct{}, workers)
	var successCount, failCount int
	var mu sync.Mutex

	for _, user := range users {
		wg.Add(1)
		go func(u UserRow) {
			defer wg.Done()
			sem <- struct{}{}
			defer func() { <-sem }()

			if err := processUser(ctx, db, u); err != nil {
				log.Printf("[FAIL] User %d (%s): %v", u.ID, u.Username, err)
				mu.Lock()
				failCount++
				mu.Unlock()
				// If the failure is due to bad credentials (401), disable private access for the user
				if strings.Contains(err.Error(), "API error 401") || strings.Contains(strings.ToLower(err.Error()), "bad credentials") {
					if _, execErr := db.Exec(ctx, "UPDATE users SET has_private_access = FALSE WHERE id = $1", u.ID); execErr != nil {
						log.Printf("[FAIL] Could not disable has_private_access for user %d (%s): %v", u.ID, u.Username, execErr)
					} else {
						log.Printf("[INFO] Disabled has_private_access for user %d (%s) due to credentials error", u.ID, u.Username)
					}
				}
			} else {
				log.Printf("[OK] User %d (%s) updated", u.ID, u.Username)
				mu.Lock()
				successCount++
				mu.Unlock()
			}

			// Rate limit: 250ms between requests per worker
			time.Sleep(250 * time.Millisecond)
		}(user)
	}

	wg.Wait()

	log.Printf("Update complete: %d success, %d failed", successCount, failCount)
	return nil
}

func detectTokenColumn(ctx context.Context, db *pgxpool.Pool) (string, error) {
	candidates := []string{
		"github_access_token",
		"github_token",
		"access_token",
		"token",
		"oauth_token",
	}

	for _, col := range candidates {
		var exists bool
		query := `
			SELECT EXISTS (
				SELECT 1 FROM information_schema.columns 
				WHERE table_name = 'users' AND column_name = $1
			)
		`
		if err := db.QueryRow(ctx, query, col).Scan(&exists); err != nil {
			return "", err
		}
		if exists {
			return col, nil
		}
	}
	return "", nil
}

func processUser(ctx context.Context, db *pgxpool.Pool, user UserRow) error {
	// Fetch user data from GitHub
	userData, err := fetchGitHubAPI[GitHubUser](ctx, "/user", user.Token)
	if err != nil {
		return fmt.Errorf("fetch /user: %w", err)
	}

	// Fetch private emails
	emails, err := fetchGitHubAPI[[]GitHubEmail](ctx, "/user/emails", user.Token)
	if err != nil {
		log.Printf("Warning: could not fetch emails for user %d: %v", user.ID, err)
		emails = &[]GitHubEmail{}
	}

	// Fetch private orgs
	orgs, err := fetchGitHubAPI[[]GitHubOrg](ctx, "/user/orgs", user.Token)
	if err != nil {
		log.Printf("Warning: could not fetch orgs for user %d: %v", user.ID, err)
		orgs = &[]GitHubOrg{}
	}

	// Fetch private repos
	repos, err := fetchGitHubAPI[[]GitHubRepo](ctx, "/user/repos?visibility=private&per_page=100", user.Token)
	if err != nil {
		log.Printf("Warning: could not fetch private repos for user %d: %v", user.ID, err)
		repos = &[]GitHubRepo{}
	}

	// Fetch starred repos count
	starredCount := 0
	starred, err := fetchGitHubAPI[[]GitHubRepo](ctx, "/user/starred?per_page=1", user.Token)
	if err == nil && starred != nil {
		// We need to get the count from headers, but for now estimate
		starredCount = len(*starred)
	}

	// Fetch watching repos count
	watchingCount := 0
	watching, err := fetchGitHubAPI[[]GitHubRepo](ctx, "/user/subscriptions?per_page=1", user.Token)
	if err == nil && watching != nil {
		watchingCount = len(*watching)
	}

	// Fetch SSH keys count
	sshKeysCount := 0
	sshKeys, err := fetchGitHubAPI[[]map[string]interface{}](ctx, "/user/keys", user.Token)
	if err == nil && sshKeys != nil {
		sshKeysCount = len(*sshKeys)
	}

	// Fetch GPG keys count
	gpgKeysCount := 0
	gpgKeys, err := fetchGitHubAPI[[]map[string]interface{}](ctx, "/user/gpg_keys", user.Token)
	if err == nil && gpgKeys != nil {
		gpgKeysCount = len(*gpgKeys)
	}

	// Count private repos
	privateReposCount := 0
	for _, r := range *repos {
		if r.Private {
			privateReposCount++
		}
	}

	// Find primary email and count verified
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

	// Prepare JSON data
	orgsJSON, _ := json.Marshal(orgs)
	reposJSON, _ := json.Marshal(repos)

	// Extract plan info
	var planName string
	var planSpace int64
	var planPrivateRepos, planCollaborators int
	if userData.Plan != nil {
		planName = userData.Plan.Name
		planSpace = userData.Plan.Space
		planPrivateRepos = userData.Plan.PrivateRepos
		planCollaborators = userData.Plan.Collaborators
	}

	// Use github_id from userData if user.GithubID is 0
	githubID := user.GithubID
	if githubID == 0 {
		githubID = userData.ID
	}

	// Upsert into database matching the existing schema
	_, err = db.Exec(ctx, upsertQuery,
		user.ID,                          // $1: user_id
		githubID,                         // $2: github_id
		privateReposCount,                // $3: private_repos
		userData.OwnedPrivateRepos,       // $4: owned_private_repos
		userData.TotalPrivateRepos,       // $5: total_private_repos
		userData.PrivateGists,            // $6: private_gists
		userData.DiskUsage,               // $7: disk_usage
		userData.Collaborators,           // $8: collaborators
		userData.TwoFactorAuthentication, // $9: two_factor_enabled
		planName,                         // $10: plan_name
		planSpace,                        // $11: plan_space
		planCollaborators,                // $12: plan_collaborators
		planPrivateRepos,                 // $13: plan_private_repos
		primaryEmail,                     // $14: primary_email
		emailsCount,                      // $15: emails_count
		verifiedEmailsCount,              // $16: verified_emails_count
		len(*orgs),                       // $17: organizations_count
		string(orgsJSON),                 // $18: organizations_data
		starredCount,                     // $19: starred_repos_count
		watchingCount,                    // $20: watching_repos_count
		sshKeysCount,                     // $21: ssh_keys_count
		gpgKeysCount,                     // $22: gpg_keys_count
		string(reposJSON),                // $23: recent_private_repos
		nil,                              // $24: recent_events (null for now)
	)

	if err != nil {
		return fmt.Errorf("upsert: %w", err)
	}

	return nil
}

func fetchGitHubAPI[T any](ctx context.Context, path, token string) (*T, error) {
	url := githubAPIBase + path

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("User-Agent", "DevScope-PrivateDataUpdater")
	req.Header.Set("X-GitHub-Api-Version", "2022-11-28")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusUnauthorized {
		return nil, fmt.Errorf("unauthorized: invalid or expired token")
	}

	if resp.StatusCode == http.StatusForbidden {
		reset := resp.Header.Get("X-RateLimit-Reset")
		return nil, fmt.Errorf("rate limited (reset: %s)", reset)
	}

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
		return nil, fmt.Errorf("unmarshal: %w", err)
	}

	return &result, nil
}
