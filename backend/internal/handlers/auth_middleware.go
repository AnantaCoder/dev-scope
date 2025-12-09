// Package handlers provides authentication middleware
package handlers

import (
	"context"
	"net/http"

	"github-api/backend/internal/auth"
	"github-api/backend/internal/models"
)

// AuthMiddleware validates session and adds user to context
type AuthMiddleware struct {
	authService *auth.AuthService
}

// NewAuthMiddleware creates a new auth middleware
func NewAuthMiddleware(authService *auth.AuthService) *AuthMiddleware {
	return &AuthMiddleware{authService: authService}
}

// RequireAuth middleware that requires authentication
func (m *AuthMiddleware) RequireAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Get session from cookie
		cookie, err := r.Cookie("session_token")
		if err != nil {
			writeJSON(w, http.StatusUnauthorized, models.AuthResponse{
				Error:   true,
				Message: "Unauthorized - No session token",
			})
			return
		}

		// Validate session
		user, err := m.authService.ValidateSession(r.Context(), cookie.Value)
		if err != nil {
			writeJSON(w, http.StatusUnauthorized, models.AuthResponse{
				Error:   true,
				Message: "Unauthorized - Invalid session",
			})
			return
		}

		// Add user to context
		ctx := context.WithValue(r.Context(), "user", user)
		next.ServeHTTP(w, r.WithContext(ctx))
	}
}

// OptionalAuth middleware that optionally validates authentication
func (m *AuthMiddleware) OptionalAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Try to get session from cookie
		cookie, err := r.Cookie("session_token")
		if err == nil {
			// Validate session
			user, err := m.authService.ValidateSession(r.Context(), cookie.Value)
			if err == nil && user != nil {
				// Add user to context
				ctx := context.WithValue(r.Context(), "user", user)
				r = r.WithContext(ctx)
			}
		}

		next.ServeHTTP(w, r)
	}
}

// GetUserFromContext retrieves user from request context
func GetUserFromContext(ctx context.Context) (*models.User, bool) {
	user, ok := ctx.Value("user").(*models.User)
	return user, ok
}
