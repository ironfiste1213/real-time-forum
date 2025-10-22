package http

import (
	"context"
	"log"
	"net/http"
	"real-time-forum/internal/auth"
	"real-time-forum/internal/http/handler"
	"real-time-forum/internal/models"
	"real-time-forum/internal/repo"
	"time"
)

// ContextKey is a custom type for context keys to avoid collisions.
type ContextKey string

const (
	// UserContextKey is the key used to store the authenticated user in the request context.
	UserContextKey ContextKey = "authenticatedUser"
)

// AuthMiddleware is an HTTP middleware that validates session cookies and authenticates users.
// If a valid session is found, the authenticated user is added to the request context.
// Otherwise, it responds with a 401 Unauthorized status.
func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// 1. Get the session cookie
		cookie, err := r.Cookie("session_token")
		if err != nil {
			if err == http.ErrNoCookie {
				// No session cookie, user is not authenticated for this request
				handler.RespondWithError(w, http.StatusUnauthorized, "Authentication required: No session cookie")
				return
			}
			// Other cookie-related errors
			log.Printf("AuthMiddleware: Error getting cookie: %v", err)
			handler.RespondWithError(w, http.StatusBadRequest, "Bad request")
			return
		}

		sessionToken := cookie.Value

		// 2. Validate the session token against the database
		session, err := auth.GetSessionByToken(sessionToken)
		if err != nil {
			// This covers cases where the session is not found or other DB errors
			log.Printf("AuthMiddleware: Error retrieving session: %v", err)
			auth.ClearSessionCookie(w) // Clear potentially invalid cookie
			handler.RespondWithError(w, http.StatusInternalServerError, "Internal server error")
			return
		}
		if session == nil {
			// Session token not found in DB
			log.Printf("AuthMiddleware: Session token not found in database: %s", sessionToken)
			auth.ClearSessionCookie(w)
			handler.RespondWithError(w, http.StatusUnauthorized, "Invalid session")
			return
		}

		// Check if the session has expired
		if session.Expiry.Before(time.Now()) {
			log.Printf("AuthMiddleware: Session expired for user ID: %d, token: %s", session.UserID, sessionToken)
			_ = auth.DeleteSession(sessionToken) // Clean up expired session from DB
			auth.ClearSessionCookie(w)
			handler.RespondWithError(w, http.StatusUnauthorized, "Session expired")
			return
		}

		// 3. Retrieve the user associated with the session
		user, err := repo.GetUserByID(session.UserID)
		if err != nil {
			log.Printf("AuthMiddleware: Error retrieving user for session %s (UserID: %d): %v", sessionToken, session.UserID, err)
			auth.ClearSessionCookie(w)
			handler.RespondWithError(w, http.StatusInternalServerError, "Internal server error")
			return
		}
		if user == nil {
			// User associated with session not found (e.g., user deleted but session remains)
			log.Printf("AuthMiddleware: User (ID: %d) not found for session %s", session.UserID, sessionToken)
			_ = auth.DeleteSession(sessionToken) // Invalidate the session as it points to a non-existent user, and clear the client cookie
			auth.ClearSessionCookie(w)
			handler.RespondWithError(w, http.StatusUnauthorized, "User not found for session")
			return
		}

		// 4. Add the user to the request context
		ctx := context.WithValue(r.Context(), UserContextKey, user)
		r = r.WithContext(ctx)

		// 5. Call the next handler in the chain
		next.ServeHTTP(w, r)
	})
}

// GetUserFromContext is a helper function to retrieve the authenticated user from the request context.
func GetUserFromContext(ctx context.Context) (*models.User, bool) {
	user, ok := ctx.Value(UserContextKey).(*models.User)
	return user, ok
}