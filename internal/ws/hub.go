package ws

import (
	"encoding/json"
	"log"
	"sync"

	"real-time-forum/internal/models"
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
	// User tracking
	Users map[int][]*Client // userID -> array of clients mapping
}

// NewHub creates a new hub instance with initialized channels and data structures
// Returns a pointer to Hub ready to manage WebSocket connections and message routing
// Initializes all necessary channels for client registration, unregistration, broadcasting,
// private messaging, and history loading operations
func NewHub() *Hub {
	return &Hub{
		clients:        make(map[*Client]bool),        // Map to track registered clients (client -> true)
		Register:       make(chan *Client),            // Channel for client registration requests
		Unregister:     make(chan *Client),            // Channel for client unregistration requests
		Broadcast:      make(chan []byte),             // Channel for broadcasting messages to all clients
		PrivateMessage: make(chan PrivateMessageData), // Channel for routing private messages between users
		Users:          make(map[int][]*Client),       // Map for userID -> slice of client connections
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
		}
	}
}

// registerClient adds a new client to the hub and performs initialization tasks
// @param client - The WebSocket client to register
// Registers the client, updates user mappings, broadcasts online status, and sends online users list
// registerClient registers the client, updates user mappings, broadcasts online status, and sends online users list
func (h *Hub) registerClient(client *Client) {
	log.Printf(
		"[hub.go:registerClient] Registering client for user %d (%s)",
		client.userID,
		client.nickname,
	)

	// Add client to the global clients set
	h.clients[client] = true

	// Add client to the user's connections slice (thread-safe)
	h.Mu.Lock()
	h.Users[client.userID] = append(h.Users[client.userID], client)
	h.Mu.Unlock()

	// Broadcast user online status to all connected clients
	log.Printf(
		"[hub.go:registerClient] [DEBUG] Broadcasting user online: %d (%s)",
		client.userID,
		client.nickname,
	)
	h.broadcastUserOnline(client.userID, client.nickname)

	// Send the current online users list to the newly connected client
	log.Printf(
		"[hub.go:registerClient] Sending online users list to new client %d",
		client.userID,
	)
	h.sendOnlineUsersList(client)
}

// unregisterClient removes a client from the hub
func (h *Hub) unregisterClient(client *Client) {
	log.Printf(
		"[hub.go:unregisterClient] [DEBUG] Unregistering client for user %d (%s)",
		client.userID,
		client.nickname,
	)

	h.Mu.Lock()
	defer h.Mu.Unlock()

	// Remove from global clients set
	if _, ok := h.clients[client]; ok {
		delete(h.clients, client)
	}

	// Remove this client from the user's slice
	clients := h.Users[client.userID]
	for i, c := range clients {
		if c == client {
			h.Users[client.userID] = append(clients[:i], clients[i+1:]...)
			break
		}
	}

	// Close the client's send channel
	close(client.send)

	// If user has no more active connections, remove user and broadcast offline
	if len(h.Users[client.userID]) == 0 {
		delete(h.Users, client.userID)
		log.Printf(
			"[hub.go:unregisterClient] [DEBUG] Broadcasting user offline: %d (%s)",
			client.userID,
			client.nickname,
		)
		h.broadcastUserOffline(client.userID, client.nickname)
	}
}

// broadcastMessage sends a message to all connected clients
// @param message - The byte array message to broadcast
// Iterates through all clients and sends the message, removing unresponsive clients
func (h *Hub) broadcastMessage(message []byte) {
	log.Printf(
		"[hub.go:broadcastMessage] [DEBUG] Broadcasting message to %d clients",
		len(h.clients),
	)

	for client := range h.clients {
		select {
		case client.send <- message:
			log.Printf(
				"[hub.go:broadcastMessage] [DEBUG] Message sent to user %d",
				client.userID,
			)

		default:
			// This specific connection is dead / blocked
			log.Printf(
				"[hub.go:broadcastMessage] [DEBUG] Client channel full, removing ONE connection of user %d",
				client.userID,
			)

			// Remove from global clients set
			close(client.send)
			delete(h.clients, client)

			// Remove ONLY this client from h.Users[userID]
			h.Mu.Lock()
			clients := h.Users[client.userID]

			for i, c := range clients {
				if c == client {
					// remove client from slice
					h.Users[client.userID] = append(clients[:i], clients[i+1:]...)
					break
				}
			}

			// If user has no more active connections → remove user
			if len(h.Users[client.userID]) == 0 {
				delete(h.Users, client.userID)
			}

			h.Mu.Unlock()
		}
	}
}

// handlePrivateMessage routes a private message to the target user
func (h *Hub) handlePrivateMessage(data PrivateMessageData) {
	log.Printf(
		"[hub.go:handlePrivateMessage] [DEBUG] Handling private message from %d to %d",
		data.Message.FromUserID,
		data.Message.ToUserID,
	)

	clients, exists := h.Users[data.ToUserID]
	if !exists || len(clients) == 0 {
		// Target user is offline
		log.Printf(
			"[hub.go:handlePrivateMessage][DEBUG] Target user %d is offline",
			data.ToUserID,
		)
		h.sendMessageFailed(data.Message.FromUserID, data.Message.ToUserID)
		return
	}

	delivered := false

	// Send the message to ALL active connections of the target user
	for _, client := range clients {
		select {
		case client.send <- data.Data:
			delivered = true
		default:
			// This specific connection is busy/full, skip it
			log.Printf(
				"[hub.go:handlePrivateMessage][DEBUG] Client channel full for user %d, skipping one connection",
				data.ToUserID,
			)
		}
	}

	if delivered {
		// At least one connection received the message
		log.Printf(
			"[hub.go:handlePrivateMessage][DEBUG] Message delivered to user %d, notifying sender %d",
			data.ToUserID,
			data.Message.FromUserID,
		)
		h.sendMessageDelivered(data.Message.FromUserID, data.Message.MessageID)

		// Check if sender has multiple connections and send "message_from_me" to other connections
		h.sendMessageFromMeToOtherConnections(data.Message.FromUserID, data.Message, data.SenderClient)
	} else {
		// No connection could receive the message
		log.Printf(
			"[hub.go:handlePrivateMessage][DEBUG] Message delivery failed to all connections of user %d",
			data.ToUserID,
		)
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

	// Use map as a set to avoid duplicate nicknames
	seen := make(map[string]struct{})
	onlineUsers := make([]string, 0)

	for c := range h.clients {
		if _, exists := seen[c.nickname]; exists {
			continue
		}
		seen[c.nickname] = struct{}{}
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
		log.Printf(
			"[hub.go:sendOnlineUsersList][DEBUG] Sent online users list to user %d: %v",
			client.userID,
			onlineUsers,
		)
	default:
		log.Printf(
			"[hub.go:sendOnlineUsersList] Could not send online users list to user %d",
			client.userID,
		)
	}
}

// sendMessageDelivered notifies the sender that their message was delivered
func (h *Hub) sendMessageDelivered(senderID int, messageID int) {
	clients, exists := h.Users[senderID]
	if !exists || len(clients) == 0 {
		return
	}

	message := Message{
		Type:      MessageDelivered,
		MessageID: messageID,
	}

	data := message.ToJSON()

	for _, client := range clients {
		select {
		case client.send <- data:
			// sent successfully to this connection
		default:
			log.Printf(
				"[hub.go:sendMessageDelivered] Could not send delivery confirmation to one connection of user %d",
				senderID,
			)
		}
	}
}

// sendMessageFailed notifies the sender that their message failed to deliver
func (h *Hub) sendMessageFailed(senderID int, receiverID int) {
	clients, exists := h.Users[senderID]
	if !exists || len(clients) == 0 {
		return
	}

	message := Message{
		Type:     MessageFailed,
		ToUserID: receiverID,
	}

	data := message.ToJSON()

	for _, client := range clients {
		select {
		case client.send <- data:
			// sent to this connection
		default:
			log.Printf(
				"[hub.go:sendMessageFailed] Could not send failure notification to one connection of user %d",
				senderID,
			)
		}
	}
}

// sendMessageFromMeToOtherConnections sends "message_from_me" to other connections of the sender
func (h *Hub) sendMessageFromMeToOtherConnections(senderID int, originalMessage Message, senderClient *Client) {
	clients, exists := h.Users[senderID]
	log.Printf("[hub.go:sendMessageFromMeToOtherConnections] [DEBUG] Checking connections for user %d, exists: %v, client count: %d", senderID, exists, len(clients))

	if !exists || len(clients) <= 1 {
		log.Printf("[hub.go:sendMessageFromMeToOtherConnections] [DEBUG] No other connections to send to for user %d", senderID)
		return
	}

	message := Message{
		Type:       MessageFromMe,
		Content:    originalMessage.Content,
		FromUserID: senderID,
		ToUserID:   originalMessage.ToUserID,
		Timestamp:  originalMessage.Timestamp,
		MessageID:  originalMessage.MessageID,
	}

	data := message.ToJSON()
	log.Printf("[hub.go:sendMessageFromMeToOtherConnections] [DEBUG] Created message_from_me: %+v", message)

	sentCount := 0
	for _, client := range clients {
		// Skip the sender client to avoid sending the message back to itself
		if client == senderClient {
			log.Printf("[hub.go:sendMessageFromMeToOtherConnections] [DEBUG] Skipping sender client for user %d", senderID)
			continue
		}

		select {
		case client.send <- data:
			log.Printf(
				"[hub.go:sendMessageFromMeToOtherConnections] [DEBUG] Successfully sent message_from_me to connection of user %d (client: %p)",
				senderID, client,
			)
			sentCount++
		default:
			log.Printf(
				"[hub.go:sendMessageFromMeToOtherConnections] [DEBUG] Could not send message_from_me to connection of user %d (client: %p) - channel full",
				senderID, client,
			)
		}
	}
	log.Printf("[hub.go:sendMessageFromMeToOtherConnections] [DEBUG] Sent message_from_me to %d connections for user %d", sentCount, senderID)
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
