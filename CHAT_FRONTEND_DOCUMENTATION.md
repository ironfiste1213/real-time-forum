# Real-Time Chat Frontend Implementation

## Overview

This document describes the complete frontend implementation of the real-time chat feature for the Real-Time Forum application. The chat system allows authenticated users to send and receive messages in real-time using WebSocket connections. The implementation focuses on frontend-only functionality (no backend yet), with a comprehensive WebSocket client, UI components, and integration with the existing SPA architecture.

## Architecture Overview

The chat system consists of three main components:

1. **WebSocket Client** (`public/js/ws.js`): Handles WebSocket connection management, message sending/receiving, and state management
2. **Chat UI Components** (`public/js/ui/chat.js`): Manages the chat panel UI, event handlers, and user interactions
3. **Navigation Integration** (`public/js/ui/views.js`): Adds chat toggle button to the main navigation

### Key Features Implemented

- Real-time WebSocket connection with authentication
- Message sending and receiving
- Online user list display
- Connection status indicators
- Chat panel toggle (open/close)
- Message history (limited to 100 messages)
- Automatic reconnection with exponential backoff
- Integration with existing auth system

## File Descriptions

### 1. `public/js/ws.js` - WebSocket Client Class

This file contains the `ChatWebSocket` class, a comprehensive WebSocket client for real-time chat functionality.

#### Class Structure

```javascript
class ChatWebSocket {
    constructor() {
        // State management
        this.ws = null;
        this.isConnected = false;
        this.connectionStatus = 'disconnected';
        this.messages = [];
        this.onlineUsers = [];
        this.messageIdCounter = 0;
        this.isChatOpen = false;

        // Reconnection logic
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000; // Start with 1 second
        this.maxReconnectDelay = 30000; // Max 30 seconds
    }
}
```

#### Key Methods

**Connection Management:**
- `connect()`: Establishes WebSocket connection with session token authentication
- `disconnect()`: Properly closes connection with normal closure code
- `attemptReconnection()`: Handles reconnection with exponential backoff (1s, 2s, 4s, 8s, 16s, max 30s)

**Message Handling:**
- `send(message)`: Generic method to send JSON messages to server
- `sendJoinMessage()`, `sendLeaveMessage()`, `sendChatMessage(content)`: Specific message types
- `handleMessage(event)`: Routes incoming messages by type (message, user_joined, user_left, online_users)
- `handleChatMessage(data)`, `handleUserJoined(data)`, etc.: Process specific message types

**State Management:**
- `messages`: Array of chat messages (limited to 100)
- `onlineUsers`: Current online users list
- `addSystemMessage(content)`: For join/leave notifications
- `limitMessages()`: Keeps only last 100 messages

**UI Integration:**
- `renderMessages()`: Updates chat messages display with timestamps and user info
- `renderOnlineUsers()`: Updates online users list
- `updateConnectionStatus(status)`: Shows connection state (connecting/connected/disconnected/error)
- `scrollToBottom()`: Auto-scroll to latest messages
- `toggleChat()`: Show/hide chat panel

**Authentication Integration:**
- `getCurrentUser()`: Gets user from localStorage (matches auth.js)
- `getSessionToken()`: Gets session cookie for WebSocket auth
- `getCookie(name)`: Utility to read cookies

#### Export
```javascript
export default new ChatWebSocket(); // Singleton instance
```

### 2. `public/js/ui/chat.js` - Chat UI Components

This file handles the chat panel UI, event listeners, and integration functions.

#### Key Functions

**Initialization:**
- `initializeChatUI()`: Sets up chat panel and event listeners on DOM load
- `createChatPanel()`: Creates the HTML structure for the chat panel

**HTML Structure:**
```html
<div id="chat-panel" class="chat-panel">
    <div class="chat-header">
        <h3>Chat</h3>
        <button id="chat-close-btn" class="chat-close-btn">×</button>
    </div>
    <div class="chat-connection-status">
        <span id="chat-connection-status" class="connection-status disconnected">Disconnected</span>
    </div>
    <div id="chat-messages" class="chat-messages">
        <!-- Messages rendered here -->
    </div>
    <div id="chat-online-users" class="chat-online-users">
        Online: (connecting...)
    </div>
    <form id="chat-form" class="chat-form">
        <input type="text" id="chat-input" placeholder="Type a message..." maxlength="500" required>
        <button type="submit">Send</button>
    </form>
</div>
```

**Event Handlers:**
- `setupChatEventListeners()`: Attaches all event listeners
- `handleChatSubmit()`: Processes message form submission
- Enter key support for sending messages
- Window beforeunload: Disconnects WebSocket on page close

**Integration Functions:**
- `initializeChatConnection()`: Called from auth.js on login success
- `disconnectChat()`: Called from logout handler
- `showChat()`, `hideChat()`: Programmatic panel control
- `getChatStatus()`: Returns current connection and chat state

### 3. `public/js/ui/views.js` - Navigation Integration

Modified to include the chat toggle button in the main navigation.

#### Changes Made

**Added Import:**
```javascript
import chatWS from "../ws.js";
```

**Navigation Creation:**
```javascript
// Chat toggle button
const chatToggleButton = document.createElement('button');
chatToggleButton.id = 'chat-toggle-btn';
chatToggleButton.textContent = 'Chat';
chatToggleButton.className = 'chat-toggle-btn';
nav.appendChild(chatToggleButton);
```

**Event Handler:**
```javascript
if (chatToggleBtn) {
    chatToggleBtn.addEventListener('click', () => {
        chatWS.toggleChat();
    });
}
```

## Integration Points

### With Authentication System

- **Login Success**: `initializeChatConnection()` is called from auth.js to establish WebSocket connection
- **Logout**: `disconnectChat()` is called to properly close connection and send leave message
- **Session Token**: WebSocket connection includes session cookie for authentication

### With Existing UI

- **Navigation**: Chat toggle button added to main nav bar
- **Views**: Chat panel overlays on main content (modal-style)
- **Router**: No changes needed as chat is not a route, but an overlay

### Message Types

The system supports these WebSocket message types:

**Outgoing Messages:**
- `join`: User joining chat
- `leave`: User leaving chat
- `chat_message`: Regular chat message

**Incoming Messages:**
- `message`: New chat message from another user
- `user_joined`: Notification when user joins
- `user_left`: Notification when user leaves
- `online_users`: List of currently online users

## Usage

1. **User logs in**: WebSocket connection automatically establishes
2. **Click "Chat" button**: Opens chat panel
3. **Send messages**: Type in input field and press Enter or click Send
4. **View messages**: Messages appear in real-time with timestamps
5. **See online users**: List updates automatically
6. **Connection status**: Shows current connection state
7. **Close chat**: Click × or toggle button again

## Current Limitations

- Backend not implemented yet (messages won't be received/sent to other users)
- No message persistence (messages lost on page refresh)
- No private messaging
- No message history beyond current session
- No typing indicators
- No file/image sharing

## Next Steps

The backend implementation would include:
- WebSocket server in Go (`internal/ws/`)
- Message broadcasting hub
- User session management
- Message validation and storage
- `/ws` route in `internal/http/routes.go`

This frontend implementation provides a solid foundation for real-time chat functionality once the backend is connected.
