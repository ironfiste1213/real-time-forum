package handler

import (
	"encoding/json"
	"net/http"
	"real-time-forum/internal/repo"
)

// GetAllUsersHandler handles GET /api/users requests
func GetAllUsersHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		RespondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	users, err := repo.GetAllUsers()
	if err != nil {
		RespondWithError(w, http.StatusInternalServerError, "Failed to retrieve users")
		return
	}

	// Get online users from hub
	hub := GetHub()
	onlineUsers := make(map[int]bool)
	if hub != nil {
		hub.Mu.RLock()
		for userID := range hub.Users {
			onlineUsers[userID] = true
		}
		hub.Mu.RUnlock()
	}

	// Create response with online/offline status
	type UserResponse struct {
		ID       int    `json:"id"`
		Nickname string `json:"nickname"`
		IsOnline bool   `json:"is_online"`
	}

	var response []UserResponse
	for _, user := range users {
		response = append(response, UserResponse{
			ID:       user.ID,
			Nickname: user.Nickname,
			IsOnline: onlineUsers[user.ID],
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
