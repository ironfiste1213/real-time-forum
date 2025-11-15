# Chat System File Descriptions

This document provides detailed descriptions of the files in the chat system of the real-time forum project. Each file is described with its purpose, data structures, methods, and usage within the project.

## Overview

The chat system enables real-time private messaging between users via WebSocket connections. It consists of WebSocket handling, message routing, database operations, and REST API endpoints. The system supports features like online status, message delivery confirmations, and message history loading.

## Files

### `internal/ws/hub.go`

**Purpose**: This file implements the central hub that manages WebSocket connections and routes messages between clients. It acts as the core coordinator for all real-time messaging operations.

**Data Structures**:
- `Hub`: Manages client connections, message channels, and user tracking. Contains channels for registration, unregistration, broadcasting, private messages, and history loading. Includes a mutex for thread-safe access and a map of users to clients.
- `PrivateMessageData`: Used internally for routing private messages through channels. Contains the target user ID, JSON-encoded data, and the parsed message.

**Methods**:
- `NewHub()`: Creates a new hub instance with initialized channels and maps.
- `Run()`: Starts the hub's main loop to handle all WebSocket operations via select statement on channels.
- `registerClient(client *Client)`: Adds a new client, updates user map, broadcasts online status, and sends online users list.
- `unregisterClient(client *Client)`: Removes a client, updates user map, closes send channel, and broadcasts offline status.
- `broadcastMessage(message []byte)`: Sends a message to all connected clients.
- `handlePrivateMessage(data PrivateMessageData)`: Routes private messages to the target user or sends failure notification if offline.
- `broadcastUserOnline(userID int, nickname string)`: Notifies all clients when a user comes online.
- `broadcastUserOffline(userID int, nickname string)`: Notifies all clients when a user goes offline.
- `sendOnlineUsersList(client *Client)`: Sends the current list of online users to a specific client.
- `sendMessageDelivered(senderID int, messageID int)`: Notifies sender that message was delivered.
- `sendMessageFailed(senderID int, receiverID int)`: Notifies sender that message delivery failed.
- `handleLoadHistory(req *Message)`: Loads message history from database and sends it to the requesting client.
- `SetMessageRepo(repoFunc func(int, int, int, int) ([]models.PrivateMessage, error))`: Injects the message repository function to avoid circular imports.
- `GetMessageRepoFunc()`: Returns the injected repository function.

**Usage**: Used whenever the WebSocket server is running. The hub is initialized once at startup and runs continuously to manage all client connections and message routing in real-time.

### `internal/ws/client.go`

**Purpose**: This file handles individual WebSocket connections from users, managing the read and write operations for each client.

**Data Structures**:
- `Client`: Represents a WebSocket connection with user info, send channel, and hub reference. Contains the WebSocket connection, user ID, nickname, buffered send channel, and hub pointer.

**Methods**:
- `NewClient(hub *Hub, conn *websocket.Conn, userID int, nickname string) *Client`: Creates a new client instance with initialized fields.
- `Start()`: Begins the client's read and write pumps in separate goroutines.
- `readPump()`: Reads messages from the WebSocket connection, parses them, validates, and routes to the hub. Handles connection keepalive with pong handler.
- `writePump()`: Writes messages to the WebSocket connection, sends pings for keepalive, and handles channel closure.
- `SendMessage(data []byte)`: Sends a message to this client via the send channel.
- `GetUserID() int`: Returns the client's user ID.
- `GetNickname() string`: Returns the client's nickname.

**Usage**: A new Client is created for each WebSocket connection upgrade. Used throughout the connection lifetime to handle incoming messages and outgoing broadcasts/private messages.

### `internal/ws/events.go`

**Purpose**: This file defines message types, structures, and utilities for WebSocket communication in the private messaging system.

**Data Structures**:
- `MessageType`: A string type defining constants for different message types (e.g., PrivateMessage, LoadHistory, UserOnline).
- `Message`: The main structure for WebSocket messages, containing type, content, user IDs, nickname, timestamp, message ID, and offset.
- `PrivateMessageData`: Used for routing private messages (same as in hub.go).

**Methods**:
- `ValidateMessage() error`: Checks if a message has required fields based on its type.
- `NewMessage(msgType MessageType, fromUserID, toUserID int, content string) *Message`: Creates a new message with current timestamp.
- `ToJSON() []byte`: Converts message to JSON bytes.
- `FromJSON(data []byte) (*Message, error)`: Parses JSON bytes into a Message struct.
- `logError(msg string) error`: Helper for consistent error logging.

**Usage**: Used in all WebSocket message handling. Message structs are created for every incoming/outgoing WebSocket message, validated, and serialized/deserialized for transmission.

### `internal/http/handler/websocket.go`

**Purpose**: This file provides the HTTP handler that upgrades connections to WebSocket and initializes the WebSocket hub.

**Data Structures**:
- `upgrader`: A WebSocket upgrader with origin checking (allows all in development).
- `hub`: Global hub instance (pointer to ws.Hub).

**Methods**:
- `InitWebSocket()`: Initializes the global hub, injects message repo function, and starts the hub's Run() in a goroutine.
- `WebSocketHandler(w http.ResponseWriter, r *http.Request)`: Handles WebSocket upgrade requests, validates session, creates client, registers with hub, and starts client pumps.
- `GetHub() *ws.Hub`: Returns the global hub instance.

**Usage**: InitWebSocket is called once at server startup. WebSocketHandler is used for each WebSocket connection request (e.g., when a user opens the chat). GetHub is used by other parts of the system to access the hub.

### `internal/http/handler/messages.go`

**Purpose**: This file implements REST API handlers for private messaging operations, providing HTTP endpoints for sending, retrieving, and managing messages.

**Data Structures**:
- None specific; uses standard HTTP request/response and JSON encoding.

**Methods**:
- `SendPrivateMessageHandler(w http.ResponseWriter, r *http.Request)`: Handles POST requests to send private messages, validates input, creates message in DB.
- `GetPrivateMessagesHandler(w http.ResponseWriter, r *http.Request)`: Handles GET requests to retrieve messages between two users, with pagination, and marks messages as read.
- `GetConversationsHandler(w http.ResponseWriter, r *http.Request)`: Handles GET requests to retrieve recent conversations for a user.
- `GetUnreadCountHandler(w http.ResponseWriter, r *http.Request)`: Handles GET requests to get the count of unread messages for a user.

**Usage**: These handlers are registered as HTTP routes and used when users interact with the chat via REST API (e.g., loading message history on page load, sending messages via AJAX if WebSocket fails).

### `internal/repo/messages.go`

**Purpose**: This file contains database operations for private messages, handling CRUD operations and queries for message data.

**Data Structures**:
- None specific; operates on models.PrivateMessage and returns slices/maps.

**Methods**:
- `CreatePrivateMessage(message *models.PrivateMessage) error`: Inserts a new private message into the database.
- `GetPrivateMessagesBetweenUsers(userID1, userID2 int, limit, offset int) ([]models.PrivateMessage, error)`: Retrieves paginated messages between two users, ordered chronologically.
- `MarkMessagesAsRead(senderID, receiverID int) error`: Updates messages from sender to receiver as read.
- `GetUnreadMessageCount(userID int) (int, error)`: Returns the count of unread messages for a user.
- `GetRecentConversations(userID int, limit int) ([]map[string]interface{}, error)`: Retrieves recent conversation partners with last message details and unread counts.

**Usage**: Called by WebSocket handlers (via injected function) and REST API handlers for database operations. Used whenever messages need to be stored, retrieved, or updated in the database.

### `internal/models/message.go`

**Purpose**: This file defines the data structures for message-related models used throughout the chat system.

**Data Structures**:
- `PrivateMessage`: Represents a direct message between two users, containing ID, sender/receiver IDs, content, creation time, and read status.

**Methods**:
- None; it's a simple struct.

**Usage**: Used as the core data model for private messages in database operations, API responses, and WebSocket message handling. Instances are created when sending messages and returned when querying the database.
