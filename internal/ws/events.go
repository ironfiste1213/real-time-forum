package ws

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"strings"
	"unicode/utf8"

	"html"
	//"log"
	"time"
)

// MessageType defines the type of WebSocket message
type MessageType string

// Message types for private messaging system
const (
	// User connection events
	JoinMessage  MessageType = "join"  // User joining the messaging system
	LeaveMessage MessageType = "leave" // User leaving the messaging system

	// Private messaging
	PrivateMessage MessageType = "private_message" // Private message between users

	// Status notifications
	UserOnline  MessageType = "user_online"  // User came online
	UserOffline MessageType = "user_offline" // User went offline
	OnlineUsers MessageType = "online_users" // List of online users

	// System messages
	MessageDelivered MessageType = "message_delivered" // Confirmation of message delivery
	MessageFailed    MessageType = "message_failed"    // Message delivery failed
	MessageFromMe    MessageType = "message_from_me"   // Message sent from another connection of the same user
)

// Message represents a WebSocket message structure
type Message struct {
	Type       MessageType `json:"type"`                   // Type of message
	Content    string      `json:"content,omitempty"`      // Message content (for private messages)
	FromUserID int         `json:"from_user_id,omitempty"` // Sender user ID
	ToUserID   int         `json:"to_user_id,omitempty"`   // Recipient user ID
	Nickname   string      `json:"nickname,omitempty"`     // Sender's nickname
	Timestamp  string      `json:"timestamp,omitempty"`    // ISO timestamp
	MessageID  int         `json:"message_id,omitempty"`   // Database message ID
	Offset     int         `json:"offset,omitempty"`       // For pagination (message history)
}

// PrivateMessageData is used internally for routing private messages through channels
type PrivateMessageData struct {
	ToUserID     int     // Target user ID for routing
	Data         []byte  // JSON-encoded message data
	Message      Message // Parsed message for processing
	SenderClient *Client // The client that sent the message (to exclude from message_from_me)
}

// ValidateMessage checks if a message has required fields based on its type
func (m *Message) Validate() error {
	// type check
	if m.Type != PrivateMessage {
		return errors.New("invalid message type")
	}

	// trim first
	content := strings.TrimSpace(m.Content)

	// empty
	if content == "" {
		return errors.New("message cannot be empty")
	}

	// length
	if len(content) > 500 {
		return errors.New("message too long (max 500)")
	}

	// utf-8
	if !utf8.ValidString(content) {
		return errors.New("invalid characters")
	}

	// receiver
	if m.ToUserID <= 0 {
		return errors.New("invalid receiver")
	}
	return nil
}

// NewMessage creates a new message with current timestamp
func NewMessage(msgType MessageType, fromUserID, toUserID int, content string) *Message {
	return &Message{
		Type:       msgType,
		Content:    content,
		FromUserID: fromUserID,
		ToUserID:   toUserID,
		Timestamp:  time.Now().Format(time.RFC3339),
	}
}

// ToJSON converts message to JSON bytes
func (m *Message) ToJSON() []byte {
	data, err := json.Marshal(m)
	if err != nil {
		log.Printf("[events.go:ToJSON] Error marshaling message: %v", err)
		return []byte{}
	}
	return data
}

// FromJSON parses JSON bytes into message
func FromJSON(data []byte) (*Message, error) {
	var msg Message
	if err := json.Unmarshal(data, &msg); err != nil {
		return nil, err
	}
	return &msg, nil
}

// logError is a helper for consistent error logging
func logError(msg string) error {
	log.Printf("[events.go:logError] Message validation error: %s", msg)
	return fmt.Errorf("message validation error: %s", msg)
}
