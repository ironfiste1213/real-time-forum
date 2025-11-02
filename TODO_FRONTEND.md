# Frontend Chat Implementation TODO List

## Overview
This TODO list provides a comprehensive, step-by-step guide for implementing the complete frontend chat system for the Real-Time Forum. The implementation includes WebSocket client, chat UI components, real-time messaging, user status tracking, and seamless integration with the existing SPA architecture.

## Prerequisites
- [ ] Existing SPA with authentication system
- [ ] Session management with localStorage and cookies
- [ ] Basic HTML/CSS/JS setup with ES6 modules
- [ ] Backend WebSocket server running (see TODO_BACKEND.md)
- [ ] Existing UI components and routing system

## Phase 1: WebSocket Client Setup

### Core WebSocket Class
- [ ] Create `public/js/ws.js` with ChatWebSocket class
- [ ] Implement constructor with connection state management:
  - ws (WebSocket instance)
  - isConnected, connectionStatus
  - currentUser, onlineUsers, conversations
  - reconnectAttempts, reconnectDelay
  - isChatOpen, activeConversation
- [ ] Add singleton export pattern: `export default new ChatWebSocket()`

### Connection Management
- [ ] Implement `connect()` method:
  - Get current user from localStorage
  - Build WebSocket URL with user_id parameter
  - Set up event handlers (onopen, onmessage, onclose, onerror)
  - Handle authentication via session cookies
- [ ] Implement `disconnect()` method with proper closure codes
- [ ] Add `attemptReconnection()` with exponential backoff (1s, 2s, 4s, 8s, 16s, max 30s)
- [ ] Implement connection status updates and UI feedback

### Message Sending
- [ ] Create `send(type, data)` method for WebSocket communication
- [ ] Implement specific message methods:
  - `sendJoinMessage()` - notify server of user joining
  - `sendLeaveMessage()` - notify server of user leaving
  - `sendPrivateMessage(toUserId, content)` - send private message
  - `loadMessageHistory(withUserId, offset)` - request conversation history

## Phase 2: Message Handling and State Management

### Message Routing
- [ ] Implement `handleMessage(event)` as main message router
- [ ] Add specific handlers for each message type:
  - `handlePrivateMessage(data)` - new private message
  - `handleUserOnline(data)` - user came online
  - `handleUserOffline(data)` - user went offline
  - `handleOnlineUsers(data)` - online users list update
  - `handleHistoryLoaded(data)` - conversation history response
  - `handleMessageDelivered(data)` - delivery confirmation
  - `handleMessageFailed(data)` - delivery failure

### Conversation State Management
- [ ] Create conversations Map: `userId -> {messages: [], lastMessage: null, unreadCount: 0}`
- [ ] Implement `addMessageToConversation(userId, message)` method
- [ ] Add `getConversation(userId)` helper method
- [ ] Implement `markConversationAsRead(userId)` for read receipts
- [ ] Add `sortConversations()` by last message timestamp

### User Status Tracking
- [ ] Maintain onlineUsers array with user objects
- [ ] Implement `updateUserStatus(userId, isOnline)` method
- [ ] Add `getUserById(userId)` helper method
- [ ] Implement `loadAllUsers()` from API endpoint
- [ ] Add `updateUsersList()` to sync online status with all users

## Phase 3: Chat UI Components

### HTML Structure Creation
- [ ] Create `public/js/ui/chat.js` for UI components
- [ ] Implement `createChatPanel()` method building:
  - Chat header with title and close button
  - Connection status indicator
  - Messages container (chat-messages)
  - Online users list (chat-users-list)
  - Message input form with send button
- [ ] Add CSS classes for styling hooks

### Event Listeners Setup
- [ ] Implement `setupChatEventListeners()` method:
  - Chat toggle button click handler
  - Chat close button click handler
  - Message form submission handler
  - Enter key handler for message input
  - Window beforeunload handler for cleanup
- [ ] Add input validation and character limits (500 chars max)

### UI State Management
- [ ] Implement `renderMessages()` method:
  - Clear existing messages
  - Render each message with timestamp, username, content
  - Add CSS classes for own messages vs others
  - Handle system messages (user joined/left)
- [ ] Implement `renderOnlineUsers()` method:
  - Display online users list
  - Show user status indicators (online/offline)
  - Add click handlers for starting conversations

## Phase 4: Navigation Integration

### Chat Toggle Button
- [ ] Update `public/js/ui/views.js` to add chat toggle button
- [ ] Add import: `import chatWS from "../ws.js"`
- [ ] Create chat toggle button in navigation creation function
- [ ] Add click event handler calling `chatWS.toggleChat()`
- [ ] Style button appropriately in CSS

### Panel Toggle Functionality
- [ ] Implement `toggleChat()` method in ChatWebSocket class:
  - Toggle isChatOpen boolean
  - Add/remove 'open' CSS class to chat panel
  - Handle initial connection if opening for first time
- [ ] Add `showChat()` and `hideChat()` convenience methods

## Phase 5: Authentication Integration

### Login/Logout Handlers
- [ ] Update `public/js/ui/auth.js` to integrate chat:
  - Call `initializeChatConnection()` on successful login
  - Call `disconnectChat()` on logout
- [ ] Implement `initializeChatConnection()` in chat.js:
  - Establish WebSocket connection
  - Set up initial state
- [ ] Implement `disconnectChat()` in chat.js:
  - Send leave message
  - Close WebSocket connection
  - Clear chat state

### Session Management
- [ ] Implement `getCurrentUser()` method matching auth.js storage
- [ ] Add `getSessionToken()` method reading session cookie
- [ ] Implement `getCookie(name)` utility function
- [ ] Handle session expiration and reconnection

## Phase 6: Message History and Pagination

### History Loading
- [ ] Implement scroll-based history loading:
  - Add scroll event listener to messages container
  - Detect when user scrolls near top
  - Throttle scroll events (100ms)
- [ ] Implement `loadMoreHistory()` method:
  - Check if already loading (loadingHistory flag)
  - Calculate offset from current messages
  - Send load_history message to server
  - Handle loading state in UI

### History Display
- [ ] Update `handleHistoryLoaded(data)` to prepend older messages
- [ ] Maintain scroll position when adding history
- [ ] Add loading indicator during history fetch
- [ ] Handle end-of-history (no more messages to load)

## Phase 7: Real-time Features

### Typing Indicators (Future Enhancement)
- [ ] Add typing timeout management
- [ ] Send typing_start/typing_stop messages
- [ ] Display typing indicators in conversation
- [ ] Clear typing status after timeout

### Message Status Indicators
- [ ] Add delivery status to sent messages:
  - Sending (gray), Sent (check), Delivered (double check)
- [ ] Update message status on delivery confirmations
- [ ] Handle delivery failures with retry option

### Online Status Updates
- [ ] Update user list in real-time as users come online/offline
- [ ] Show online status indicators in conversation headers
- [ ] Handle multiple tabs/windows (single user status)

## Phase 8: UI/UX Enhancements

### Responsive Design
- [ ] Make chat panel responsive for mobile devices
- [ ] Adjust panel size and positioning for different screen sizes
- [ ] Add touch-friendly button sizes and interactions

### Accessibility
- [ ] Add ARIA labels and roles for screen readers
- [ ] Implement keyboard navigation (Tab, Escape to close)
- [ ] Add focus management when opening/closing chat
- [ ] Ensure sufficient color contrast

### Visual Polish
- [ ] Add smooth animations for panel open/close
- [ ] Implement message fade-in animations
- [ ] Add hover effects and visual feedback
- [ ] Style online/offline indicators clearly

## Phase 9: Error Handling and Recovery

### Connection Error Handling
- [ ] Handle WebSocket connection failures gracefully
- [ ] Display user-friendly error messages
- [ ] Implement automatic reconnection with user feedback
- [ ] Handle network interruptions and recovery

### Message Error Handling
- [ ] Handle failed message deliveries
- [ ] Show retry options for failed messages
- [ ] Implement message queuing for offline sending
- [ ] Add timeout handling for message sending

### State Synchronization
- [ ] Handle page refresh state restoration
- [ ] Sync conversation state with server on reconnection
- [ ] Recover from connection interruptions
- [ ] Maintain message history across reconnections

## Phase 10: Performance Optimization

### Memory Management
- [ ] Limit messages stored in memory (last 100 per conversation)
- [ ] Implement message cleanup on conversation switch
- [ ] Clear old conversations from memory
- [ ] Optimize DOM manipulation with document fragments

### Rendering Optimization
- [ ] Implement virtual scrolling for long conversations
- [ ] Debounce rapid UI updates
- [ ] Use efficient DOM queries and caching
- [ ] Minimize reflows and repaints

### Network Optimization
- [ ] Implement message batching (future enhancement)
- [ ] Add connection pooling (if needed)
- [ ] Compress message payloads (future enhancement)
- [ ] Optimize reconnection frequency

## Phase 11: Testing and Debugging

### Unit Testing
- [ ] Test WebSocket connection establishment
- [ ] Test message sending and receiving
- [ ] Test state management functions
- [ ] Test UI rendering methods

### Integration Testing
- [ ] Test end-to-end message flow
- [ ] Test authentication integration
- [ ] Test reconnection scenarios
- [ ] Test multiple user interactions

### Manual Testing Checklist
- [ ] Login/logout flow with chat connection
- [ ] Send/receive messages between users
- [ ] Online status updates
- [ ] Message history loading
- [ ] Connection recovery after network issues
- [ ] Mobile responsiveness
- [ ] Keyboard accessibility

## Phase 12: Advanced Features (Future)

### File Sharing
- [ ] Add file upload functionality
- [ ] Implement drag-and-drop file handling
- [ ] Add file type validation and size limits
- [ ] Display file attachments in messages

### Message Reactions
- [ ] Add emoji reaction picker
- [ ] Store reactions in message metadata
- [ ] Display reaction counts and user lists
- [ ] Broadcast reaction updates in real-time

### Message Search
- [ ] Implement client-side message search
- [ ] Add search highlighting
- [ ] Search across all conversations
- [ ] Add server-side search API (backend)

### Push Notifications
- [ ] Add browser notification API integration
- [ ] Request notification permissions
- [ ] Show notifications for new messages
- [ ] Handle notification settings per user

## Phase 13: CSS Styling

### Chat Panel Styling
- [ ] Create `public/css/chat.css` with comprehensive styles:
  - Chat panel layout and positioning
  - Header styling with close button
  - Connection status indicators
  - Messages container with scrolling
  - Message bubbles and timestamps
  - User list styling
  - Input form and send button
  - Responsive breakpoints

### Theme Integration
- [ ] Match existing forum theme colors
- [ ] Add dark mode support (if implemented)
- [ ] Ensure consistent typography
- [ ] Use CSS custom properties for theming

### Animation and Transitions
- [ ] Add smooth panel slide-in/slide-out animations
- [ ] Message appearance animations
- [ ] Loading state animations
- [ ] Hover and focus state transitions

## Completion Checklist

### Core Functionality
- [ ] WebSocket connection establishes on login
- [ ] Private messages send and receive in real-time
- [ ] Online users list updates automatically
- [ ] Message history loads with pagination
- [ ] Chat panel toggles open/close properly
- [ ] UI is responsive and accessible
- [ ] Error handling is robust
- [ ] Performance is optimized

### User Experience
- [ ] Chat feels responsive and snappy
- [ ] Visual feedback for all interactions
- [ ] Error states are clear and actionable
- [ ] Mobile experience is smooth
- [ ] Accessibility requirements met

### Integration
- [ ] Authentication flow works seamlessly
- [ ] Navigation integration is clean
- [ ] Existing UI components unaffected
- [ ] Session management handles chat state

### Testing
- [ ] Manual testing passes all scenarios
- [ ] Edge cases handled (network issues, multiple tabs)
- [ ] Performance acceptable under load
- [ ] Browser compatibility verified

### Documentation
- [ ] Code is well-commented
- [ ] User-facing features documented
- [ ] API usage examples provided
- [ ] Troubleshooting guide included

This TODO list provides a complete roadmap for implementing a production-ready real-time chat frontend. Each phase builds upon the previous one, ensuring a solid user experience before adding advanced features.
