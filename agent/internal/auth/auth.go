package auth

import (
	"net/http"
	"strings"
)

// Authenticator handles authentication for the agent
type Authenticator struct {
	token string
}

// NewAuthenticator creates a new authenticator with the given token
func NewAuthenticator(token string) *Authenticator {
	return &Authenticator{
		token: token,
	}
}

// Middleware returns an HTTP middleware that validates Bearer tokens
func (a *Authenticator) Middleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// If no token is configured, skip authentication
		if a.token == "" {
			next(w, r)
			return
		}

		// Get Authorization header
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Unauthorized: Missing Authorization header", http.StatusUnauthorized)
			return
		}

		// Check for Bearer token format
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			http.Error(w, "Unauthorized: Invalid Authorization format", http.StatusUnauthorized)
			return
		}

		// Validate token
		token := parts[1]
		if token != a.token {
			http.Error(w, "Unauthorized: Invalid token", http.StatusUnauthorized)
			return
		}

		// Token is valid, proceed to next handler
		next(w, r)
	}
}

// ValidateToken checks if the provided token matches the configured token
func (a *Authenticator) ValidateToken(token string) bool {
	// If no token is configured, allow all requests
	if a.token == "" {
		return true
	}
	return token == a.token
}

// IsEnabled returns true if authentication is enabled
func (a *Authenticator) IsEnabled() bool {
	return a.token != ""
}