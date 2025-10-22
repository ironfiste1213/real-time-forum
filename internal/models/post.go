package models

import (
	"time"
)

// Post represents a forum post.
type Post struct {
	ID         int       `json:"id"`
	UserID     int       `json:"userId"`
	Title      string    `json:"title"`
	Content    string    `json:"content"`
	CreatedAt  time.Time `json:"createdAt"`
	Author     *User     `json:"author"`     // To hold author's details like nickname
	Categories []string  `json:"categories"` // To hold the names of the categories
}

// Category represents a post category.
type Category struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

// PostCategory is the junction table for the many-to-many relationship
// between posts and categories.
type PostCategory struct {
	PostID     int
	CategoryID int
}

// CreatePostRequest defines the expected structure for a new post request.
type CreatePostRequest struct {
	Title       string `json:"title"`
	Content     string `json:"content"`
	CategoryIDs []int  `json:"category_ids"`
}
