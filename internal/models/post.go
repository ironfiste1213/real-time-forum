package models

import "time"

// Post represents a forum post.
type Post struct {
	ID        int       `json:"id"`
	UserID    int       `json:"userId"`
	Title     string    `json:"title"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// Category represents a post category.
type Category struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
}

// PostCategory is the junction table for the many-to-many relationship
// between posts and categories.
type PostCategory struct {
	PostID     int
	CategoryID int
}
