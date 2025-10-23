package auth

import (
	"context"
	"real-time-forum/internal/models"
)

// GetUserFromContext is a helper function to retrieve the authenticated user from the request context.
func GetUserFromContext(ctx context.Context) (*models.User, bool) {
	user, ok := ctx.Value(models.UserContextKey).(*models.User)
	return user, ok
}
