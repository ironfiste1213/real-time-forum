package handler

import (
	"encoding/json"
	"net/http"
	"real-time-forum/internal/auth"
	"real-time-forum/internal/models"
	"real-time-forum/internal/repo"
)

// CreatePostHandler handles the creation of a new post.
// It requires authentication via the AuthMiddleware.
func CreatePostHandler(w http.ResponseWriter, r *http.Request) {
	// 1. Check if the request method is POST
	if r.Method != http.MethodPost {
		RespondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	// 2. Ensure the user is authenticated
	user, ok := auth.GetUserFromContext(r.Context())
	if !ok || user == nil {
		RespondWithError(w, http.StatusUnauthorized, "Authentication required")
		return
	}

	// 3. Parse the JSON request body
	var req models.CreatePostRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	// 4. Create a new post model
	post := &models.Post{
		UserID:  user.ID,
		Title:   req.Title,
		Content: req.Content,
	}

	// 5. Save the post to the database
	postID, err := repo.CreatePost(post, req.CategoryIDs)
	if err != nil {
		RespondWithError(w, http.StatusInternalServerError, "Failed to create post")
		return
	}

	// 6. Send a success response
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Post created successfully!",
		"post_id": postID,
	})
}

// GetAllPostsHandler retrieves all posts for the main feed.
func GetAllPostsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		RespondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	posts, err := repo.GetAllPosts()
	if err != nil {
		RespondWithError(w, http.StatusInternalServerError, "Failed to retrieve posts")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(posts)
}
