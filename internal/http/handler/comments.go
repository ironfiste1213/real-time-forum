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

func CreateCommentHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		RespondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}
	log.Println("CreateCommentHandler: Received request")

	user, ok := auth.GetUserFromContext(r.Context())
	if !ok || user == nil {
		RespondWithError(w, http.StatusUnauthorized, "Authentication required")
		return
	}
	path := strings.TrimSuffix(r.URL.Path, "/comments")
	path = strings.TrimSuffix(path, "/")
	idStr := strings.TrimPrefix(path, "/api/posts/")
	PostID, err := strconv.Atoi(idStr)
	if err != nil {
		log.Printf("CreateCommentHandler: Invalid post ID format: %s", idStr)
		RespondWithError(w, http.StatusBadRequest, "Invalid post ID")
		return
	}
	log.Printf("CreateCommentHandler: Authenticated user ID: %d, Nickname: %s", user.ID, user.Nickname)
	var req models.CreateCommentRequest
	err = json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		log.Printf("CreateCommentHandler: Error decoding request body: %v", err)
		RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}
	log.Printf("CreateCommentHandler: Parsed comment data: PostID=%d, Content='%s'", PostID, req.Content)
	comment := &models.Comment{
		PostID:  PostID,
		UserID:  user.ID,
		Content: req.Content,
	}

	// Save the comment to the database
	commentID, err := repo.CreateComment(comment)
	if err != nil {
		log.Printf("CreateCommentHandler: Error calling repo.CreateComment: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Failed to create comment")
		return
	}
	log.Printf("CreateCommentHandler: Comment created with ID: %d", commentID)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message":   "Comment created successfully",
		"commentId": commentID,
	})
}

func GetCommentsByPostIDHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		RespondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	// The URL is expected to be like /api/posts/123/comments
	path := strings.TrimSuffix(r.URL.Path, "/comments")
	path = strings.TrimSuffix(path, "/")
	idStr := strings.TrimPrefix(path, "/api/posts/")

	postID, err := strconv.Atoi(idStr)
	if err != nil {
		log.Printf("GetCommentsByPostIDHandler: Invalid post ID format: %s", idStr)
		RespondWithError(w, http.StatusBadRequest, "Invalid post ID")
		return
	}

	// Parse pagination parameters
	pageStr := r.URL.Query().Get("page")
	limitStr := r.URL.Query().Get("limit")

	page := 1
	if pageStr != "" {
		p, err := strconv.Atoi(pageStr)
		if err == nil && p > 0 {
			page = p
		}
	}

	limit := 5
	if limitStr != "" {
		l, err := strconv.Atoi(limitStr)
		if err == nil && l > 0 {
			limit = l
		}
	}

	offset := (page - 1) * limit

	log.Printf("GetCommentsByPostIDHandler: Fetching comments for post ID: %d, Page: %d, Limit: %d", postID, page, limit)

	comments, err := repo.GetCommentsByPostID(postID, limit, offset)
	if err != nil {
		log.Printf("GetCommentsByPostIDHandler: repo.GetCommentsByPostID failed for post ID %d: %v", postID, err)
		RespondWithError(w, http.StatusInternalServerError, "Failed to retrieve comments")
		return
	}

	total, err := repo.CountCommentsByPostID(postID)
	if err != nil {
		log.Printf("GetCommentsByPostIDHandler: repo.CountCommentsByPostID failed for post ID %d: %v", postID, err)
		// Don't fail the request if count fails, just assume unknown total or handle gracefully?
		// For now, let's log and proceed, maybe set total to -1 or len(comments)
		// But returning error is safer.
		RespondWithError(w, http.StatusInternalServerError, "Failed to count comments")
		return
	}

	// Ensure comments is an empty slice instead of nil for JSON serialization
	if comments == nil {
		comments = []*models.Comment{}
	}

	response := map[string]interface{}{
		"comments": comments,
		"total":    total,
		"page":     page,
		"limit":    limit,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}
