package main

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
	LastLogin    time.Time `json:"lastLogin"`
	IsOnline     bool      `json:"isOnline"`
}

// Session represents a user session in the database.
type Session struct {
	ID           int
	UserID       int
	SessionToken string
	CreatedAt    time.Time
	ExpiresAt    time.Time
}

// Category represents a post category.
type Category struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
}

// Post represents a forum post.
type Post struct {
	ID        int       `json:"id"`
	UserID    int       `json:"userId"`
	Title     string    `json:"title"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// PostCategory is the junction table for the many-to-many relationship
// between posts and categories.
type PostCategory struct {
	PostID     int
	CategoryID int
}

// Comment represents a comment on a post.
type Comment struct {
	ID        int       `json:"id"`
	PostID    int       `json:"postId"`
	UserID    int       `json:"userId"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"createdAt"`
}

// Like represents a like or dislike on a post or comment.
type Like struct {
	ID        int
	UserID    int
	PostID    *int // Pointer to allow NULL
	CommentID *int // Pointer to allow NULL
	Type      int  // 1 for like, -1 for dislike
	CreatedAt time.Time
}

// PrivateMessage represents a chat message between two users.
type PrivateMessage struct {
	ID         int       `json:"id"`
	SenderID   int       `json:"senderId"`
	ReceiverID int       `json:"receiverId"`
	Content    string    `json:"content"`
	CreatedAt  time.Time `json:"createdAt"`
	IsRead     bool      `json:"isRead"`
}
