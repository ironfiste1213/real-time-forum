package ws

import (
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"

	"real-time-forum/internal/models"
)

// TypingPair represents a unique typing session between two users
type TypingPair struct {
	FromUserID int
	ToUserID   int
}

// TypingInfo stores information about a typing event
type TypingInfo struct {
	FromNickname string
	ToUserID     int
	LastActivity time.Time
}

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
	TypingEvent    chan TypingData         // Typing events between specific users
	// User tracking
	Users map[int][]*Client // userID -> array of clients mapping

	// Typing timeout tracking - tracks per user-target pair
	typingLastActivity map[TypingPair]time.Time  // typing pair -> last typing timestamp
	typingUsers        map[TypingPair]TypingInfo // typing pair -> typing info (nickname, target)
	typingCheckTicker  *time.Ticker              // Ticker to check for typing timeouts
	typingTimeout      time.Duration             // Timeout duration (2 seconds)
}

// NewHub creates a new hub instance with initialized channels and data structures
// Returns a pointer to Hub ready to manage WebSocket connections and message routing
// Initializes all necessary channels for client registration, unregistration, broadcasting,
// private messaging, and history loading operations
func NewHub() *Hub {
	hub := &Hub{
		clients:            make(map[*Client]bool),                 // Map to track registered clients (client -> true)
		Register:           make(chan *Client),                     // Channel for client registration requests
		Unregister:         make(chan *Client),                     // Channel for client unregistration requests
		Broadcast:          make(chan []byte),                      // Channel for broadcasting messages to all clients
		PrivateMessage:     make(chan PrivateMessageData),          // Channel for routing private messages between users
		TypingEvent:        make(chan TypingData),                  // Channel for routing typing events between users
		Users:              make(map[int][]*Client),                // Map for userID -> slice of client connections
		typingLastActivity: make(map[TypingPair]time.Time),         // Track last typing activity per pair
		typingUsers:        make(map[TypingPair]TypingInfo),        // Track typing info per pair
		typingCheckTicker:  time.NewTicker(500 * time.Millisecond), // Check every 500ms
		typingTimeout:      2000 * time.Millisecond,                // 2 second timeout
	}

	// Start typing timeout checker goroutine
	go hub.checkTypingTimeouts()

	return hub
}

// checkTypingTimeouts periodically checks for users who stopped typing
func (h *Hub) checkTypingTimeouts() {
	for range h.typingCheckTicker.C {
		now := time.Now()
		h.Mu.Lock()

		// Check each typing pair
		for pair, lastActivity := range h.typingLastActivity {
			// If typing session has exceeded the timeout, notify recipient
			if now.Sub(lastActivity) > h.typingTimeout {
				// Get typing info
				typingInfo, exists := h.typingUsers[pair]
				if !exists {
					log.Printf("[hub.go:checkTypingTimeouts] Typing info not found for pair %d->%d", pair.FromUserID, pair.ToUserID)
					delete(h.typingLastActivity, pair)
					h.Mu.Unlock()
					continue
				}

				log.Printf("[hub.go:checkTypingTimeouts] User %d (%s) stopped typing to user %d (timeout)",
					pair.FromUserID, typingInfo.FromNickname, pair.ToUserID)

				// Send stopped typing notification to the recipient
				h.sendStoppedTypingNotification(pair.FromUserID, pair.ToUserID, typingInfo.FromNickname)

				// Clean up typing tracking for this pair
				delete(h.typingLastActivity, pair)
				delete(h.typingUsers, pair)
			}
		}

		h.Mu.Unlock()
	}
}

// sendStoppedTypingNotification sends a stopped typing event to the target user
func (h *Hub) sendStoppedTypingNotification(fromUserID int, toUserID int, fromNickname string) {
	clients, exists := h.Users[toUserID]
	if !exists || len(clients) == 0 {
		log.Printf(
			"[hub.go:sendStoppedTypingNotification][DEBUG] Target user %d is offline, stopped typing notification ignored",
			toUserID,
		)
		return
	}

	// Create stopped typing message
	message := Message{
		Type:       UserStoppedTyping,
		FromUserID: fromUserID,
		ToUserID:   toUserID,
		Nickname:   fromNickname,
		Timestamp:  time.Now().Format(time.RFC3339),
	}
	data := message.ToJSON()

	// Send to all active connections of the target user
	for _, client := range clients {
		select {
		case client.send <- data:
			log.Printf(
				"[hub.go:sendStoppedTypingNotification][DEBUG] Stopped typing sent to user %d for user %d",
				toUserID, fromUserID,
			)
		default:
			log.Printf(
				"[hub.go:sendStoppedTypingNotification][DEBUG] Client channel full for user %d, skipping one connection",
				toUserID,
			)
		}
	}
}

// Run starts the hub and handles all WebSocket operations
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			log.Printf("[hub.go:Run] Processing register request for user %d", client.userID)
			h.registerClient(client)

		case client := <-h.Unregister:
			log.Printf("[hub.go:Run] Processing unregister request for user %d", client.userID)
			h.unregisterClient(client)

		case message := <-h.Broadcast:
			h.broadcastMessage(message)

		case privateMsg := <-h.PrivateMessage:
			h.handlePrivateMessage(privateMsg)

		case typingEvent := <-h.TypingEvent:
			h.handleTypingEvent(typingEvent)
		}
	}
}

// registerClient adds a new client to the hub and performs initialization tasks
// @param client - The WebSocket client to register
// Registers the client, updates user mappings, broadcasts online status, and sends online users list
// registerClient registers the client, updates user mappings, broadcasts online status, and sends online users list
func (h *Hub) registerClient(client *Client) {
	fmt.Println("here here hrere")
	log.Printf(
		"[hub.go:registerClient] Registering client for user %d (%s)",
		client.userID,
		client.nickname,
	)

	// Add client to the global clients set
	h.clients[client] = true
	log.Printf("[hub.go:registerClient] Client added to global clients set, total clients: %d", len(h.clients))

	// Add client to the user's connections slice (thread-safe)
	h.Mu.Lock()
	h.Users[client.userID] = append(h.Users[client.userID], client)
	userConnectionCount := len(h.Users[client.userID])
	h.Mu.Unlock()
	log.Printf("[hub.go:registerClient] Client added to user connections, user %d has %d connections",
		client.userID, userConnectionCount)

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

	log.Printf("[hub.go:registerClient] Registration complete for user %d (%s)", client.userID, client.nickname)
}

// unregisterClient removes a client from the hub
func (h *Hub) unregisterClient(client *Client) {
	log.Printf(
		"[hub.go:unregisterClient] [DEBUG] Unregistering client for user %d (%s)",
		client.userID,
		client.nickname,
	)

	// Remove from global clients set first (before acquiring lock for broadcast)
	hadClient := false
	h.Mu.Lock()
	if _, ok := h.clients[client]; ok {
		hadClient = true
		delete(h.clients, client)
	}
	h.Mu.Unlock()

	// Remove this client from the user's slice
	h.Mu.Lock()
	clients := h.Users[client.userID]
	for i, c := range clients {
		if c == client {
			h.Users[client.userID] = append(clients[:i], clients[i+1:]...)
			break
		}
	}
	userHasMoreConnections := len(h.Users[client.userID]) > 0
	h.Mu.Unlock()

	// Clean up any typing sessions involving this user
	h.cleanupTypingSessionsForUser(client.userID)

	// Close the client's send channel
	close(client.send)

	// Broadcast offline ONLY if this was the user's last connection
	// Use non-blocking send to Broadcast channel to avoid blocking the hub
	if hadClient && !userHasMoreConnections {
		log.Printf(
			"[hub.go:unregisterClient] [DEBUG] User %d has no more connections, broadcasting offline",
			client.userID,
		)
		message := NewMessage(UserOffline, client.userID, 0, "")
		message.Nickname = client.nickname

		// Non-blocking send to avoid deadlock
		select {
		case h.Broadcast <- message.ToJSON():
			log.Printf("[hub.go:unregisterClient] Broadcast queued for user %d offline", client.userID)
		default:
			log.Printf("[hub.go:unregisterClient] Broadcast channel full, skipping offline broadcast for user %d", client.userID)
		}
	}
}

// cleanupTypingSessionsForUser removes all typing sessions involving a user
func (h *Hub) cleanupTypingSessionsForUser(userID int) {
	for pair := range h.typingLastActivity {
		if pair.FromUserID == userID || pair.ToUserID == userID {
			log.Printf(
				"[hub.go:cleanupTypingSessionsForUser] Cleaning up typing session %d->%d for disconnected user %d",
				pair.FromUserID, pair.ToUserID, userID,
			)
			delete(h.typingLastActivity, pair)
			delete(h.typingUsers, pair)
		}
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

			// Clean up typing sessions for this client
			h.cleanupTypingSessionsForUser(client.userID)

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
			data.Message.ToUserID,
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

		// When message is sent, also notify recipient that sender stopped typing
		h.sendStoppedTypingNotification(data.Message.FromUserID, data.Message.ToUserID, data.Message.Nickname)
	} else {
		// No connection could receive the message
		log.Printf(
			"[hub.go:handlePrivateMessage][DEBUG] Message delivery failed to all connections of user %d",
			data.ToUserID,
		)
		h.sendMessageFailed(data.Message.FromUserID, data.Message.ToUserID)
	}
}

// handleTypingEvent routes a typing event to the target user and tracks typing state
func (h *Hub) handleTypingEvent(data TypingData) {
	log.Printf(
		"[hub.go:handleTypingEvent] [DEBUG] Handling typing event from %d (%s) to %d",
		data.FromUserID,
		data.FromNickname,
		data.ToUserID,
	)

	clients, exists := h.Users[data.ToUserID]
	if !exists || len(clients) == 0 {
		// Target user is offline, still track typing for timeout detection when they come back
		log.Printf(
			"[hub.go:handleTypingEvent][DEBUG] Target user %d is offline, but tracking typing anyway",
			data.ToUserID,
		)
	}

	// Create typing pair for tracking
	pair := TypingPair{
		FromUserID: data.FromUserID,
		ToUserID:   data.ToUserID,
	}

	// Update typing tracking - record last activity and typing info
	h.Mu.Lock()
	h.typingLastActivity[pair] = time.Now()
	h.typingUsers[pair] = TypingInfo{
		FromNickname: data.FromNickname,
		ToUserID:     data.ToUserID,
		LastActivity: time.Now(),
	}
	h.Mu.Unlock()

	// Send typing event to ALL active connections of the target user (only if online)
	if exists && len(clients) > 0 {
		for _, client := range clients {
			select {
			case client.send <- data.Data:
				log.Printf(
					"[hub.go:handleTypingEvent][DEBUG] Typing event sent to user %d",
					data.ToUserID,
				)
			default:
				// This specific connection is busy/full, skip it
				log.Printf(
					"[hub.go:handleTypingEvent][DEBUG] Client channel full for user %d, skipping one connection",
					data.ToUserID,
				)
			}
		}
	}
}

// broadcastUserOnline notifies all clients that a user came online
func (h *Hub) broadcastUserOnline(userID int, nickname string) {
	message := NewMessage(UserOnline, userID, 0, "")
	message.Nickname = nickname

	// Non-blocking send to avoid blocking the hub
	select {
	case h.Broadcast <- message.ToJSON():
		log.Printf("[hub.go:broadcastUserOnline] Online broadcast queued for user %d", userID)
	default:
		log.Printf("[hub.go:broadcastUserOnline] Broadcast channel full, skipping online broadcast for user %d", userID)
	}
}

// broadcastUserOffline notifies all clients that a user went offline
func (h *Hub) broadcastUserOffline(userID int, nickname string) {
	message := NewMessage(UserOffline, userID, 0, "")
	message.Nickname = nickname

	// Non-blocking send to avoid blocking the hub
	select {
	case h.Broadcast <- message.ToJSON():
		log.Printf("[hub.go:broadcastUserOffline] Offline broadcast queued for user %d", userID)
	default:
		log.Printf("[hub.go:broadcastUserOffline] Broadcast channel full, skipping offline broadcast for user %d", userID)
	}

	// Clean up any typing sessions involving this user
	h.Mu.Lock()
	h.cleanupTypingSessionsForUser(userID)
	h.Mu.Unlock()
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

	// if !exists || len(clients) <= 1 {
	// 	log.Printf("[hub.go:sendMessageFromMeToOtherConnections] [DEBUG] No other connections to send to for user %d", senderID)
	// 	return
	// }

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
		// if client == senderClient {
		// 	log.Printf("[hub.go:sendMessageFromMeToOtherConnections] [DEBUG] Skipping sender client for user %d", senderID)
		// 	//continue
		// }

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
