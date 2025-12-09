// Package handlers provides authentication HTTP handlers
package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github-api/backend/internal/auth"
	"github-api/backend/internal/models"
	"github-api/backend/internal/repository"
)

// AuthHandler handles authentication routes
type AuthHandler struct {
	authService    *auth.AuthService
	userRepo       *repository.UserRepository
	rankingService interface {
		UpdateUserRanking(ctx context.Context, username string) error
	}
	frontendURL string
	stateTTL    map[string]time.Time
}

// NewAuthHandler creates a new auth handler
func NewAuthHandler(authService *auth.AuthService, userRepo *repository.UserRepository, frontendURL string, rankingService interface {
	UpdateUserRanking(ctx context.Context, username string) error
}) *AuthHandler {
	handler := &AuthHandler{
		authService:    authService,
		userRepo:       userRepo,
		rankingService: rankingService,
		frontendURL:    frontendURL,
		stateTTL:       make(map[string]time.Time),
	}

	// Clean up expired states periodically
	go handler.cleanupExpiredStates()

	return handler
}

// cleanupExpiredStates removes expired OAuth state tokens
func (h *AuthHandler) cleanupExpiredStates() {
	ticker := time.NewTicker(5 * time.Minute)
	for range ticker.C {
		now := time.Now()
		for state, expiry := range h.stateTTL {
			if now.After(expiry) {
				delete(h.stateTTL, state)
			}
		}
	}
}

// LoginHandler initiates GitHub OAuth flow
func (h *AuthHandler) LoginHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, models.AuthResponse{
			Error:   true,
			Message: "Method not allowed",
		})
		return
	}

	// Generate state token
	state, err := auth.GenerateStateToken()
	if err != nil {
		log.Printf("❌ [Auth] Failed to generate state: %v", err)
		writeJSON(w, http.StatusInternalServerError, models.AuthResponse{
			Error:   true,
			Message: "Failed to initiate login",
		})
		return
	}

	// Store state with expiry (5 minutes)
	h.stateTTL[state] = time.Now().Add(5 * time.Minute)

	// Get authorization URL
	authURL := h.authService.GetAuthorizationURL(state)

	log.Printf("🔐 [Auth] Login initiated from %s - Redirecting to GitHub", getClientIP(r))

	// Redirect to GitHub OAuth
	http.Redirect(w, r, authURL, http.StatusTemporaryRedirect)
}

// CallbackHandler handles GitHub OAuth callback
func (h *AuthHandler) CallbackHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse query parameters
	code := r.URL.Query().Get("code")
	state := r.URL.Query().Get("state")
	errorParam := r.URL.Query().Get("error")

	// Check for OAuth errors
	if errorParam != "" {
		log.Printf("❌ [Auth] OAuth error: %s", errorParam)
		http.Redirect(w, r, fmt.Sprintf("%s?error=access_denied", h.frontendURL), http.StatusTemporaryRedirect)
		return
	}

	// Validate state
	expiry, exists := h.stateTTL[state]
	if !exists || time.Now().After(expiry) {
		log.Printf("❌ [Auth] Invalid or expired state token")
		http.Redirect(w, r, fmt.Sprintf("%s?error=invalid_state", h.frontendURL), http.StatusTemporaryRedirect)
		return
	}

	// Remove used state
	delete(h.stateTTL, state)

	ctx := r.Context()

	// Exchange code for access token
	accessToken, err := h.authService.ExchangeCodeForToken(ctx, code)
	if err != nil {
		log.Printf("❌ [Auth] Failed to exchange code: %v", err)
		http.Redirect(w, r, fmt.Sprintf("%s?error=token_exchange_failed", h.frontendURL), http.StatusTemporaryRedirect)
		return
	}

	// Get user information from GitHub
	ghUser, err := h.authService.GetGitHubUser(ctx, accessToken)
	if err != nil {
		log.Printf("❌ [Auth] Failed to get GitHub user: %v", err)
		http.Redirect(w, r, fmt.Sprintf("%s?error=user_fetch_failed", h.frontendURL), http.StatusTemporaryRedirect)
		return
	}

	// Create or update user in database
	user, err := h.authService.CreateOrUpdateUser(ctx, ghUser, accessToken)
	if err != nil {
		log.Printf("❌ [Auth] Failed to create/update user: %v", err)
		http.Redirect(w, r, fmt.Sprintf("%s?error=database_error", h.frontendURL), http.StatusTemporaryRedirect)
		return
	}

	// Create session
	session, err := h.authService.CreateSession(ctx, user.ID)
	if err != nil {
		log.Printf("❌ [Auth] Failed to create session: %v", err)
		http.Redirect(w, r, fmt.Sprintf("%s?error=session_creation_failed", h.frontendURL), http.StatusTemporaryRedirect)
		return
	}

	// Log activity
	h.logUserActivity(ctx, user.ID, "login", r)

	log.Printf("✅ [Auth] User %s logged in successfully", user.Username)

	// Update user ranking (only OAuth authenticated users appear in leaderboard)
	if h.rankingService != nil {
		go func(username string) {
			rankCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
			defer cancel()
			if err := h.rankingService.UpdateUserRanking(rankCtx, username); err != nil {
				log.Printf("⚠️ [Ranking] Failed to update ranking for %s: %v", username, err)
			}
		}(user.Username)
	}

	// Set session cookie with production-ready settings
	isProduction := h.isProduction()
	cookie := &http.Cookie{
		Name:     "session_token",
		Value:    session.ID,
		Path:     "/",
		HttpOnly: true,
		Secure:   isProduction, // true in production (HTTPS required)
		SameSite: getSameSiteMode(isProduction),
		MaxAge:   30 * 24 * 60 * 60, // 30 days
	}

	// In production, set Domain to allow cross-subdomain cookies if needed
	if isProduction {
		log.Printf("🔐 [Auth] Setting secure cookie for production (Secure=true, SameSite=None)")
	}

	http.SetCookie(w, cookie)

	log.Printf("✅ [Auth] Cookie set for user %s (avatar: %s)", user.Username, user.AvatarURL)

	// Redirect to frontend
	redirectURL := fmt.Sprintf("%s?login=success", h.frontendURL)
	log.Printf("🔄 [Auth] Redirecting to: %s", redirectURL)
	http.Redirect(w, r, redirectURL, http.StatusTemporaryRedirect)
}

// MeHandler returns current user information
func (h *AuthHandler) MeHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, models.AuthResponse{
			Error:   true,
			Message: "Method not allowed",
		})
		return
	}

	user, ok := r.Context().Value("user").(*models.User)
	if !ok {
		writeJSON(w, http.StatusUnauthorized, models.AuthResponse{
			Error:   true,
			Message: "Unauthorized",
		})
		return
	}

	writeJSON(w, http.StatusOK, models.AuthResponse{
		Error: false,
		User:  user,
	})
}

// MeFullHandler returns current user's full GitHub data including private repos
func (h *AuthHandler) MeFullHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]interface{}{
			"error":   true,
			"message": "Method not allowed",
		})
		return
	}

	user, ok := r.Context().Value("user").(*models.User)
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]interface{}{
			"error":   true,
			"message": "Unauthorized",
		})
		return
	}

	ctx := r.Context()

	// Get user with access token
	userWithToken, err := h.authService.GetUserWithToken(ctx, user.ID)
	if err != nil || userWithToken == nil {
		log.Printf("❌ [Auth] Failed to get user token: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{
			"error":   true,
			"message": "Failed to retrieve user data",
		})
		return
	}

	// Fetch full GitHub data using user's access token
	ghUser, err := h.authService.GetFullGitHubUserData(ctx, userWithToken.AccessToken)
	if err != nil {
		log.Printf("❌ [Auth] Failed to fetch GitHub data: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{
			"error":   true,
			"message": "Failed to fetch GitHub data",
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"error": false,
		"data": map[string]interface{}{
			"id":                  ghUser.ID,
			"login":               ghUser.Login,
			"name":                ghUser.Name,
			"email":               ghUser.Email,
			"avatar_url":          ghUser.AvatarURL,
			"bio":                 ghUser.Bio,
			"location":            ghUser.Location,
			"company":             ghUser.Company,
			"blog":                ghUser.Blog,
			"twitter_username":    ghUser.TwitterUsername,
			"public_repos":        ghUser.PublicRepos,
			"public_gists":        ghUser.PublicGists,
			"followers":           ghUser.Followers,
			"following":           ghUser.Following,
			"total_private_repos": ghUser.TotalPrivateRepos,
			"owned_private_repos": ghUser.OwnedPrivateRepos,
			"private_gists":       ghUser.PrivateGists,
			"disk_usage":          ghUser.DiskUsage,
			"collaborators":       ghUser.Collaborators,
			"has_private_access":  user.HasPrivateAccess,
		},
	})
}

// LogoutHandler logs out the user
func (h *AuthHandler) LogoutHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, models.AuthResponse{
			Error:   true,
			Message: "Method not allowed",
		})
		return
	}

	// Get session from cookie
	cookie, err := r.Cookie("session_token")
	if err != nil {
		writeJSON(w, http.StatusOK, models.AuthResponse{
			Error:   false,
			Message: "Logged out",
		})
		return
	}

	// Delete session from database
	ctx := r.Context()
	if err := h.authService.DeleteSession(ctx, cookie.Value); err != nil {
		log.Printf("⚠️ [Auth] Failed to delete session: %v", err)
	}

	// Clear cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "session_token",
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		MaxAge:   -1,
	})

	log.Printf("👋 [Auth] User logged out from %s", getClientIP(r))

	writeJSON(w, http.StatusOK, models.AuthResponse{
		Error:   false,
		Message: "Logged out successfully",
	})
}

// logUserActivity logs user activity to database
func (h *AuthHandler) logUserActivity(ctx context.Context, userID int, action string, r *http.Request) {
	log := &models.ActivityLog{
		UserID:    userID,
		Action:    action,
		IPAddress: getClientIP(r),
		UserAgent: r.UserAgent(),
	}

	if err := h.userRepo.LogActivity(ctx, log); err != nil {
		// Log but don't fail the request
		fmt.Printf("⚠️ Failed to log activity: %v\n", err)
	}
}

// NotificationsHandler fetches GitHub notifications for the authenticated user
func (h *AuthHandler) NotificationsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]interface{}{
			"error":   true,
			"message": "Method not allowed",
		})
		return
	}

	user, ok := r.Context().Value("user").(*models.User)
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]interface{}{
			"error":   true,
			"message": "Unauthorized",
		})
		return
	}

	// Get the user's access token
	ctx := r.Context()
	// Get user with access token
	userWithToken, err := h.authService.GetUserWithToken(ctx, user.ID)
	if err != nil || userWithToken == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]interface{}{
			"error":   true,
			"message": "Unable to retrieve access token",
		})
		return
	}

	// Fetch notifications from GitHub API
	notifications, err := h.fetchGitHubNotifications(userWithToken.AccessToken)
	if err != nil {
		log.Printf("❌ [Notifications] Failed to fetch for user %s: %v", user.Username, err)
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{
			"error":   true,
			"message": "Failed to fetch notifications",
		})
		return
	}

	// Count unread notifications
	unreadCount := 0
	for _, n := range notifications {
		if n.Unread {
			unreadCount++
		}
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"error":         false,
		"notifications": notifications,
		"unread_count":  unreadCount,
	})
}

// GitHubNotification represents a GitHub notification
type GitHubNotification struct {
	ID        string `json:"id"`
	Unread    bool   `json:"unread"`
	Reason    string `json:"reason"`
	UpdatedAt string `json:"updated_at"`
	Subject   struct {
		Title string `json:"title"`
		URL   string `json:"url"`
		Type  string `json:"type"`
	} `json:"subject"`
	Repository struct {
		FullName string `json:"full_name"`
		HTMLURL  string `json:"html_url"`
	} `json:"repository"`
}

// fetchGitHubNotifications fetches notifications from GitHub API
func (h *AuthHandler) fetchGitHubNotifications(accessToken string) ([]GitHubNotification, error) {
	req, err := http.NewRequest("GET", "https://api.github.com/notifications?per_page=50", nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Accept", "application/vnd.github.v3+json")
	req.Header.Set("User-Agent", "DevScope-App")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("GitHub API returned status %d", resp.StatusCode)
	}

	var notifications []GitHubNotification
	if err := json.NewDecoder(resp.Body).Decode(&notifications); err != nil {
		return nil, err
	}

	return notifications, nil
}

// MarkNotificationReadHandler marks a notification as read
func (h *AuthHandler) MarkNotificationReadHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]interface{}{
			"error":   true,
			"message": "Method not allowed",
		})
		return
	}

	user, ok := r.Context().Value("user").(*models.User)
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]interface{}{
			"error":   true,
			"message": "Unauthorized",
		})
		return
	}

	// Extract notification ID from path
	path := r.URL.Path
	// Path format: /api/notifications/{id}/read
	parts := strings.Split(strings.Trim(path, "/"), "/")
	if len(parts) < 3 {
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{
			"error":   true,
			"message": "Invalid notification ID",
		})
		return
	}
	notificationID := parts[2]

	ctx := r.Context()
	// Get user with access token
	userWithToken, err := h.authService.GetUserWithToken(ctx, user.ID)
	if err != nil || userWithToken == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]interface{}{
			"error":   true,
			"message": "Unable to retrieve access token",
		})
		return
	}

	// Mark notification as read on GitHub
	req, err := http.NewRequest("PATCH", fmt.Sprintf("https://api.github.com/notifications/threads/%s", notificationID), nil)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{
			"error":   true,
			"message": "Failed to create request",
		})
		return
	}

	req.Header.Set("Authorization", "Bearer "+userWithToken.AccessToken)
	req.Header.Set("Accept", "application/vnd.github.v3+json")
	req.Header.Set("User-Agent", "DevScope-App")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{
			"error":   true,
			"message": "Failed to mark notification as read",
		})
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusResetContent && resp.StatusCode != http.StatusOK {
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{
			"error":   true,
			"message": fmt.Sprintf("GitHub API returned status %d", resp.StatusCode),
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"error":   false,
		"message": "Notification marked as read",
	})
}

// isProduction checks if running in production environment
func (h *AuthHandler) isProduction() bool {
	env := os.Getenv("ENVIRONMENT")
	return env == "production" || env == "prod"
}

// getSameSiteMode returns appropriate SameSite mode based on environment
func getSameSiteMode(isProduction bool) http.SameSite {
	if isProduction {
		// In production with cross-origin setup, use None with Secure
		return http.SameSiteNoneMode
	}
	// In development, use Lax
	return http.SameSiteLaxMode
}
