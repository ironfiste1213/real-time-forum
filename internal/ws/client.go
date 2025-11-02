package ws

import (
	"log"
	"time"

	"github.com/gorilla/websocket"
)

// Client represents a WebSocket connection from a user
type Client struct {
	// WebSocket connection
	conn *websocket.Conn

	// User information
	userID   int
	nickname string

	// Channels for communication with hub
	send chan []byte // Channel for messages to send to this client

	// Hub reference for cleanup
	hub *Hub
}

// NewClient creates a new client instance
func NewClient(hub *Hub, conn *websocket.Conn, userID int, nickname string) *Client {
	return &Client{
		conn:     conn,
		userID:   userID,
		nickname: nickname,
		send:     make(chan []byte, 256), // Buffered channel to prevent blocking
		hub:      hub,
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

// readPump reads messages from the WebSocket connection
// Runs in its own goroutine for the lifetime of the connection
func (c *Client) readPump() {
	defer func() {
		// Cleanup when read pump exits
		log.Printf("[DEBUG] Client readPump exiting for user %d (%s)", c.userID, c.nickname)
		c.hub.Unregister <- c // Tell hub we're leaving
		c.conn.Close()        // Close WebSocket connection
	}()

	// Set read deadline and pong handler for keepalive
	c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	log.Printf("[DEBUG] Client readPump started for user %d (%s)", c.userID, c.nickname)
	for {
		// Read message from WebSocket
		_, data, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("[DEBUG] WebSocket error for user %d (%s): %v", c.userID, c.nickname, err)
			}
			break // Exit read loop on error
		}

		log.Printf("[DEBUG] Received message from user %d (%s): %s", c.userID, c.nickname, string(data))

		// Parse the message
		message, err := FromJSON(data)
		if err != nil {
			log.Printf("[DEBUG] Failed to parse message from user %d: %v", c.userID, err)
			continue // Skip invalid messages
		}

		// Set sender information
		message.FromUserID = c.userID
		message.Nickname = c.nickname

		// Validate the message
		if err := message.ValidateMessage(); err != nil {
			log.Printf("[DEBUG] Invalid message from user %d: %v", c.userID, err)
			continue // Skip invalid messages
		}

		// Route message to hub based on type
		switch message.Type {
		case PrivateMessage:
			// Send private message to hub for routing
			log.Printf("[DEBUG] Routing private message from %d to %d", message.FromUserID, message.ToUserID)
			c.hub.PrivateMessage <- PrivateMessageData{
				ToUserID: message.ToUserID,
				Data:     message.ToJSON(),
				Message:  *message,
			}
		case LoadHistory:
			// Handle history loading (will be implemented)
			log.Printf("[DEBUG] History loading requested by user %d", c.userID)
		default:
			log.Printf("[DEBUG] Unknown message type from user %d: %s", c.userID, message.Type)
		}
	}
}

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
				log.Printf("Error writing message to user %d: %v", c.userID, err)
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
