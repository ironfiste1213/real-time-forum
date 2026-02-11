package ws

import (
	"fmt"
	"log"
	"sync"
)

// TypingPair represents a unique typing session between two users
// type TypingPair struct {
// 	FromUserID int
// 	ToUserID   int
// }

// TypingInfo stores information about a typing event
// type TypingInfo struct {
// 	FromNickname string
// 	ToUserID     int
// 	LastActivity time.Time
// }

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
	// TypingEvent    chan TypingData         // Typing events between specific users
	// User tracking
	Users map[int][]*Client // userID -> array of clients mapping

	// Typing timeout tracking - tracks per user-target pair
	// typingLastActivity map[TypingPair]time.Time  // typing pair -> last typing timestamp
	// typingUsers        map[TypingPair]TypingInfo // typing pair -> typing info (nickname, target)
	// typingCheckTicker  *time.Ticker              // Ticker to check for typing timeouts
	// typingTimeout      time.Duration             // Timeout duration (2 seconds)
}

// NewHub creates a new hub instance with initialized channels and data structures
// Returns a pointer to Hub ready to manage WebSocket connections and message routing
// Initializes all necessary channels for client registration, unregistration, broadcasting,
// private messaging, and history loading operations
func NewHub() *Hub {
	hub := &Hub{
		clients:        make(map[*Client]bool),        // Map to track registered clients (client -> true)
		Register:       make(chan *Client),            // Channel for client registration requests
		Unregister:     make(chan *Client),            // Channel for client unregistration requests
		Broadcast:      make(chan []byte),             // Channel for broadcasting messages to all clients
		PrivateMessage: make(chan PrivateMessageData), // Channel for routing private messages between users
		// TypingEvent:        make(chan TypingData),                  // Channel for routing typing events between users
		Users: make(map[int][]*Client), // Map for userID -> slice of client connections
		// typingLastActivity: make(map[TypingPair]time.Time),         // Track last typing activity per pair
		// typingUsers:        make(map[TypingPair]TypingInfo),        // Track typing info per pair
		// typingCheckTicker:  time.NewTicker(500 * time.Millisecond), // Check every 500ms
		// typingTimeout:      2000 * time.Millisecond,                // 2 second timeout
	}

	// Start typing timeout checker goroutine
	// go hub.checkTypingTimeouts()

	return hub
}

// checkTypingTimeouts periodically checks for users who stopped typing
// func (h *Hub) checkTypingTimeouts() {
// 	for range h.typingCheckTicker.C {
// 		//fmt.Println("checkTypingTimeouts:   ------------")

// 		now := time.Now()
// 		h.Mu.Lock()

// 		// Check each typing pair
// 		for pair, lastActivity := range h.typingLastActivity {
// 			// If typing session has exceeded the timeout, notify recipient
// 			if now.Sub(lastActivity) > h.typingTimeout {
// 				// Get typing info
// 				typingInfo, exists := h.typingUsers[pair]
// 				if !exists {
// 					log.Printf("[hub.go:checkTypingTimeouts] Typing info not found for pair %d->%d", pair.FromUserID, pair.ToUserID)
// 					delete(h.typingLastActivity, pair)
// 					h.Mu.Unlock()
// 					continue
// 				}

// 				log.Printf("[hub.go:checkTypingTimeouts] User %d (%s) stopped typing to user %d (timeout)",
// 					pair.FromUserID, typingInfo.FromNickname, pair.ToUserID)

// 				// Send stopped typing notification to the recipient
// 				h.sendStoppedTypingNotification(pair.FromUserID, pair.ToUserID, typingInfo.FromNickname)

// 				// Clean up typing tracking for this pair
// 				delete(h.typingLastActivity, pair)
// 				delete(h.typingUsers, pair)
// 			}
// 		}

// 		h.Mu.Unlock()
// 	}
// }

// sendStoppedTypingNotification sends a stopped typing event to the target user
// func (h *Hub) sendStoppedTypingNotification(fromUserID int, toUserID int, fromNickname string) {
// 	clients, exists := h.Users[toUserID]
// 	if !exists || len(clients) == 0 {
// 		log.Printf(
// 			"[hub.go:sendStoppedTypingNotification][DEBUG] Target user %d is offline, stopped typing notification ignored",
// 			toUserID,
// 		)
// 		return
// 	}

// 	// Create stopped typing message
// 	message := Message{
// 		Type:       UserStoppedTyping,
// 		FromUserID: fromUserID,
// 		ToUserID:   toUserID,
// 		Nickname:   fromNickname,
// 		Timestamp:  time.Now().Format(time.RFC3339),
// 	}
// 	data := message.ToJSON()

// 	// Send to all active connections of the target user
// 	for _, client := range clients {
// 		select {
// 		case client.send <- data:
// 			log.Printf(
// 				"[hub.go:sendStoppedTypingNotification][DEBUG] Stopped typing sent to user %d for user %d",
// 				toUserID, fromUserID,
// 			)
// 		default:
// 			log.Printf(
// 				"[hub.go:sendStoppedTypingNotification][DEBUG] Client channel full for user %d, skipping one connection",
// 				toUserID,
// 			)
// 		}
// 	}
// }

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

			// case typingEvent := <-h.TypingEvent:
			// 	h.handleTypingEvent(typingEvent)
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

	// Clean up any stale connections for this user before registering the new one
	//h.cleanupStaleConnection(client)

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
}

// unregisterClient removes a client from the hub
func (h *Hub) unregisterClient(client *Client) {
	log.Printf(
		"[hub.go:unregisterClient] [DEBUG] Unregistering client for user %d (%s)",
		client.userID,
		client.nickname,
	)

	// h.Mu.Lock()
	// defer h.Mu.Unlock()

	// Remove from global clients set

	delete(h.clients, client)

	// Remove this client from the user's slice
	clients := h.Users[client.userID]
	for i, c := range clients {
		if c == client {
			h.Users[client.userID] = append(clients[:i], clients[i+1:]...)
			break
		}
	}

	// Clean up any typing sessions involving this user
	// h.cleanupTypingSessionsForUser(client.userID)

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

// cleanupTypingSessionsForUser removes all typing sessions involving a user
// func (h *Hub) cleanupTypingSessionsForUser(userID int) {
// 	for pair := range h.typingLastActivity {
// 		if pair.FromUserID == userID || pair.ToUserID == userID {
// 			log.Printf(
// 				"[hub.go:cleanupTypingSessionsForUser] Cleaning up typing session %d->%d for disconnected user %d",
// 				pair.FromUserID, pair.ToUserID, userID,
// 			)
// 			delete(h.typingLastActivity, pair)
// 			delete(h.typingUsers, pair)
// 		}
// 	}
// }

// cleanupStaleConnection checks for and removes stale/zombie connections from the same browser
// When a new connection is established, we close ALL existing connections for the same user
// except the new one. This handles browser refresh cases where beforeunload may not fire.
// The old connections will detect their socket was closed and properly unregister.
func (h *Hub) cleanupStaleConnection(newClient *Client) {
	h.Mu.Lock()
	defer h.Mu.Unlock()

	userID := newClient.userID
	clients := h.Users[userID]

	if len(clients) == 0 {
		// No existing connections, nothing to clean up
		return
	}

	log.Printf(
		"[hub.go:cleanupStaleConnection] User %d has %d existing connections, new connection from %p",
		userID,
		len(clients),
		newClient,
	)

	// When a new connection comes in, close ALL existing connections for this user
	// The old connections will detect socket closure in their readPump and properly unregister
	// This handles browser refresh where beforeunload doesn't fire in time
	staleCount := 0
	for _, client := range clients {
		if client == newClient {
			// Skip the new client we're about to register
			continue
		}

		// Close the old connection
		if client.conn != nil {
			log.Printf(
				"[hub.go:cleanupStaleConnection] Closing stale connection %p for user %d (new connection from %p)",
				client,
				userID,
				newClient,
			)
			// This will trigger the readPump to exit and unregister the client
			client.conn.Close()
		}

		// Remove from clients map
		delete(h.clients, client)
		staleCount++
		// h.cleanupTypingSessionsForUser(userID)
	}

	// Clear the users slice - new client will add itself after this function returns
	h.Users[userID] = []*Client{newClient}

	log.Printf(
		"[hub.go:cleanupStaleConnection] Cleaned up %d stale connections for user %d",
		staleCount,
		userID,
	)
}

// broadcastMessage sends a message to all connected clients
// @param message - The byte array message to broadcast
// Iterates through all clients and sends the message, removing unresponsive clients
func (h *Hub) broadcastMessage(message []byte) {
	log.Printf(
		"[hub.go:broadcastMessage] [DEBUG] Broadcasting message to %d clients",
		len(h.clients),
	)

	// Collect all clients first to avoid holding lock during sends
	h.Mu.RLock()
	allClients := make([]*Client, 0, len(h.clients))
	fmt.Print("hhhhhhhhhhhhhhhhh--------********")

	for client := range h.clients {
		allClients = append(allClients, client)
	}
	h.Mu.RUnlock()

	// Collect clients that need to be removed (channels full)
	var clientsToRemove []*Client

	// Now iterate and send without holding the lock
	for _, client := range allClients {
		select {
		case client.send <- message:
			log.Printf(
				"[hub.go:broadcastMessage] [DEBUG] Message sent to user %d",
				client.userID,
			)

		default:
			// This specific connection is dead / blocked
			log.Printf(
				"[hub.go:broadcastMessage] [DEBUG] Client channel full, marking for removal: user %d",
				client.userID,
			)
			clientsToRemove = append(clientsToRemove, client)
		}
	}

	// Now remove the clients that need removal, acquiring lock only when necessary
	if len(clientsToRemove) > 0 {
		h.Mu.Lock()
		for _, client := range clientsToRemove {
			if _, ok := h.clients[client]; ok {
				close(client.send)
				delete(h.clients, client)

				// Remove ONLY this client from h.Users[userID]
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
			}
		}
		h.Mu.Unlock()

		// Clean up typing sessions for removed clients
		// for _, client := range clientsToRemove {
		// 	h.cleanupTypingSessionsForUser(client.userID)
		// }
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
		// h.sendStoppedTypingNotification(data.Message.FromUserID, data.Message.ToUserID, data.Message.Nickname)
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
// func (h *Hub) handleTypingEvent(data TypingData) {
// 	log.Printf(
// 		"[hub.go:handleTypingEvent] [DEBUG] Handling typing event from %d (%s) to %d",
// 		data.FromUserID,
// 		data.FromNickname,
// 		data.ToUserID,
// 	)

// 	clients, exists := h.Users[data.ToUserID]
// 	if !exists || len(clients) == 0 {
// 		// Target user is offline, still track typing for timeout detection when they come back
// 		log.Printf(
// 			"[hub.go:handleTypingEvent][DEBUG] Target user %d is offline, but tracking typing anyway",
// 			data.ToUserID,
// 		)
// 	}

// 	// Create typing pair for tracking
// 	pair := TypingPair{
// 		FromUserID: data.FromUserID,
// 		ToUserID:   data.ToUserID,
// 	}

// 	// Update typing tracking - record last activity and typing info
// 	h.Mu.Lock()
// 	h.typingLastActivity[pair] = time.Now()
// 	h.typingUsers[pair] = TypingInfo{
// 		FromNickname: data.FromNickname,
// 		ToUserID:     data.ToUserID,
// 		LastActivity: time.Now(),
// 	}
// 	h.Mu.Unlock()

// 	// Send typing event to ALL active connections of the target user (only if online)
// 	if exists && len(clients) > 0 {
// 		for _, client := range clients {
// 			select {
// 			case client.send <- data.Data:
// 				log.Printf(
// 					"[hub.go:handleTypingEvent][DEBUG] Typing event sent to user %d",
// 					data.ToUserID,
// 				)
// 			default:
// 				// This specific connection is busy/full, skip it
// 				log.Printf(
// 					"[hub.go:handleTypingEvent][DEBUG] Client channel full for user %d, skipping one connection",
// 					data.ToUserID,
// 				)
// 			}
// 		}
// 	}
// }

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

	// Clean up any typing sessions involving this user
	// h.Mu.Lock()
	// h.cleanupTypingSessionsForUser(userID)
	// h.Mu.Unlock()
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
