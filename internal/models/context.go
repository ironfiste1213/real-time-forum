package models

// ContextKey is a custom type for context keys to avoid collisions.
type ContextKey string

const (
	// UserContextKey is the key used to store the authenticated user in the request context.
	UserContextKey ContextKey = "authenticatedUser"
)
