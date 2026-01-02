package http

import (
	"context"
	"net/http"
	"strconv"
	"sync"
	"time"

	"real-time-forum/internal/auth"
	"real-time-forum/internal/http/handler"
	"real-time-forum/internal/models" // Import models for UserContextKey
	"real-time-forum/internal/repo"
)

// Rate limiting configuration
const (
	RateLimitRequests = 10 // Maximum requests per time window
	RateLimitWindow   = 60 // Time window in seconds (1 minute)
)

// RateLimitInfo stores rate limit information for a user
type RateLimitInfo struct {
	Count     int
	ResetTime time.Time
}

// RateLimiter is a thread-safe rate limiter
type RateLimiter struct {
	mu       sync.Mutex
	requests map[string]*RateLimitInfo
	window   time.Duration
	limit    int
}

// NewRateLimiter creates a new rate limiter
func NewRateLimiter(limit int, window time.Duration) *RateLimiter {
	return &RateLimiter{
		requests: make(map[string]*RateLimitInfo),
		window:   window,
		limit:    limit,
	}
}

// Allow checks if a request is allowed and updates the count
func (rl *RateLimiter) Allow(key string) (bool, int) {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()

	info, exists := rl.requests[key]
	if !exists || now.After(info.ResetTime) {
		// First request or window expired
		rl.requests[key] = &RateLimitInfo{
			Count:     1,
			ResetTime: now.Add(rl.window),
		}
		return true, rl.limit - 1
	}

	if info.Count >= rl.limit {
		return false, 0
	}

	info.Count++
	return true, rl.limit - info.Count
}

// GetRemaining returns remaining requests for a key
func (rl *RateLimiter) GetRemaining(key string) int {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	info, exists := rl.requests[key]
	if !exists || now.After(info.ResetTime) {
		return rl.limit
	}

	return rl.limit - info.Count
}

// Global rate limiter instance
var (
	postRateLimiter    = NewRateLimiter(RateLimitRequests, time.Duration(RateLimitWindow)*time.Second)
	commentRateLimiter = NewRateLimiter(RateLimitRequests*2, time.Duration(RateLimitWindow)*time.Second) // Allow more comments than posts
)

// RateLimitMiddleware creates a rate limiting middleware for specific endpoints
func RateLimitMiddleware(next http.Handler, limiter *RateLimiter, endpoint string) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Get user from context (set by AuthMiddleware)
		user, ok := auth.GetUserFromContext(r.Context())
		if !ok || user == nil {
			// If no user, use IP address
			clientIP := r.RemoteAddr
			//X-Forwarded-For is a header added by proxies to forward the original client IP
			if forwarded := r.Header.Get("X-Forwarded-For"); forwarded != "" {
				clientIP = forwarded
			}
			key := clientIP + ":" + endpoint

			allowed, remaining := limiter.Allow(key)
			if !allowed {
				w.Header().Set("Retry-After", strconv.Itoa(RateLimitWindow))
				handler.RespondWithError(w, http.StatusTooManyRequests, "Rate limit exceeded. Please try again later.")
				return
			}

			w.Header().Set("X-RateLimit-Remaining", strconv.Itoa(remaining))
			next.ServeHTTP(w, r)
			return
		}

		// Use user ID for authenticated requests
		key := strconv.Itoa(user.ID) + ":" + endpoint
		allowed, remaining := limiter.Allow(key)

		if !allowed {
			w.Header().Set("Retry-After", strconv.Itoa(RateLimitWindow))
			handler.RespondWithError(w, http.StatusTooManyRequests, "Rate limit exceeded. Please try again later.")
			return
		}

		w.Header().Set("X-RateLimit-Remaining", strconv.Itoa(remaining))
		next.ServeHTTP(w, r)
	})
}

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
			// log.Printf("[middleware.go:AuthMiddleware] AuthMiddleware: Error getting cookie: %v", err)
			handler.RespondWithError(w, http.StatusBadRequest, "Bad request")
			return
		}

		sessionToken := cookie.Value

		// 2. Validate the session token against the database
		session, err := auth.GetSessionByToken(sessionToken)
		if err != nil {
			// This covers cases where the session is not found or other DB errors
			// log.Printf("[middleware.go:AuthMiddleware] Error retrieving session: %v", err)
			auth.ClearSessionCookie(w) // Clear potentially invalid cookie
			handler.RespondWithError(w, http.StatusInternalServerError, "Internal server error")
			return
		}
		if session == nil {
			// Session token not found in DB
			// log.Printf("[middleware.go:AuthMiddleware] AuthMiddleware: Session token not found in database: %s", sessionToken)
			auth.ClearSessionCookie(w)
			handler.RespondWithError(w, http.StatusUnauthorized, "Invalid session")
			return
		}

		// Check if the session has expired
		if session.Expiry.Before(time.Now()) {
			// log.Printf("[middleware.go:AuthMiddleware] Session expired for user ID: %d, token: %s", session.UserID, sessionToken)
			_ = auth.DeleteSession(sessionToken) // Clean up expired session from DB
			auth.ClearSessionCookie(w)
			handler.RespondWithError(w, http.StatusUnauthorized, "Session expired")
			return
		}

		// 3. Retrieve the user associated with the session
		user, err := repo.GetUserByID(session.UserID)
		if err != nil {
			// log.Printf("[middleware.go:AuthMiddleware] AuthMiddleware: Error retrieving user for session %s (UserID: %d): %v", sessionToken, session.UserID, err)
			auth.ClearSessionCookie(w)
			handler.RespondWithError(w, http.StatusInternalServerError, "Internal server error")
			return
		}
		if user == nil {
			// User associated with session not found (e.g., user deleted but session remains)
			// log.Printf("[middleware.go:AuthMiddleware] User (ID: %d) not found for session %s", session.UserID, sessionToken)
			_ = auth.DeleteSession(sessionToken) // Invalidate the session as it points to a non-existent user, and clear the client cookie
			auth.ClearSessionCookie(w)
			handler.RespondWithError(w, http.StatusUnauthorized, "User not found for session")
			return
		}

		// 4. Add the user to the request context
		ctx := context.WithValue(r.Context(), models.UserContextKey, user)
		r = r.WithContext(ctx)

		// log.Printf("[middleware.go:AuthMiddleware] AuthMiddleware: User %s (ID: %d) authenticated successfully. Proceeding to handler.", user.Nickname, user.ID)

		// 5. Call the next handler in the chain
		next.ServeHTTP(w, r)
	})
}
