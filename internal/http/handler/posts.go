package handler

import (
	"encoding/json"
	"log"
	"net/http"
	"real-time-forum/internal/auth"
	"real-time-forum/internal/models"
	"real-time-forum/internal/repo"
	"strconv"
	"strings"
)

// CreatePostHandler handles the creation of a new post.
// It requires authentication via the AuthMiddleware.
func CreatePostHandler(w http.ResponseWriter, r *http.Request) {
	log.Println("CreatePostHandler: Received request")

	// 2. Ensure the user is authenticated
	user, ok := auth.GetUserFromContext(r.Context())
	if !ok || user == nil {
		RespondWithError(w, http.StatusUnauthorized, "Authentication required")
		return
	}

	log.Printf("CreatePostHandler: Authenticated user ID: %d, Nickname: %s", user.ID, user.Nickname)

	// 3. Parse the JSON request body
	var req models.CreatePostRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		log.Printf("CreatePostHandler: Error decoding request body: %v", err)
		RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	// 4. Create a new post model
	post := &models.Post{
		UserID:  user.ID,
		Title:   req.Title,
		Content: req.Content,
	}

	// --- DEBUG: Log the parsed data ---
	log.Printf("CreatePostHandler: Parsed post data: Title='%s', Content='%s', CategoryIDs=%v", post.Title, post.Content, req.CategoryIDs)

	// 5. Save the post to the database
	postID, err := repo.CreatePost(post, req.CategoryIDs)
	if err != nil {
		log.Printf("CreatePostHandler: Error calling repo.CreatePost: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Failed to create post")
		return
	}

	log.Printf("CreatePostHandler: Successfully created post with ID: %d", postID)
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
	posts, err := repo.GetAllPosts()
	if err != nil {
		RespondWithError(w, http.StatusInternalServerError, "Failed to retrieve posts")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(posts)
}

// GetPostByIDHandler retrieves a single post by its ID.
func GetPostByIDHandler(w http.ResponseWriter, r *http.Request) {
	// Extract post ID from URL path, e.g., /api/posts/123
	log.Println("GetPostByIDHandler: Received request")
	idStr := strings.TrimPrefix(r.URL.Path, "/api/posts/") // e.g., "123" or "123/"
	idStr = strings.TrimSuffix(idStr, "/")                 // Remove trailing slash if it exists
	id, err := strconv.Atoi(idStr)
	if err != nil {
		log.Printf("GetPostByIDHandler: Invalid post ID format: %s", idStr)
		RespondWithError(w, http.StatusBadRequest, "Invalid post ID")
		return
	}
	postID := int64(id) // Convert int to int64 for the repository function

	log.Printf("GetPostByIDHandler: Fetching post with ID: %d", postID)

	post, err := repo.GetPostByID(postID)
	if err != nil {
		// The repo layer will log the specific DB error. This log is for the handler context.
		log.Printf("GetPostByIDHandler: repo.GetPostByID failed for ID %d: %v", postID, err)
		RespondWithError(w, http.StatusInternalServerError, "Failed to retrieve post")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	log.Printf("GetPostByIDHandler: Successfully retrieved and sent post ID: %d", postID)
	json.NewEncoder(w).Encode(post)
}
