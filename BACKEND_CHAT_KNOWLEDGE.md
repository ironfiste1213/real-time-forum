# Backend Chat Knowledge Base

## Overview
This document provides comprehensive knowledge about implementing a real-time chat backend using Go and WebSockets. It covers all the concepts, technologies, and best practices needed to build a production-ready private messaging system.

## Core Concepts

### WebSocket Protocol

**What is WebSocket?**
- Full-duplex communication protocol over a single TCP connection
- Starts with HTTP handshake, then upgrades to WebSocket protocol
- Enables real-time, bidirectional communication between client and server
- More efficient than HTTP polling for real-time features

**WebSocket vs HTTP:**
```
HTTP Request/Response:
Client → Server: Request
Server → Client: Response
Connection closes

WebSocket:
Client → Server: Initial HTTP request
Server → Client: HTTP 101 Switching Protocols
Connection stays open for bidirectional communication
```

**WebSocket Lifecycle:**
1. **Handshake**: HTTP request with `Upgrade: websocket` header
2. **Connection**: Protocol switches to WebSocket
3. **Communication**: Frames sent bidirectionally
4. **Closure**: Either side can close with close frame

### Go Concurrency with Goroutines and Channels

**Goroutines:**
- Lightweight threads managed by Go runtime
- Created with `go` keyword: `go myFunction()`
- Much cheaper than OS threads (thousands vs hundreds)
- Communicate via channels, not shared memory

**Channels:**
- Typed conduits for goroutine communication
- Created with `make()`: `ch := make(chan int)`
- Blocking by default: send waits for receiver, receive waits for sender
- Can be buffered: `ch := make(chan int, 10)` (non-blocking until buffer full)

**Select Statement:**
- Multiplexes channel operations
- Like switch statement for channels
- Enables handling multiple concurrent operations

```go
select {
case msg := <-channel1:
    // Handle message from channel1
case msg := <-channel2:
    // Handle message from channel2
case <-time.After(time.Second):
    // Timeout after 1 second
}
```

### Hub Pattern for WebSocket Management

**What is a Hub?**
- Central coordinator for WebSocket connections
- Manages client registration, unregistration, and message routing
- Uses channels for thread-safe communication
- Single source of truth for online users and message distribution

**Hub Responsibilities:**
- Track all connected clients
- Route private messages to specific recipients
- Broadcast system messages (user online/offline)
- Handle client lifecycle (connect/disconnect)
- Provide thread-safe access to client data

## Technologies and Libraries

### Gorilla WebSocket

**Installation:**
```bash
go get github.com/gorilla/websocket
```

**Key Components:**
- `websocket.Upgrader`: Converts HTTP to WebSocket connections
- `websocket.Conn`: Represents WebSocket connection
- JSON marshaling support built-in

**Basic Usage:**
```go
// 1. Create upgrader
upgrader := websocket.Upgrader{
    CheckOrigin: func(r *http.Request) bool {
        return true // Allow all origins (development)
    },
}

// 2. Upgrade HTTP connection
conn, err := upgrader.Upgrade(w, r, nil)
if err != nil {
    log.Println("Upgrade failed:", err)
    return
}

// 3. Use connection
for {
    messageType, data, err := conn.ReadMessage()
    if err != nil {
        break
    }
    // Handle message
}
```

### Database Design for Chat

**Private Messages Table:**
```sql
CREATE TABLE private_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX idx_private_messages_sender ON private_messages(sender_id);
CREATE INDEX idx_private_messages_receiver ON private_messages(receiver_id);
CREATE INDEX idx_private_messages_created_at ON private_messages(created_at);
CREATE INDEX idx_private_messages_conversation ON private_messages(sender_id, receiver_id, created_at);
```

**Query Patterns:**
- **Conversation retrieval**: Messages between two users, ordered by time
- **Unread count**: Count messages where receiver_id = user AND is_read = FALSE
- **Recent conversations**: Latest message per conversation partner
- **Message history**: Paginated messages with offset/limit

### Session Management

**Cookie-based Sessions:**
- Session token stored in HTTP-only cookie
- Server validates token on each request
- User data retrieved from database using session token

**WebSocket Authentication:**
- Extract session cookie from initial HTTP request
- Validate session before upgrading to WebSocket
- Associate WebSocket connection with authenticated user

## Architecture Patterns

### Client-Server Architecture

```
[Web Browser] ←WebSocket→ [Go Server]
       │                           │
       │                           │
    [Chat UI]                   [WebSocket Handler]
                                   │
                                   ▼
                             [Hub (Coordinator)]
                             ┌───┬───┬───┐
                             │   │   │   │
                           [Client A] [Client B] [Client C]
```

**Components:**
- **WebSocket Handler**: Manages HTTP→WebSocket upgrade and authentication
- **Hub**: Central coordinator managing all clients and message routing
- **Client**: Represents individual user connection with read/write pumps

### Message Flow Architecture

**Private Message Flow:**
1. User A sends message to User B
2. Client A's readPump receives message
3. Message routed to Hub via PrivateMessage channel
4. Hub looks up User B's client in Users map
5. Message sent to User B's send channel
6. User B's writePump sends message to browser

**Broadcast Flow:**
1. User comes online/offline
2. Hub broadcasts to all connected clients
3. Each client's writePump sends update
4. All browsers update online status

### Thread Safety Patterns

**Channel-based Communication:**
- All hub operations use channels
- No shared memory between goroutines
- Eliminates race conditions
- Makes concurrent programming safer

**Mutex for Shared State:**
- RWMutex for Users map access
- Read locks for lookups, write locks for modifications
- Protects against concurrent map access

```go
type Hub struct {
    mu   sync.RWMutex
    users map[int]*Client
}

func (h *Hub) addUser(userID int, client *Client) {
    h.mu.Lock()
    h.users[userID] = client
    h.mu.Unlock()
}

func (h *Hub) getUser(userID int) (*Client, bool) {
    h.mu.RLock()
    client, exists := h.users[userID]
    h.mu.RUnlock()
    return client, exists
}
```

## Implementation Details

### Message Types and Events

**System Messages:**
```go
const (
    JoinMessage     MessageType = "join"
    LeaveMessage    MessageType = "leave"
    UserOnline      MessageType = "user_online"
    UserOffline     MessageType = "user_offline"
    OnlineUsers     MessageType = "online_users"
)
```

**Private Messaging:**
```go
const (
    PrivateMessage    MessageType = "private_message"
    LoadHistory       MessageType = "load_history"
    HistoryLoaded     MessageType = "history_loaded"
    MessageDelivered  MessageType = "message_delivered"
    MessageFailed     MessageType = "message_failed"
)
```

**Message Structure:**
```go
type Message struct {
    Type        MessageType `json:"type"`
    Content     string      `json:"content,omitempty"`
    FromUserID  int         `json:"from_user_id,omitempty"`
    ToUserID    int         `json:"to_user_id,omitempty"`
    Nickname    string      `json:"nickname,omitempty"`
    Timestamp   string      `json:"timestamp,omitempty"`
    MessageID   int         `json:"message_id,omitempty"`
}
```

### Connection Management

**Read Pump (Receiving Messages):**
- Reads messages from WebSocket connection
- Parses JSON messages
- Validates message format
- Routes to appropriate hub channel
- Handles connection errors and cleanup

**Write Pump (Sending Messages):**
- Sends messages from send channel to WebSocket
- Implements ping/pong for connection keepalive
- Handles write timeouts
- Cleans up on errors

**Keepalive Mechanism:**
- Server sends ping frames every 54 seconds
- Client responds with pong within 60 seconds
- Connection closed if no pong received
- Prevents idle connection timeouts

### Error Handling Patterns

**Graceful Degradation:**
- Log errors but don't crash server
- Close problematic connections
- Continue serving other clients
- Implement circuit breakers for database failures

**Validation:**
- Check message format before processing
- Validate user permissions
- Sanitize message content
- Rate limit message sending

### Performance Considerations

**Memory Management:**
- Limit message history in memory
- Clean up disconnected clients promptly
- Use buffered channels to prevent blocking
- Implement connection limits

**Database Optimization:**
- Use prepared statements
- Add appropriate indexes
- Implement connection pooling
- Cache frequently accessed data

**Scalability:**
- Single hub can handle thousands of connections
- For higher scale, consider multiple hubs with Redis pub/sub
- Implement horizontal scaling with load balancers

## Security Considerations

### Authentication
- Validate session tokens on WebSocket upgrade
- Use secure, HttpOnly cookies for session storage
- Implement session expiration
- Prevent session hijacking

### Input Validation
- Sanitize message content to prevent XSS
- Validate message length limits
- Check user IDs exist in database
- Prevent self-messaging if desired

### Rate Limiting
- Limit messages per user per minute
- Implement exponential backoff for violations
- Use Redis or in-memory cache for rate limit tracking
- Apply limits at both client and server

### Origin Checking
```go
upgrader := websocket.Upgrader{
    CheckOrigin: func(r *http.Request) bool {
        origin := r.Header.Get("Origin")
        allowedOrigins := []string{
            "https://yourdomain.com",
            "https://www.yourdomain.com",
        }
        for _, allowed := range allowedOrigins {
            if origin == allowed {
                return true
            }
        }
        return false
    },
}
```

## Production Deployment

### Environment Configuration
- Use environment variables for configuration
- Different settings for development/production
- Secure WebSocket origins in production
- Configure appropriate timeouts

### Monitoring and Logging
- Structured logging with request IDs
- Metrics collection (connections, messages, errors)
- Health check endpoints
- Alerting for critical errors

### Load Balancing
- WebSocket connections are sticky (same server)
- Use IP hash or cookie-based routing
- Configure load balancer timeouts appropriately
- Handle server failures gracefully

## Common Pitfalls and Solutions

### Race Conditions
**Problem:** Concurrent access to shared data
**Solution:** Use channels or mutexes for synchronization

### Memory Leaks
**Problem:** Not cleaning up disconnected clients
**Solution:** Proper cleanup in defer statements, remove from maps

### Connection Storms
**Problem:** All clients reconnecting simultaneously
**Solution:** Implement exponential backoff, jitter

### Database Connection Exhaustion
**Problem:** Too many concurrent database connections
**Solution:** Connection pooling, prepared statements

### Message Loss
**Problem:** Messages lost during network issues
**Solution:** Implement message queuing, delivery receipts

## Testing Strategies

### Unit Testing
- Test message validation functions
- Test hub client management
- Test database operations
- Mock WebSocket connections

### Integration Testing
- Test full message flow end-to-end
- Test authentication integration
- Test concurrent user scenarios
- Test reconnection logic

### Load Testing
- Simulate thousands of concurrent connections
- Test message throughput
- Monitor memory and CPU usage
- Test database performance under load

## Future Enhancements

### Advanced Features
- **Typing Indicators:** Real-time typing status
- **Message Reactions:** Emoji reactions to messages
- **File Sharing:** Image and file attachments
- **End-to-End Encryption:** Client-side encryption
- **Push Notifications:** Browser notifications

### Scalability Improvements
- **Redis Pub/Sub:** For cross-server message distribution
- **Message Queues:** For offline message delivery
- **Database Sharding:** For high-volume message storage
- **CDN Integration:** For file sharing

### Monitoring Enhancements
- **Distributed Tracing:** Request tracing across services
- **Metrics Dashboard:** Real-time monitoring
- **Log Aggregation:** Centralized logging
- **Performance Profiling:** CPU and memory profiling

This knowledge base provides the foundation needed to implement a robust, scalable real-time chat backend. Understanding these concepts will help you build a production-ready messaging system that can handle thousands of concurrent users.
