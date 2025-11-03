# Real-Time Forum Chat Application Documentation

## 1. Project Overview

This is a real-time forum application with private messaging capabilities. Users can register, login, create posts, and engage in real-time private conversations with other online users through WebSocket connections. The application features a Discord-inspired chat interface with a two-panel layout showing online users and conversation history.

The system consists of a Go backend handling WebSocket connections, message routing, and database operations, paired with a vanilla JavaScript frontend for the user interface and real-time communication.

## 2. Frontend Structure & Logic

### HTML Structure (`public/index.html`)
- **Authentication Container**: Initially visible form for user login/registration
- **Main Container**: Hidden by default, contains the forum feed and navigation
- **Single Post View**: For displaying individual post details
- **404 View**: Error page for invalid routes

### JavaScript Components

#### Chat UI (`public/js/ui/chat.js`)
- **createChatPanel()**: Generates the Discord-style chat interface with:
  - Header with title, back button, and close button
  - Connection status indicator
  - Two-panel layout: 20% users list, 80% conversation area
  - Message input form (hidden until conversation starts)

- **setupChatEventListeners()**: Attaches event handlers for:
  - Chat toggle button (opens/closes chat panel)
  - Back button (returns to public chat from private)
  - Close button (closes chat and restores main view)
  - Message form submission
  - Enter key handling in input field

- **handleChatSubmit()**: Processes message sending:
  - Checks if in private conversation mode
  - Calls appropriate WebSocket method (sendPrivateMessage vs sendChatMessage)

#### WebSocket Client (`public/js/ws.js`)
**ChatWebSocket Class** manages real-time communication:

- **Connection Management**:
  - `connect()`: Establishes WebSocket connection with user authentication
  - `disconnect()`: Closes connection and cleans up
  - Automatic reconnection with exponential backoff

- **Message Handling**:
  - `handleMessage()`: Routes incoming messages by type
  - `send()`: Sends messages to server
  - `sendJoinMessage()` / `sendLeaveMessage()`: User presence notifications

- **Private Messaging**:
  - `startConversation()`: Initiates private chat with user
  - `sendPrivateMessage()`: Sends message via HTTP API + WebSocket
  - `displayPrivateMessages()`: Renders conversation history
  - `loadConversationHistory()`: Fetches message history from API

- **User Management**:
  - `loadAllUsers()`: Fetches user list from API
  - `updateUsersList()`: Updates UI with online/offline status
  - `handleUserOnline/Offline()`: Updates user presence in real-time

- **UI Integration**:
  - `toggleChat()`: Shows/hides chat panel
  - `updateChatMode()`: Switches between public/private chat modes
  - `createConversationBar()`: Creates floating notification bars for new messages

### CSS Styling (`public/css/style.css`)
- **Chat Panel**: Fixed full-screen overlay with Discord-inspired dark theme
- **Two-Panel Layout**: Grid system for users list and messages area
- **Conversation Bars**: Floating notifications for active conversations
- **Responsive Design**: Mobile-friendly layout adjustments
- **Message Styling**: Different styles for own messages, other messages, and system messages

## 3. Backend Structure & Logic

### WebSocket Hub (`internal/ws/hub.go`)
**Hub struct** manages all WebSocket connections:

- **Client Management**:
  - `registerClient()`: Adds new client, broadcasts online status
  - `unregisterClient()`: Removes client, broadcasts offline status
  - Thread-safe operations using RWMutex

- **Message Routing**:
  - `broadcastMessage()`: Sends message to all connected clients
  - `handlePrivateMessage()`: Routes private messages to specific users
  - `sendOnlineUsersList()`: Provides online user list to new clients

- **Delivery Notifications**:
  - `sendMessageDelivered()`: Confirms successful message delivery
  - `sendMessageFailed()`: Notifies sender of delivery failure

### WebSocket Client (`internal/ws/client.go`)
**Client struct** represents individual connections:

- **Connection Lifecycle**:
  - `Start()`: Launches read and write goroutines
  - `readPump()`: Processes incoming messages with ping/pong keepalive
  - `writePump()`: Sends messages to client with timeout handling

- **Message Processing**:
  - Parses JSON messages using `FromJSON()`
  - Validates messages before routing
  - Routes messages to hub based on type (private messages, history requests)

### Message Types (`internal/ws/events.go`)
Defines WebSocket message structure:

- **Message Types**: join, leave, private_message, load_history, user_online, user_offline, etc.
- **Message struct**: Contains type, content, sender/receiver IDs, timestamp
- **Validation**: Ensures required fields are present for each message type

### HTTP Handlers

#### WebSocket Handler (`internal/http/handler/websocket.go`)
- **WebSocket Upgrade**: Upgrades HTTP connection to WebSocket
- **Authentication**: Validates session token before allowing connection
- **Client Registration**: Creates and registers new WebSocket client with hub

#### Message Handlers (`internal/http/handler/messages.go`)
- **SendPrivateMessageHandler**: Stores message in database, triggers real-time delivery
- **GetPrivateMessagesHandler**: Retrieves conversation history between users
- **GetConversationsHandler**: Returns recent conversation partners
- **GetUnreadCountHandler**: Counts unread messages for user

### Database Layer (`internal/repo/messages.go`)
- **CreatePrivateMessage**: Inserts new message into database
- **GetPrivateMessagesBetweenUsers**: Retrieves paginated message history
- **MarkMessagesAsRead**: Updates read status for received messages
- **GetRecentConversations**: Fetches user's conversation partners with last message info
- **GetUnreadMessageCount**: Counts unread messages across all conversations

## 4. Data Flow (Step-by-step)

### User Authentication & Connection
1. User opens application → sees authentication form
2. User registers/logs in → session token stored in cookie
3. Frontend loads main view → calls `initializeChatConnection()`
4. WebSocket connection established: `ws://localhost:8083/ws?user_id={id}`
5. Server validates session token → upgrades to WebSocket
6. Client registered with hub → broadcasts user_online to all clients
7. Hub sends online_users list to new client

### Private Message Sending
1. User clicks online user in users list → `startConversation()` called
2. Frontend switches to private mode → shows chat form
3. User types message → submits form → `handleChatSubmit()` called
4. `sendPrivateMessage()` sends HTTP POST to `/api/messages/send`
5. Message stored in database with `CreatePrivateMessage()`
6. WebSocket sends `private_message` to hub
7. Hub routes message to target user via `handlePrivateMessage()`
8. Target client receives message → `handlePrivateMessage()` displays it
9. Hub sends `message_delivered` confirmation to sender

### Message History Loading
1. User starts conversation → `loadConversationHistory()` called
2. HTTP GET to `/api/messages?user_id={otherUserId}`
3. `GetPrivateMessagesHandler` retrieves messages from database
4. Messages returned as JSON → displayed in chat
5. Messages marked as read via `MarkMessagesAsRead()`

### Real-time Updates
1. User comes online → hub broadcasts `user_online` to all clients
2. All clients update users list → show user as online
3. User goes offline → hub broadcasts `user_offline`
4. Clients update users list → show user as offline

## 5. File/Folder Structure

```
real-time-forum/
├── cmd/server/main.go              # Application entry point
├── internal/
│   ├── auth/                       # Authentication logic
│   │   ├── context.go
│   │   ├── password.go
│   │   ├── session.go
│   │   └── validation.go
│   ├── http/
│   │   ├── handler/                # HTTP request handlers
│   │   │   ├── auth.go
│   │   │   ├── messages.go         # Message API endpoints
│   │   │   ├── posts.go
│   │   │   ├── users.go
│   │   │   ├── websocket.go        # WebSocket upgrade handler
│   │   │   └── responses.go
│   │   ├── middleware.go           # Authentication middleware
│   │   └── routes.go               # Route registration
│   ├── models/                     # Data structures
│   │   ├── message.go              # PrivateMessage model
│   │   ├── post.go
│   │   ├── user.go
│   │   └── register.go
│   ├── repo/                       # Database operations
│   │   ├── db.go
│   │   ├── messages.go             # Message database functions
│   │   ├── posts.go
│   │   └── users.go
│   ├── util/                       # Utilities
│   │   ├── id.go
│   │   └── time.go
│   └── ws/                         # WebSocket implementation
│       ├── client.go               # WebSocket client management
│       ├── events.go               # Message types and structures
│       └── hub.go                  # WebSocket hub and routing
├── public/                         # Static frontend assets
│   ├── css/
│   │   └── style.css               # Application styling
│   ├── js/
│   │   ├── api.js                  # HTTP API client
│   │   ├── app.js                  # Main application logic
│   │   ├── auth.js                 # Authentication UI
│   │   ├── router.js               # Client-side routing
│   │   ├── session.js              # Session management
│   │   ├── state.js                # Application state
│   │   ├── ws.js                   # WebSocket client
│   │   ├── ui/                     # UI components
│   │   │   ├── auth.js
│   │   │   ├── chat.js             # Chat UI logic
│   │   │   ├── feed.js
│   │   │   ├── postDetail.js
│   │   │   ├── posts.js
│   │   │   ├── sidebar.js
│   │   │   └── views.js
│   │   └── utils/                  # Utility functions
│   │       ├── debounce.js
│   │       ├── dom.js
│   │       ├── throttle.js
│   │       └── time.js
│   └── index.html                  # Main HTML template
├── forum.db                        # SQLite database
├── go.mod                          # Go module definition
├── go.sum                          # Go module checksums
├── Makefile                        # Build automation
└── README.md                       # Project documentation
```

## 6. Technologies Used

### Backend
- **Go**: Primary programming language
- **Gorilla WebSocket**: WebSocket protocol implementation
- **SQLite**: Database for persistent storage
- **Standard Library**: HTTP server, JSON handling, concurrency

### Frontend
- **Vanilla JavaScript**: No frameworks, pure JavaScript
- **HTML5**: Semantic markup
- **CSS3**: Modern styling with gradients, animations, responsive design
- **WebSocket API**: Real-time bidirectional communication

### Architecture Patterns
- **Hub and Spoke**: WebSocket hub manages all client connections
- **Observer Pattern**: Clients subscribe to hub for message routing
- **Repository Pattern**: Database operations abstracted into repository layer
- **Middleware Pattern**: Authentication and request processing

### Communication Protocols
- **WebSocket**: Real-time bidirectional messaging
- **REST API**: Traditional HTTP endpoints for data operations
- **JSON**: Data serialization format
- **Session Cookies**: Authentication state management

This documentation provides a comprehensive overview of the real-time forum application's architecture, data flow, and implementation details. The system demonstrates modern web development practices with real-time capabilities through WebSocket connections and a clean separation of concerns between frontend and backend components.
