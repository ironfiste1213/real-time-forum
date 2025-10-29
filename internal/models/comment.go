package models

import "time"

// Comment represents a comment on a post.
type Comment struct {
	ID        int       `json:"id"`
	PostID    int       `json:"postId"`
	UserID    int       `json:"userId"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"createdAt"`
	Author    *User     `json:"author"` // To hold author's details like nickname
}

// CreateCommentRequest defines the expected structure for a new comment request from the client.
type CreateCommentRequest struct {
	Content string `json:"content"`
}
