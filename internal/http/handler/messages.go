package handler

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"time"

	"real-time-forum/internal/auth"
	"real-time-forum/internal/models"
	"real-time-forum/internal/repo"
)

// SendPrivateMessageHandler handles sending private messages
func SendPrivateMessageHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		RespondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	user, ok := auth.GetUserFromContext(r.Context())
	if !ok {
		RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var req struct {
		ReceiverID int    `json:"receiver_id"`
		Content    string `json:"content"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Content == "" || req.ReceiverID == 0 {
		RespondWithError(w, http.StatusBadRequest, "Missing required fields")
		return
	}

	// Check if receiver exists
	_, err := repo.GetUserByID(req.ReceiverID)
	if err != nil {
		RespondWithError(w, http.StatusNotFound, "Receiver not found")
		return
	}

	message := &models.PrivateMessage{
		SenderID:   user.ID,
		ReceiverID: req.ReceiverID,
		Content:    req.Content,
		CreatedAt:  time.Now(),
		IsRead:     false,
	}

	err = repo.CreatePrivateMessage(message)
	if err != nil {
		log.Printf("[messages.go:SendPrivateMessageHandler] Error creating private message: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Failed to send message")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Message sent successfully",
	})
}

// GetPrivateMessagesHandler retrieves private messages between two users
func GetPrivateMessagesHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		RespondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	user, ok := auth.GetUserFromContext(r.Context())
	if !ok {
		RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	otherUserIDStr := r.URL.Query().Get("user_id")
	if otherUserIDStr == "" {
		RespondWithError(w, http.StatusBadRequest, "Missing user_id parameter")
		return
	}

	otherUserID, err := strconv.Atoi(otherUserIDStr)
	if err != nil {
		RespondWithError(w, http.StatusBadRequest, "Invalid user_id parameter")
		return
	}

	limitStr := r.URL.Query().Get("limit")
	limit := 10 // default strict limit
	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
			if l > 10 {
				limit = 10 // strict cap
			} else {
				limit = l
			}
		}
	}

	offsetStr := r.URL.Query().Get("offset")
	offset := 0 // default
	if offsetStr != "" {
		if o, err := strconv.Atoi(offsetStr); err == nil && o >= 0 {
			offset = o
		}
	}

	messages, err := repo.GetPrivateMessagesBetweenUsers(user.ID, otherUserID, limit, offset)
	if err != nil {
		// Flow: Failed to retrieve messages
		log.Printf("[messages.go:GetPrivateMessagesHandler] Failed to get messages: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Failed to retrieve messages")
		return
	}
	// Flow: Retrieved messages successfully
	log.Printf("Messages: Retrieved %d messages for user %d", len(messages), user.ID)

	// Mark messages as read
	err = repo.MarkMessagesAsRead(otherUserID, user.ID)
	if err != nil {
		log.Printf("[messages.go:GetPrivateMessagesHandler] Failed to mark messages as read: %v", err)
		// Don't fail the request for this
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
	w.Header().Set("Pragma", "no-cache")
	w.Header().Set("Expires", "0")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"messages": messages,
	})
}

// GetConversationsHandler retrieves recent conversations for the user
func GetConversationsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		RespondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	user, ok := auth.GetUserFromContext(r.Context())
	if !ok {
		RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	limitStr := r.URL.Query().Get("limit")
	limit := 20 // default
	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 50 {
			limit = l
		}
	}

	conversations, err := repo.GetRecentConversations(user.ID, limit)
	if err != nil {
		log.Printf("[messages.go:GetConversationsHandler] Error getting conversations: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Failed to retrieve conversations")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"conversations": conversations,
	})
}

// GetUnreadCountHandler returns the count of unread messages for the user
func GetUnreadCountHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		RespondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	user, ok := auth.GetUserFromContext(r.Context())
	if !ok {
		RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	count, err := repo.GetUnreadMessageCount(user.ID)
	if err != nil {
		log.Printf("Error getting unread count: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Failed to get unread count")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"unread_count": count,
	})
}
