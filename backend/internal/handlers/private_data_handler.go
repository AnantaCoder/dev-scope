// Package handlers provides HTTP handlers for private user data
package handlers

import (
	"context"
	"log"
	"net/http"

	"github-api/backend/internal/models"
	"github-api/backend/internal/service"
)

// PrivateDataHandler handles private data endpoints
type PrivateDataHandler struct {
	privateDataService *service.PrivateDataService
	authService        interface {
		GetUserWithToken(ctx context.Context, userID int) (*models.UserWithToken, error)
	}
}

// NewPrivateDataHandler creates a new private data handler
func NewPrivateDataHandler(
	privateDataService *service.PrivateDataService,
	authService interface {
		GetUserWithToken(ctx context.Context, userID int) (*models.UserWithToken, error)
	},
) *PrivateDataHandler {
	return &PrivateDataHandler{
		privateDataService: privateDataService,
		authService:        authService,
	}
}

// GetMyPrivateDataHandler returns the authenticated user's own private data
// SECURITY: This endpoint ONLY returns the authenticated user's own data
// Users cannot access other users' private data through this endpoint
func (h *PrivateDataHandler) GetMyPrivateDataHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, models.PrivateDataResponse{
			Error:   true,
			Message: "Method not allowed",
		})
		return
	}

	// Get authenticated user from context (set by RequireAuth middleware)
	user, ok := r.Context().Value("user").(*models.User)
	if !ok || user == nil {
		writeJSON(w, http.StatusUnauthorized, models.PrivateDataResponse{
			Error:   true,
			Message: "Unauthorized - You must be logged in to access private data",
		})
		return
	}

	ctx := r.Context()

	// Get user with access token
	userWithToken, err := h.authService.GetUserWithToken(ctx, user.ID)
	if err != nil || userWithToken == nil {
		log.Printf("❌ [PrivateData] Failed to get user token for user %d: %v", user.ID, err)
		writeJSON(w, http.StatusInternalServerError, models.PrivateDataResponse{
			Error:   true,
			Message: "Failed to retrieve authentication data",
		})
		return
	}

	// Fetch private data - ONLY for the authenticated user (user.ID)
	// This ensures users can ONLY access their own private data
	privateData, err := h.privateDataService.GetPrivateData(
		ctx,
		user.ID,                   // The authenticated user's ID
		user.GitHubID,             // The authenticated user's GitHub ID
		userWithToken.AccessToken, // The authenticated user's access token
	)
	if err != nil {
		log.Printf("❌ [PrivateData] Failed to fetch private data for user %d: %v", user.ID, err)
		writeJSON(w, http.StatusInternalServerError, models.PrivateDataResponse{
			Error:   true,
			Message: "Failed to fetch private data from GitHub",
		})
		return
	}

	if privateData == nil {
		writeJSON(w, http.StatusNotFound, models.PrivateDataResponse{
			Error:   true,
			Message: "No private data available",
		})
		return
	}

	log.Printf("✅ [PrivateData] Served private data for user %s (ID: %d)", user.Username, user.ID)

	writeJSON(w, http.StatusOK, models.PrivateDataResponse{
		Error: false,
		Data:  privateData,
	})
}

// RefreshPrivateDataHandler forces a refresh of the authenticated user's private data
func (h *PrivateDataHandler) RefreshPrivateDataHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, models.PrivateDataResponse{
			Error:   true,
			Message: "Method not allowed",
		})
		return
	}

	// Get authenticated user from context
	user, ok := r.Context().Value("user").(*models.User)
	if !ok || user == nil {
		writeJSON(w, http.StatusUnauthorized, models.PrivateDataResponse{
			Error:   true,
			Message: "Unauthorized",
		})
		return
	}

	ctx := r.Context()

	// Get user with access token
	userWithToken, err := h.authService.GetUserWithToken(ctx, user.ID)
	if err != nil || userWithToken == nil {
		log.Printf("❌ [PrivateData] Failed to get user token: %v", err)
		writeJSON(w, http.StatusInternalServerError, models.PrivateDataResponse{
			Error:   true,
			Message: "Failed to retrieve authentication data",
		})
		return
	}

	// Force fetch fresh data from GitHub
	privateData, err := h.privateDataService.FetchAndStorePrivateData(
		ctx,
		user.ID,
		user.GitHubID,
		userWithToken.AccessToken,
	)
	if err != nil {
		log.Printf("❌ [PrivateData] Failed to refresh private data: %v", err)
		writeJSON(w, http.StatusInternalServerError, models.PrivateDataResponse{
			Error:   true,
			Message: "Failed to refresh private data",
		})
		return
	}

	log.Printf("✅ [PrivateData] Refreshed private data for user %s", user.Username)

	writeJSON(w, http.StatusOK, models.PrivateDataResponse{
		Error: false,
		Data:  privateData,
	})
}
