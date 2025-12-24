package repo

import (
	"log"
	"time"

	"real-time-forum/internal/models"
)

// CreateComment inserts a new comment into the database.
func CreateComment(comment *models.Comment) (int64, error) {
	stmt, err := DB.Prepare(`
		INSERT INTO comments (post_id, user_id, content, created_at)
		VALUES (?, ?, ?, ?)
	`)
	if err != nil {
		log.Printf("[comments.go:CreateComment] Error preparing create comment statement: %v", err)
		return 0, err
	}
	defer stmt.Close()

	res, err := stmt.Exec(comment.PostID, comment.UserID, comment.Content, time.Now())
	if err != nil {
		log.Printf("Error executing create comment statement: %v", err)
		return 0, err
	}

	return res.LastInsertId()
}

// GetCommentsByPostID retrieves comments for a given post ID with pagination.
// It also fetches the author's nickname for each comment.
func GetCommentsByPostID(postID, limit, offset int) ([]*models.Comment, error) {
	query := `
		SELECT c.id, c.post_id, c.user_id, c.content, c.created_at, u.nickname
		FROM comments c
		JOIN users u ON c.user_id = u.id
		WHERE c.post_id = ?
		ORDER BY c.created_at ASC
		LIMIT ? OFFSET ?
	`
	rows, err := DB.Query(query, postID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var comments []*models.Comment
	for rows.Next() {
		comment := &models.Comment{Author: &models.User{}}
		if err := rows.Scan(&comment.ID, &comment.PostID, &comment.UserID, &comment.Content, &comment.CreatedAt, &comment.Author.Nickname); err != nil {
			return nil, err
		}
		comments = append(comments, comment)
	}
	return comments, rows.Err()
}

// CountCommentsByPostID returns the total number of comments for a specific post.
func CountCommentsByPostID(postID int) (int, error) {
	query := `SELECT COUNT(*) FROM comments WHERE post_id = ?`
	var count int
	err := DB.QueryRow(query, postID).Scan(&count)
	if err != nil {
		return 0, err
	}
	return count, nil
}
