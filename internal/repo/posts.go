package repo

import (
	"database/sql"
	"real-time-forum/internal/models"
	"strings"
	"time"
)

// CreatePost inserts a new post and its category associations into the database.
// It uses a transaction to ensure that both the post and its category links are created successfully.
func CreatePost(post *models.Post, categoryIDs []int) (int64, error) {
	tx, err := DB.Begin()
	if err != nil {
		return 0, err
	}

	// 1. Insert the post into the 'posts' table
	stmt, err := tx.Prepare(`
		INSERT INTO posts (user_id, title, content, created_at)
		VALUES (?, ?, ?, ?)
	`)
	if err != nil {
		tx.Rollback()
		return 0, err
	}
	defer stmt.Close()

	res, err := stmt.Exec(post.UserID, post.Title, post.Content, time.Now())
	if err != nil {
		tx.Rollback()
		return 0, err
	}

	postID, err := res.LastInsertId()
	if err != nil {
		tx.Rollback()
		return 0, err
	}

	// 2. Insert the category associations into the 'post_categories' table
	if len(categoryIDs) > 0 {
		stmt, err = tx.Prepare(`
			INSERT INTO post_categories (post_id, category_id) VALUES (?, ?)
		`)
		if err != nil {
			tx.Rollback()
			return 0, err
		}
		defer stmt.Close()

		for _, catID := range categoryIDs {
			_, err := stmt.Exec(postID, catID)
			if err != nil {
				tx.Rollback()
				return 0, err
			}
		}
	}

	// 3. Commit the transaction
	return postID, tx.Commit()
}

// GetAllPosts retrieves all posts from the database for the main feed.
// It also fetches the author's nickname and the associated categories for each post.
func GetAllPosts() ([]*models.Post, error) {
	query := `
		SELECT
			p.id, p.user_id, p.title, p.content, p.created_at,
			u.nickname,
			GROUP_CONCAT(c.name)
		FROM posts p
		JOIN users u ON p.user_id = u.id
		LEFT JOIN post_categories pc ON p.id = pc.post_id
		LEFT JOIN categories c ON pc.category_id = c.id
		GROUP BY p.id
		ORDER BY p.created_at DESC
	`
	rows, err := DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []*models.Post
	for rows.Next() {
		post := &models.Post{Author: &models.User{}}
		var categories sql.NullString // Use sql.NullString to handle posts with no categories

		if err := rows.Scan(
			&post.ID, &post.UserID, &post.Title, &post.Content, &post.CreatedAt,
			&post.Author.Nickname,
			&categories,
		); err != nil {
			return nil, err
		}

		if categories.Valid {
			post.Categories = strings.Split(categories.String, ",")
		} else {
			post.Categories = []string{}
		}

		posts = append(posts, post)
	}

	return posts, rows.Err()
}

// GetAllCategories retrieves all available categories from the database.
func GetAllCategories() ([]*models.Category, error) {
	rows, err := DB.Query("SELECT id, name FROM categories ORDER BY name ASC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var categories []*models.Category
	for rows.Next() {
		category := &models.Category{}
		if err := rows.Scan(&category.ID, &category.Name); err != nil {
			return nil, err
		}
		categories = append(categories, category)
	}
	return categories, rows.Err()
}
