# Backend Chat System Documentation

## Overview of Chat System
The chat system enables real-time private messaging between users. It uses WebSockets for instant communication and includes features like:
- Real-time message delivery
- Online/offline status tracking
- Message history loading
- Unread message counts
- Conversation management

Key concepts:
- **WebSockets**: Persistent connections for real-time bidirectional communication.
- **Hub**: Central message router that manages all client connections and routes messages.
- **Clients**: Individual WebSocket connections representing logged-in users.
- **Messages**: Private messages stored in database with read status tracking.

The system is split into files for organization:
- `ws/hub.go`: Central hub managing connections and message routing.
- `ws/client.go`: Individual client connection handling.
- `ws/events.go`: Message types and structures.
- `handler/websocket.go`: HTTP handler that upgrades to WebSocket.
- `handler/messages.go`: REST API handlers for messages.
- `repo/messages.go`: Database operations for messages.
- `models/message.go`: Message data structures.

## WebSocket Architecture

### Hub (from `ws/hub.go`)
The hub is the central component that manages all WebSocket connections and routes messages.

**Key components:**
- `clients map[*Client]bool`: All connected clients.
- `Users map[int]*Client`: userID to client mapping for private messaging.
- Channels: `Register`, `Unregister`, `Broadcast`, `PrivateMessage`, `LoadHistory`.

**Run method:**
```go
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
```

**Built-in explanations:**
- `sync.RWMutex`: From `sync` package. Read-write mutex for thread-safe access to maps. `RLock()` for reads, `Lock()` for writes.

### Client (from `ws/client.go`)
Each client represents one user's WebSocket connection.

**Key methods:**
- `Start()`: Launches read and write pumps in goroutines.
- `readPump()`: Reads incoming messages from WebSocket.
- `writePump()`: Writes outgoing messages to WebSocket.

**Read pump:**
```go
for {
    _, data, err := c.conn.ReadMessage()
    if err != nil {
        break
    }
    message, err := FromJSON(data)
    // Route based on type
    switch message.Type {
    case PrivateMessage:
        c.hub.PrivateMessage <- PrivateMessageData{...}
    case LoadHistory:
        c.hub.LoadHistory <- message
    }
}
```

**Built-in explanations:**
- `gorilla/websocket`: External package for WebSocket connections. `ReadMessage()` returns message type and data. `WriteMessage()` sends messages.
- `time.NewTicker`: From `time` package. Creates a ticker that sends current time on channel at intervals. Used for ping/pong keepalive.

### Message Types (from `ws/events.go`)
Defines all possible WebSocket message types and structures.

**Message struct:**
```go
type Message struct {
    Type       MessageType `json:"type"`
    Content    string      `json:"content,omitempty"`
    FromUserID int         `json:"from_user_id,omitempty"`
    ToUserID   int         `json:"to_user_id,omitempty"`
    Nickname   string      `json:"nickname,omitempty"`
    Timestamp  string      `json:"timestamp,omitempty"`
    MessageID  int         `json:"message_id,omitempty"`
    Offset     int         `json:"offset,omitempty"`
}
```

**Built-in explanations:**
- `time.RFC3339`: From `time` package. Standard timestamp format (ISO 8601). `time.Now().Format(time.RFC3339)` creates timestamps.
- `json.Marshal/Unmarshal`: From `encoding/json` package. Convert structs to/from JSON bytes.

## WebSocket Handler (from `handler/websocket.go`)
Upgrades HTTP connections to WebSocket and creates clients.

**Flow:**
```
User connects to /ws
→ Check session cookie
→ Validate session, get user
→ Upgrade to WebSocket
→ Create client, register with hub
→ Start client pumps
```

**Built-in explanations:**
- `websocket.Upgrader`: From gorilla/websocket. Upgrades HTTP to WebSocket. `CheckOrigin` validates origins (security).

## Message Handlers (from `handler/messages.go`)
REST API endpoints for message operations.

### SendPrivateMessageHandler
Creates and stores private messages.

### GetPrivateMessagesHandler
Retrieves message history between users.

**Query parameters:**
- `user_id`: Other user's ID
- `limit`: Max messages (default 20)
- `offset`: Pagination offset

**Built-in explanations:**
- `strconv.Atoi`: From `strconv` package. Converts string to int. Parses query parameters.

### GetConversationsHandler
Gets recent conversation partners.

### GetUnreadCountHandler
Returns unread message count.

## Database Layer (from `repo/messages.go`)

### CreatePrivateMessage
Inserts new message.

### GetPrivateMessagesBetweenUsers
Gets messages between two users with pagination.

**Query:**
```sql
SELECT id, sender_id, receiver_id, content, created_at, is_read
FROM private_messages
WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
ORDER BY created_at DESC
LIMIT ? OFFSET ?
```

**Built-in explanations:**
- Manual reverse: Since ORDER BY DESC gives newest first, but we want chronological, we reverse the slice in Go.

### MarkMessagesAsRead
Updates read status.

### GetUnreadMessageCount
Counts unread messages.

### GetRecentConversations
Gets conversation list with last message and unread counts.

**Complex query with subquery:**
```sql
(SELECT COUNT(*) FROM private_messages WHERE receiver_id = ? AND sender_id = ... AND is_read = FALSE) as unread_count
```

## Message Flow Examples

### Sending Private Message
```
Frontend → WebSocket → Client.readPump → Hub.PrivateMessage → Hub.handlePrivateMessage
→ Check if recipient online → Send to recipient client → Client.writePump → Frontend
Also: Store in DB via REST API
```

### Loading History
```
Frontend → WebSocket → Client.readPump → Hub.LoadHistory → Hub.handleLoadHistory
→ Call injected repo func → Get messages from DB → Send back to requesting client
```

### User Online Status
```
Client connects → Hub.registerClient → Broadcast user_online to all clients
Client disconnects → Hub.unregisterClient → Broadcast user_offline
```

## Real-time Features

### Online Status Tracking
- When client connects: `registerClient` broadcasts "user_online"
- When client disconnects: `unregisterClient` broadcasts "user_offline"
- New clients get current online users list

### Message Delivery
- Messages sent to online users immediately via WebSocket
- Delivery confirmation sent back to sender
- If recipient offline, failure notification sent to sender
- All messages stored in DB regardless

### Keepalive
- Write pump sends ping every 54 seconds
- Read pump expects pong within 60 seconds
- Connection closed if no pong received

## Dependency Injection
To avoid circular imports between ws and repo packages:

```go
// In websocket.go
ws.SetMessageRepo(func(userID1, userID2, limit, offset int) ([]models.PrivateMessage, error) {
    return repo.GetPrivateMessagesBetweenUsers(userID1, userID2, limit, offset)
})
```

This injects the repo function into the ws package.

## Improvements
- Add message encryption for privacy
- Implement message deletion/editing
- Add typing indicators
- Add message reactions
- Add file/image sharing
- Add message search
- Add rate limiting for messages
- Add message expiration
- Add push notifications for offline users
