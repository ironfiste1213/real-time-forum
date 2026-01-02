package ws

import (
	"html"
	"log"
	"real-time-forum/internal/models"
	"real-time-forum/internal/repo"

	"time"

	"github.com/gorilla/websocket"
)

// Client represents a WebSocket connection from a user
type Client struct {
	conn     *websocket.Conn
	userID   int
	nickname string
	send     chan []byte
	hub      *Hub
	idex     int

	windowFrom time.Time
	msgCount   int
}

func NewClient(hub *Hub, conn *websocket.Conn, userID int, nickname string) *Client {
	return &Client{
		conn:     conn,
		userID:   userID,
		nickname: nickname,
		send:     make(chan []byte, 256),
		hub:      hub,
		idex:     0,

		// RATE LIMIT INIT
		windowFrom: time.Time{},
		msgCount:   0,
	}
}

// Start begins the client's read and write pumps
// This method starts two goroutines and returns immediately
func (c *Client) Start() {
	// Start write pump in a goroutine
	go c.writePump()

	// Start read pump in a goroutine
	go c.readPump()
}
func (c *Client) IsRateLimited() bool {
	now := time.Now()

	// أول مرة ولا دازت 1 ثانية
	if c.windowFrom.IsZero() || now.Sub(c.windowFrom) > time.Second {
		c.windowFrom = now
		c.msgCount = 0
	}

	// نزيدو العداد
	c.msgCount++

	// limit = 5 messages / second
	if c.msgCount > 5 {
		return true
	}

	return false
}

// readPump reads messages from the WebSocket connection
// Runs in its own goroutine for the lifetime of the connection
func (c *Client) readPump() {
	defer func() {
		// Cleanup when read pump exits
		log.Printf("[client.go:readPump] Client: ReadPump exiting for user %d (%s)", c.userID, c.nickname)
		c.hub.Unregister <- c // Tell hub we're leaving
		c.conn.Close()        // Close WebSocket connection
	}()

	// Set read deadline and pong handler for keepalive
	c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		log.Printf("[client.go:readPump] Client: recive pong from teh browser  for user %d (%s)", c.userID, c.nickname)
		return nil
	})

	// Flow: Client readPump started
	log.Printf("[client.go:readPump] Client: ReadPump started for user %d (%s)", c.userID, c.nickname)
	for {
		// Read message from WebSocket
		_, data, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("[client.go:readPump] Client: WebSocket error for user %d (%s): %v", c.userID, c.nickname, err)
			}
			break // Exit read loop on error
		}

		// Flow: Processing incoming message
		log.Printf("[client.go:readPump] Client: Received message from user %d (%s)", c.userID, c.nickname)

		// Parse the message
		message, err := FromJSON(data)
		if err != nil {
			log.Printf("[client.go:readPump] Client: Failed to parse message from user %d: %v", c.userID, err)
			continue // Skip invalid messages
		}

		// Set sender information
		message.FromUserID = c.userID
		message.Nickname = c.nickname

		// Handle typing events separately (no rate limiting, no content validation)
		if message.Type == UserTyping || message.Type == UserStoppedTyping {
			// Validate typing event
			if err := message.ValidateTypingEvent(); err != nil {
				log.Printf("[client.go:readPump] [DEBUG] Invalid typing event from user %d: %v", c.userID, err)
				continue
			}

			// Route typing event to hub
			log.Printf("[client.go:readPump][DEBUG] Routing typing event from %d to %d", message.FromUserID, message.ToUserID)
			c.hub.TypingEvent <- TypingData{
				ToUserID:     message.ToUserID,
				Data:         message.ToJSON(),
				FromUserID:   message.FromUserID,
				FromNickname: message.Nickname,
			}
			continue
		}

		// Validate the message (for private messages)
		if err := message.Validate(); err != nil {

			log.Printf("[client.go:readPump] [DEBUG] Invalid message from user %d: %v", c.userID, err)
			continue // Skip invalid messages
		}
		if c.IsRateLimited() {
			log.Printf("ggggggggggggggggggggggggggggggggggggggggggggggggg")

			c.conn.WriteJSON(map[string]string{
				"type": "error",
				"msg":  "Too many messages, slow down",
			})
			continue
		}

		safeContent := html.EscapeString(message.Content)
		message.Content = safeContent
		// Route message to hub based on type
		switch message.Type {
		case PrivateMessage:
			// Send private message to hub for routing
			log.Printf("[client.go:readPump][DEBUG] Routing private message from %d to %d", message.FromUserID, message.ToUserID)
			c.hub.PrivateMessage <- PrivateMessageData{
				ToUserID:     message.ToUserID,
				Data:         message.ToJSON(),
				Message:      *message,
				SenderClient: c, // Include the sender client to exclude from message_from_me
			}
			message := &models.PrivateMessage{
				SenderID:   message.FromUserID,
				ReceiverID: message.ToUserID,
				Content:    message.Content,
				CreatedAt:  time.Now(),
				IsRead:     false,
			}

			repo.CreatePrivateMessage(message)

		default:
			log.Printf("[client.go:readPump][DEBUG] Unknown message type from user %d: %s", c.userID, message.Type)
		}
	}
}

// [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]  k =4
// []

// writePump writes messages to the WebSocket connection
// Runs in its own goroutine for the lifetime of the connection
func (c *Client) writePump() {
	ticker := time.NewTicker(54 * time.Second) // Send ping slightly before read deadline
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			// Set write deadline
			c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				// Channel closed, send close message
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			// Send message as text message
			if err := c.conn.WriteMessage(websocket.TextMessage, message); err != nil {
				log.Printf("[client.go:writePump] Client: Error writing message to user %d: %v", c.userID, err)
				return
			}

		case <-ticker.C:
			// Send ping to keep connection alive
			c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				log.Printf("Error sending ping to user %d: %v", c.userID, err)
				return
			}
		}
	}
}

// SendMessage sends a message to this client
// This is called by the hub to deliver messages
func (c *Client) SendMessage(data []byte) {
	select {
	case c.send <- data:
		// Message sent successfully
	default:
		// Channel is full, close connection
		close(c.send)
	}
}

// GetUserID returns the client's user ID
func (c *Client) GetUserID() int {
	return c.userID
}

// GetNickname returns the client's nickname
func (c *Client) GetNickname() string {
	return c.nickname
}
