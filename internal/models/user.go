package models

import "time"

// User represents a user in the database.
type User struct {
	ID           int       `json:"id"`
	Nickname     string    `json:"nickname"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"` // Should not be sent to the client
	FirstName    string    `json:"firstName"`
	LastName     string    `json:"lastName"`
	Age          int       `json:"age"`
	Gender       string    `json:"gender"`
	CreatedAt    time.Time `json:"createdAt"`
}

// Session represents a user session in the database.
type Session struct {
	UserID    int
	Token     string
	Expiry    time.Time
	CreatedAt time.Time
}
