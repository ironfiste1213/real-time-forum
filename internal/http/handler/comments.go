package handler

import (
	"encoding/json"
	"log"
	"net/http"
	"real-time-forum/internal/auth"
	"real-time-forum/internal/models"
	"real-time-forum/internal/repo"
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
	log.Printf("CreateCommentHandler: Authenticated user ID: %d, Nickname: %s", user.ID, user.Nickname)
	var req models.CreateCommentRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		log.Printf("CreateCommentHandler: Error decoding request body: %v", err)
		RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}
	log.Printf("CreateCommentHandler: Parsed comment data: PostID=%d, Content='%s'", req.PostID, req.Content)
	comment := &models.Comment{
		PostID:  req.PostID,
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
