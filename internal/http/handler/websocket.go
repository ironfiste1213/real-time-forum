package handler

import (
	"log"
	"net/http"

	"real-time-forum/internal/auth"
	"real-time-forum/internal/models"
	"real-time-forum/internal/repo"
	"real-time-forum/internal/ws"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		// Allow connections from any origin in development
		// In production, you should check the origin
		return true
	},
}

// Global hub instance
var hub *ws.Hub

// InitWebSocket initializes the WebSocket hub
func InitWebSocket() {
	hub = ws.NewHub()

	// Inject the message repository function to avoid circular imports
	ws.SetMessageRepo(func(userID1, userID2, limit, offset int) ([]models.PrivateMessage, error) {
		return repo.GetPrivateMessagesBetweenUsers(userID1, userID2, limit, offset)
	})

	go hub.Run()
	log.Println("WebSocket hub initialized")
}

// WebSocketHandler handles WebSocket connections
func WebSocketHandler(w http.ResponseWriter, r *http.Request) {
	// Flow: WebSocket connection attempt
	log.Printf("[websocket.go:WebSocketHandler] Connection attempt from %s", r.RemoteAddr)

	// Validate session token from cookie
	sessionToken, err := r.Cookie("session_token")
	if err != nil {
		log.Printf("[websocket.go:WebSocketHandler] Missing session token")
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Get user from session
	user, err := auth.GetUserBySessionToken(sessionToken.Value)
	if err != nil || user == nil {
		log.Printf("[websocket.go:WebSocketHandler] Invalid session token")
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	userID := user.ID
	nickname := user.Nickname

	// Flow: Upgrading connection
	log.Printf("[websocket.go:WebSocketHandler] Upgrading connection for user %d (%s)", userID, nickname)

	// Upgrade HTTP connection to WebSocket
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("[websocket.go:WebSocketHandler] Failed to upgrade connection: %v", err)
		return
	}

	// Create new client and register with hub
	client := ws.NewClient(hub, conn, userID, nickname)
	hub.Register <- client

	// Start client goroutines
	client.Start()

	// Flow: WebSocket connection established
	log.Printf("[websocket.go:WebSocketHandler] Connection established for user %d (%s)", userID, nickname)
}

// GetHub returns the global hub instance
func GetHub() *ws.Hub {
	return hub
}
