package ws

import (
	"encoding/json"
	"log"
	"real-time-forum/internal/models"
	"sync"
	"time"
)

// Hub manages WebSocket connections and routes messages between clients
type Hub struct {
	// Mutex for thread-safe access to users map
	Mu sync.RWMutex

	// Registered clients
	clients map[*Client]bool

	// Inbound channels for hub operations
	Register       chan *Client            // Register requests from clients
	Unregister     chan *Client            // Unregister requests from clients
	Broadcast      chan []byte             // Broadcast messages to all clients
	PrivateMessage chan PrivateMessageData // Private messages between specific users
	LoadHistory    chan *Message           // History loading requests

	// User tracking
	Users map[int]*Client // userID -> client mapping
}

// NewHub creates a new hub instance
func NewHub() *Hub {
	return &Hub{
		clients:        make(map[*Client]bool),
		Register:       make(chan *Client),
		Unregister:     make(chan *Client),
		Broadcast:      make(chan []byte),
		PrivateMessage: make(chan PrivateMessageData),
		LoadHistory:    make(chan *Message),
		Users:          make(map[int]*Client),
	}
}

// Run starts the hub and handles all WebSocket operations
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.registerClient(client)

		case client := <-h.Unregister:
			h.unregisterClient(client)

		case message := <-h.Broadcast:
			h.broadcastMessage(message)

		case privateMsg := <-h.PrivateMessage:
			h.handlePrivateMessage(privateMsg)

		case historyReq := <-h.LoadHistory:
			h.handleLoadHistory(historyReq)
		}
	}
}

// registerClient adds a new client to the hub
func (h *Hub) registerClient(client *Client) {
	log.Printf("[DEBUG] Registering client for user %d (%s)", client.userID, client.nickname)
	h.clients[client] = true
	h.Mu.Lock()
	h.Users[client.userID] = client
	h.Mu.Unlock()

	// Broadcast user online status
	log.Printf("[DEBUG] Broadcasting user online: %d (%s)", client.userID, client.nickname)
	h.broadcastUserOnline(client.userID, client.nickname)

	// Send current online users list to the new client
	log.Printf("[DEBUG] Sending online users list to new client %d", client.userID)
	h.sendOnlineUsersList(client)
}

// unregisterClient removes a client from the hub
func (h *Hub) unregisterClient(client *Client) {
	log.Printf("[DEBUG] Unregistering client for user %d (%s)", client.userID, client.nickname)

	if _, ok := h.clients[client]; ok {
		delete(h.clients, client)
		h.Mu.Lock()
		delete(h.Users, client.userID)
		h.Mu.Unlock()
		close(client.send)

		// Broadcast user offline status
		log.Printf("[DEBUG] Broadcasting user offline: %d (%s)", client.userID, client.nickname)
		h.broadcastUserOffline(client.userID, client.nickname)
	}
}

// broadcastMessage sends a message to all connected clients
func (h *Hub) broadcastMessage(message []byte) {
	log.Printf("[DEBUG] Broadcasting message to %d clients", len(h.clients))
	for client := range h.clients {
		select {
		case client.send <- message:
			log.Printf("[DEBUG] Message sent to user %d", client.userID)
		default:
			// Client channel is full, remove client
			log.Printf("[DEBUG] Client channel full, removing user %d", client.userID)
			close(client.send)
			delete(h.clients, client)
			h.Mu.Lock()
			delete(h.Users, client.userID)
			h.Mu.Unlock()
		}
	}
}

// handlePrivateMessage routes a private message to the target user
func (h *Hub) handlePrivateMessage(data PrivateMessageData) {
	log.Printf("[DEBUG] Handling private message from %d to %d", data.Message.FromUserID, data.Message.ToUserID)
	targetClient, exists := h.Users[data.ToUserID]
	if !exists {
		// Target user is offline, send failure notification back to sender
		log.Printf("[DEBUG] Target user %d is offline, sending failure notification", data.ToUserID)
		h.sendMessageFailed(data.Message.FromUserID, data.Message.ToUserID)
		return
	}

	// Send the message to target user
	log.Printf("[DEBUG] Sending message to target user %d", data.ToUserID)
	select {
	case targetClient.send <- data.Data:
		// Message sent successfully, notify sender
		log.Printf("[DEBUG] Message delivered, notifying sender %d", data.Message.FromUserID)
		h.sendMessageDelivered(data.Message.FromUserID, data.Message.MessageID)
	default:
		// Target client channel is full
		log.Printf("[DEBUG] Target client channel full, sending failure notification")
		h.sendMessageFailed(data.Message.FromUserID, data.Message.ToUserID)
	}
}

// broadcastUserOnline notifies all clients that a user came online
func (h *Hub) broadcastUserOnline(userID int, nickname string) {
	message := NewMessage(UserOnline, userID, 0, "")
	message.Nickname = nickname
	h.broadcastMessage(message.ToJSON())
}

// broadcastUserOffline notifies all clients that a user went offline
func (h *Hub) broadcastUserOffline(userID int, nickname string) {
	message := NewMessage(UserOffline, userID, 0, "")
	message.Nickname = nickname
	h.broadcastMessage(message.ToJSON())
}

// sendOnlineUsersList sends the current list of online users to a specific client
func (h *Hub) sendOnlineUsersList(client *Client) {
	h.Mu.RLock()
	onlineUsers := make([]string, 0, len(h.clients))
	for c := range h.clients {
		onlineUsers = append(onlineUsers, c.nickname)
	}
	h.Mu.RUnlock()

	// Create message with online users list
	onlineUsersJSON, _ := json.Marshal(onlineUsers)
	message := Message{
		Type:    OnlineUsers,
		Content: string(onlineUsersJSON),
	}

	select {
	case client.send <- message.ToJSON():
		log.Printf("[DEBUG] Sent online users list to user %d: %v", client.userID, onlineUsers)
	default:
		log.Printf("Could not send online users list to user %d", client.userID)
	}
}

// sendMessageDelivered notifies the sender that their message was delivered
func (h *Hub) sendMessageDelivered(senderID int, messageID int) {
	senderClient, exists := h.Users[senderID]
	if !exists {
		return
	}

	message := Message{
		Type:      MessageDelivered,
		MessageID: messageID,
	}

	select {
	case senderClient.send <- message.ToJSON():
	default:
		log.Printf("Could not send delivery confirmation to user %d", senderID)
	}
}

// sendMessageFailed notifies the sender that their message failed to deliver
func (h *Hub) sendMessageFailed(senderID int, receiverID int) {
	senderClient, exists := h.Users[senderID]
	if !exists {
		return
	}

	message := Message{
		Type:     MessageFailed,
		ToUserID: receiverID,
	}

	select {
	case senderClient.send <- message.ToJSON():
	default:
		log.Printf("Could not send failure notification to user %d", senderID)
	}
}

// handleLoadHistory loads message history for a conversation and sends it back to the requesting client
func (h *Hub) handleLoadHistory(req *Message) {
	log.Printf("[DEBUG] Handling load history request from %d for conversation with %d", req.FromUserID, req.ToUserID)

	// Get the requesting client
	requestingClient, exists := h.Users[req.FromUserID]
	if !exists {
		log.Printf("[DEBUG] Requesting client %d not found", req.FromUserID)
		return
	}

	// Import the repo package for database access
	// Note: This creates a circular import issue, so we'll need to pass the repo functions
	// For now, we'll create a placeholder that will be implemented with proper dependency injection

	// Load messages from database
	var messages []models.PrivateMessage
	var err error

	if messageRepoFunc != nil {
		// Use injected repository function
		messages, err = messageRepoFunc(req.FromUserID, req.ToUserID, 50, req.Offset)
		if err != nil {
			log.Printf("[DEBUG] Failed to load message history via injected repo: %v", err)
			return
		}
	} else {
		// Fallback to placeholder (empty messages)
		log.Printf("[DEBUG] No message repo injected, returning empty history")
		messages = []models.PrivateMessage{}
	}

	// Convert messages to JSON format for the response
	messageList := make([]map[string]interface{}, len(messages))
	for i, msg := range messages {
		messageList[i] = map[string]interface{}{
			"id":         msg.ID,
			"sender_id":  msg.SenderID,
			"content":    msg.Content,
			"created_at": msg.CreatedAt.Format(time.RFC3339),
			"is_read":    msg.IsRead,
		}
	}

	// Create the full response message
	responseData := map[string]interface{}{
		"type":         "history_loaded",
		"with_user_id": req.ToUserID,
		"messages":     messageList,
	}

	// Marshal to JSON
	responseJSON, err := json.Marshal(responseData)
	if err != nil {
		log.Printf("[DEBUG] Failed to marshal history response: %v", err)
		return
	}

	// Send to requesting client
	select {
	case requestingClient.send <- responseJSON:
		log.Printf("[DEBUG] Sent message history to user %d (%d messages)", req.FromUserID, len(messages))
	default:
		log.Printf("[DEBUG] Could not send history to user %d", req.FromUserID)
	}
}

// messageRepoFunc stores the injected repository function
var messageRepoFunc func(int, int, int, int) ([]models.PrivateMessage, error)

// SetMessageRepo sets the message repository for database operations
// This allows dependency injection to avoid circular imports
func SetMessageRepo(repoFunc func(int, int, int, int) ([]models.PrivateMessage, error)) {
	messageRepoFunc = repoFunc
}

// GetMessageRepoFunc returns the injected repository function
func GetMessageRepoFunc() func(int, int, int, int) ([]models.PrivateMessage, error) {
	return messageRepoFunc
}
