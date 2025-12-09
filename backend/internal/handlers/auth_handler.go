// Package handlers provides authentication HTTP handlers
package handlers

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"time"

	"github-api/backend/internal/auth"
	"github-api/backend/internal/models"
	"github-api/backend/internal/repository"
)

// AuthHandler handles authentication routes
type AuthHandler struct {
	authService *auth.AuthService
	userRepo    *repository.UserRepository
	frontendURL string
	stateTTL    map[string]time.Time
}

// NewAuthHandler creates a new auth handler
func NewAuthHandler(authService *auth.AuthService, userRepo *repository.UserRepository, frontendURL string) *AuthHandler {
	handler := &AuthHandler{
		authService: authService,
		userRepo:    userRepo,
		frontendURL: frontendURL,
		stateTTL:    make(map[string]time.Time),
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

	// Set session cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "session_token",
		Value:    session.ID,
		Path:     "/",
		HttpOnly: true,
		Secure:   false, // Set to true in production with HTTPS
		SameSite: http.SameSiteLaxMode,
		MaxAge:   30 * 24 * 60 * 60, // 30 days
	})

	// Redirect to frontend
	http.Redirect(w, r, fmt.Sprintf("%s?login=success", h.frontendURL), http.StatusTemporaryRedirect)
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
