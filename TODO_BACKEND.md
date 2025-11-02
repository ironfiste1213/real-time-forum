# Backend Chat Implementation TODO List

## Overview
This TODO list provides a comprehensive, step-by-step guide for implementing the complete backend chat system for the Real-Time Forum. The implementation includes WebSocket server, private messaging, user status tracking, message history, and database operations.

## Prerequisites
- [ ] Go 1.19+ installed
- [ ] Gorilla WebSocket library (`go get github.com/gorilla/websocket`)
- [ ] SQLite database with existing user and post tables
- [ ] Existing authentication system with session management
- [ ] Basic HTTP server setup with routing

## Phase 1: Database Schema Setup

### Private Messages Table
- [ ] Create `private_messages` table with columns:
  - `id` INTEGER PRIMARY KEY AUTOINCREMENT
  - `sender_id` INTEGER NOT NULL (FK to users.id)
  - `receiver_id` INTEGER NOT NULL (FK to users.id)
  - `content` TEXT NOT NULL
  - `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
  - `is_read` BOOLEAN DEFAULT FALSE
- [ ] Add foreign key constraints to users table
- [ ] Create indexes on sender_id, receiver_id, and created_at for performance
- [ ] Add composite index on (sender_id, receiver_id, created_at) for conversation queries

### Database Migration
- [ ] Create migration script or SQL file for table creation
- [ ] Test table creation and verify constraints
- [ ] Insert sample data for testing (optional)

## Phase 2: WebSocket Infrastructure

### Message Types and Events
- [ ] Create `internal/ws/events.go` with Message struct and types:
  - JoinMessage, LeaveMessage
  - PrivateMessage, LoadHistory, HistoryLoaded
  - UserOnline, UserOffline, OnlineUsers
  - MessageDelivered, MessageFailed
- [ ] Implement JSON marshaling/unmarshaling for Message struct
- [ ] Add message validation methods
- [ ] Create PrivateMessageData struct for internal routing

### Hub Implementation
- [ ] Create `internal/ws/hub.go` with Hub struct containing:
  - clients map[*Client]bool
  - Register, Unregister channels
  - Broadcast, PrivateMessage channels
  - Users map[int]*Client for user lookup
- [ ] Implement NewHub() constructor
- [ ] Implement Run() method with select loop for channel operations
- [ ] Add registerClient() method with user tracking and online broadcast
- [ ] Add unregisterClient() method with cleanup and offline broadcast
- [ ] Add broadcastMessage() method for system messages
- [ ] Add handlePrivateMessage() method for targeted message routing
- [ ] Add sendOnlineUsersList() method for new client initialization
- [ ] Add sendMessageDelivered() and sendMessageFailed() methods
- [ ] Add thread-safe mutex for concurrent access to Users map

### Client Implementation
- [ ] Create `internal/ws/client.go` with Client struct:
  - conn *websocket.Conn
  - userID int, nickname string
  - send chan []byte
  - hub *Hub reference
- [ ] Implement NewClient() constructor
- [ ] Implement Start() method launching readPump and writePump goroutines
- [ ] Implement readPump() method with message parsing and routing
- [ ] Implement writePump() method with ping/pong keepalive
- [ ] Add message handling methods for different message types
- [ ] Add cleanup logic in defer statements

### WebSocket Handler
- [ ] Create `internal/ws/handler.go` with upgrader configuration
- [ ] Implement HandleWebSocket() function with session validation
- [ ] Add user authentication using existing session system
- [ ] Create client instance and register with hub
- [ ] Start client goroutines
- [ ] Add proper error handling and logging

## Phase 3: HTTP API Endpoints

### Message Handlers
- [ ] Update `internal/http/handler/messages.go`:
  - SendPrivateMessageHandler() - POST /api/messages/send
  - GetPrivateMessagesHandler() - GET /api/messages
  - GetConversationsHandler() - GET /api/conversations
  - GetUnreadCountHandler() - GET /api/messages/unread
- [ ] Add proper authentication middleware to all endpoints
- [ ] Implement input validation and error responses
- [ ] Add rate limiting (future enhancement)

### Repository Layer
- [ ] Update `internal/repo/messages.go`:
  - CreatePrivateMessage() - insert new message
  - GetPrivateMessagesBetweenUsers() - retrieve conversation with pagination
  - MarkMessagesAsRead() - update read status
  - GetUnreadMessageCount() - count unread messages
  - GetRecentConversations() - get conversation list with last messages
- [ ] Add proper error handling and logging
- [ ] Optimize queries with proper indexes
- [ ] Add transaction support for data consistency

### User Status Integration
- [ ] Update `internal/http/handler/users.go`:
  - Modify GetAllUsersHandler() to include online status
  - Add hub integration to check online users
  - Return is_online field in user objects
- [ ] Ensure thread-safe access to hub's online users

## Phase 4: Routing and Integration

### WebSocket Route
- [ ] Update `internal/http/routes.go`:
  - Add WebSocket route: `mux.HandleFunc("/ws", ws.HandleWebSocket)`
  - Initialize hub in init() or main()
  - Start hub.Run() in background goroutine
- [ ] Import ws package in routes.go

### Authentication Integration
- [ ] Ensure WebSocket handler uses existing session validation
- [ ] Verify session token extraction from cookies
- [ ] Test authentication flow end-to-end

## Phase 5: Message History and Pagination

### History Loading
- [ ] Implement LoadHistory message type handling in client
- [ ] Add database query for paginated message history
- [ ] Implement offset-based pagination (MessageID as offset)
- [ ] Add HistoryLoaded response with message array
- [ ] Handle empty history and end-of-history scenarios

### Conversation Management
- [ ] Implement conversation list with last message preview
- [ ] Add unread count per conversation
- [ ] Sort conversations by last message timestamp
- [ ] Optimize queries to avoid N+1 problems

## Phase 6: Real-time Features

### Online Status Broadcasting
- [ ] Broadcast user_online when client connects
- [ ] Broadcast user_offline when client disconnects
- [ ] Update online users list for all connected clients
- [ ] Handle multiple tabs/windows per user (single online status)

### Message Delivery Status
- [ ] Send message_delivered confirmation to sender
- [ ] Send message_failed if recipient offline
- [ ] Implement delivery receipts (optional future feature)
- [ ] Handle offline message queuing (optional future feature)

### Connection Management
- [ ] Implement proper connection cleanup on disconnect
- [ ] Handle unexpected connection closures
- [ ] Add connection health monitoring
- [ ] Implement graceful shutdown

## Phase 7: Security and Validation

### Input Validation
- [ ] Validate message content length (max 500 chars)
- [ ] Sanitize message content (prevent XSS)
- [ ] Validate user IDs exist in database
- [ ] Prevent self-messaging

### Rate Limiting
- [ ] Add rate limiting to message sending (messages per minute)
- [ ] Implement per-user rate limits
- [ ] Add exponential backoff for spam prevention

### Authentication Security
- [ ] Validate session tokens on every WebSocket connection
- [ ] Implement proper session timeout handling
- [ ] Add CSRF protection for HTTP endpoints
- [ ] Secure cookie settings (HttpOnly, Secure, SameSite)

## Phase 8: Testing and Debugging

### Unit Tests
- [ ] Create tests for message validation
- [ ] Test hub client registration/unregistration
- [ ] Test private message routing
- [ ] Test database operations

### Integration Tests
- [ ] Test WebSocket connection establishment
- [ ] Test message sending between users
- [ ] Test online status updates
- [ ] Test message history loading

### Manual Testing
- [ ] Test with multiple browser tabs
- [ ] Test connection recovery after network issues
- [ ] Test concurrent users (10+ connections)
- [ ] Test message delivery to offline users

## Phase 9: Performance Optimization

### Database Optimization
- [ ] Add database indexes for message queries
- [ ] Implement query result caching (Redis optional)
- [ ] Optimize conversation list queries
- [ ] Add database connection pooling

### WebSocket Optimization
- [ ] Implement message compression (optional)
- [ ] Add connection pooling for high concurrency
- [ ] Optimize message broadcasting efficiency
- [ ] Implement horizontal scaling support (future)

### Memory Management
- [ ] Limit message history in memory
- [ ] Implement proper channel buffering
- [ ] Add garbage collection for disconnected clients
- [ ] Monitor memory usage under load

## Phase 10: Production Readiness

### Logging and Monitoring
- [ ] Add structured logging throughout WebSocket code
- [ ] Implement metrics collection (connections, messages, errors)
- [ ] Add health check endpoints
- [ ] Set up log aggregation

### Error Handling
- [ ] Implement graceful error recovery
- [ ] Add circuit breakers for database failures
- [ ] Handle WebSocket connection limits
- [ ] Implement proper error responses

### Deployment Considerations
- [ ] Configure production WebSocket settings (origins, timeouts)
- [ ] Set up load balancing for WebSocket connections
- [ ] Implement database backup strategies
- [ ] Add monitoring and alerting

## Phase 11: Advanced Features (Future)

### Typing Indicators
- [ ] Add typing_start and typing_stop message types
- [ ] Implement typing timeout (3 seconds)
- [ ] Broadcast typing status to conversation participants

### Message Reactions
- [ ] Add message reaction functionality
- [ ] Store reactions in separate table
- [ ] Broadcast reaction updates in real-time

### File Sharing
- [ ] Implement file upload for messages
- [ ] Add file storage and serving
- [ ] Update message structure for attachments

### End-to-End Encryption
- [ ] Implement client-side encryption
- [ ] Add key exchange mechanism
- [ ] Store encrypted messages in database

## Completion Checklist

### Backend Core Features
- [ ] WebSocket server accepts connections
- [ ] Private messages route correctly between users
- [ ] Online status broadcasts work
- [ ] Message history loads with pagination
- [ ] Database operations are efficient
- [ ] Authentication integrates properly
- [ ] Error handling is comprehensive
- [ ] Performance is optimized for 100+ concurrent users

### Testing Verification
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing with real users works
- [ ] No memory leaks under load
- [ ] Database queries are optimized

### Documentation
- [ ] Code is well-commented
- [ ] API endpoints documented
- [ ] WebSocket message types documented
- [ ] Deployment guide created

This TODO list provides a complete roadmap for implementing a production-ready real-time chat backend. Each phase builds upon the previous one, ensuring a solid foundation before adding advanced features.
