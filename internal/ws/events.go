package ws

import (
	"encoding/json"
	"fmt"
	"log"
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
	LoadHistory    MessageType = "load_history"    // Request to load message history
	HistoryLoaded  MessageType = "history_loaded"  // Response with message history

	// Status notifications
	UserOnline  MessageType = "user_online"  // User came online
	UserOffline MessageType = "user_offline" // User went offline
	OnlineUsers MessageType = "online_users" // List of online users

	// System messages
	MessageDelivered MessageType = "message_delivered" // Confirmation of message delivery
	MessageFailed    MessageType = "message_failed"    // Message delivery failed
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
	ToUserID int     // Target user ID for routing
	Data     []byte  // JSON-encoded message data
	Message  Message // Parsed message for processing
}

// ValidateMessage checks if a message has required fields based on its type
func (m *Message) ValidateMessage() error {
	switch m.Type {
	case PrivateMessage:
		if m.Content == "" || m.ToUserID == 0 || m.FromUserID == 0 {
			return logError("private message missing required fields")
		}
	case LoadHistory:
		if m.ToUserID == 0 || m.FromUserID == 0 {
			return logError("load history missing user IDs")
		}
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
		log.Printf("Error marshaling message: %v", err)
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
	log.Printf("Message validation error: %s", msg)
	return fmt.Errorf("message validation error: %s", msg)
}
