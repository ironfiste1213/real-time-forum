package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"real-time-forum/internal/repo"
	"time"
)

// GetAllUsersHandler handles GET /api/users requests
func GetAllUsersHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Println("[DEBUG:GetAllUsersHandler] Starting GetAllUsersHandler")
	if r.Method != http.MethodGet {
		fmt.Println("[DEBUG:GetAllUsersHandler] Method not allowed")
		RespondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	fmt.Println("[DEBUG:GetAllUsersHandler] Calling repo.GetAllUsers()")
	users, err := repo.GetAllUsers()
	if err != nil {
		fmt.Printf("[DEBUG:GetAllUsersHandler] Error from repo.GetAllUsers(): %v\n", err)
		RespondWithError(w, http.StatusInternalServerError, "Failed to retrieve users")
		return
	}
	fmt.Printf("[DEBUG:GetAllUsersHandler] Got %d users from repo\n", len(users))

	// Get online users from hub
	fmt.Println("[DEBUG:GetAllUsersHandler] Getting online users from hub")
	hub := GetHub()
	onlineUsers := make(map[int]bool)
	if hub != nil {
		// Use a timeout to prevent deadlock
		done := make(chan bool, 1)
		go func() {
			hub.Mu.RLock()
			for userID := range hub.Users {
				onlineUsers[userID] = true
			}
			hub.Mu.RUnlock()
			done <- true
		}()

		select {
		case <-done:
			fmt.Printf("[DEBUG:GetAllUsersHandler] Found %d online users\n", len(onlineUsers))
		case <-time.After(5 * time.Second):
			fmt.Println("[DEBUG:GetAllUsersHandler] Timeout getting online users from hub - proceeding without online status")
			onlineUsers = make(map[int]bool) // Reset to empty
		}
	} else {
		fmt.Println("[DEBUG:GetAllUsersHandler] Hub is nil")
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
	fmt.Printf("[DEBUG:GetAllUsersHandler] Created response with %d users\n", len(response))
	fmt.Println("[DEBUG:GetAllUsersHandler] Setting Content-Type header")
	w.Header().Set("Content-Type", "application/json")
	fmt.Println("[DEBUG:GetAllUsersHandler] Encoding JSON response")
	err = json.NewEncoder(w).Encode(response)
	if err != nil {
		fmt.Printf("[DEBUG:GetAllUsersHandler] Error encoding JSON: %v\n", err)
	} else {
		fmt.Println("[DEBUG:GetAllUsersHandler] JSON encoding completed successfully")
	}
}
