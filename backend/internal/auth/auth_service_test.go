// Package auth_test provides tests for authentication service
package auth

import (
	"context"
	"testing"
	"time"
)

func TestGenerateStateToken(t *testing.T) {
	token1, err := GenerateStateToken()
	if err != nil {
		t.Fatalf("Failed to generate state token: %v", err)
	}

	if token1 == "" {
		t.Error("Generated token is empty")
	}

	// Generate another token to ensure uniqueness
	token2, err := GenerateStateToken()
	if err != nil {
		t.Fatalf("Failed to generate second state token: %v", err)
	}

	if token1 == token2 {
		t.Error("Generated tokens should be unique")
	}

	// Check token length (base64 of 32 bytes should be ~44 chars)
	if len(token1) < 40 {
		t.Errorf("Token too short: %d characters", len(token1))
	}
}

func TestGetAuthorizationURL(t *testing.T) {
	config := GitHubOAuthConfig{
		ClientID:     "test_client_id",
		ClientSecret: "test_secret",
		RedirectURL:  "http://localhost:8080/callback",
		Scopes:       []string{"read:user", "user:email", "repo"},
	}

	authService := &AuthService{config: config}
	state := "test_state_token"

	url := authService.GetAuthorizationURL(state)

	// Check URL contains required parameters
	if url == "" {
		t.Error("Authorization URL is empty")
	}

	// URL should contain client_id, redirect_uri, state, and scope
	expectedParams := []string{
		"client_id=test_client_id",
		"state=test_state_token",
		"scope=read%3Auser+user%3Aemail+repo",
	}

	for _, param := range expectedParams {
		if !contains(url, param) {
			t.Errorf("URL missing expected parameter: %s\nFull URL: %s", param, url)
		}
	}
}

func TestCheckPrivateRepoAccess(t *testing.T) {
	config := GitHubOAuthConfig{
		ClientID:     "test_client_id",
		ClientSecret: "test_secret",
	}

	authService := &AuthService{config: config}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Test with invalid token (should return false, not crash)
	hasAccess := authService.CheckPrivateRepoAccess(ctx, "invalid_token")
	if hasAccess {
		t.Error("Invalid token should not have private repo access")
	}
}

// Helper function to check if string contains substring
func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(s) > len(substr) && findSubstring(s, substr))
}

func findSubstring(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
