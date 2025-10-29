# WebSocket Real-Time Chat Only

## Frontend Planning Phase
- [x] Define chat features: send/receive messages, user list, connection status
- [x] Plan WebSocket message types: join, leave, chat_message
- [x] Design chat UI: message area, input field, user list, toggle button
- [x] Outline connection management: connect on login, disconnect on logout
- [x] Plan state management for messages and online users
- [x] Define event handlers for messages and UI updates

## Frontend Implementation Phase
- [x] Create WebSocket client in `public/js/ws.js` with vanilla JS
- [x] Implement connection logic (connect, send, receive)
- [x] Add chat UI components in `public/js/ui/chat.js`
- [x] Integrate chat toggle in main navigation
- [x] Add connection status indicator
- [x] Update router to handle chat view
- [x] Test frontend chat functionality

## Backend Planning Phase
- [ ] Design chat server: hub for broadcasting messages
- [ ] Plan user management: join/leave notifications
- [ ] Define message validation and types
- [ ] Outline basic auth for WebSocket (optional)

## Backend Implementation Phase
- [ ] Implement hub in `internal/ws/hub.go`
- [ ] Create client management in `internal/ws/client.go`
- [ ] Add events in `internal/ws/events.go`
- [ ] Add /ws route in `internal/http/routes.go`
- [ ] Test backend chat server

## Integration and Testing Phase
- [ ] Connect frontend to backend
- [ ] Test real-time chat between users
- [ ] Add reconnection logic
- [ ] Error handling and user feedback
- [ ] Multi-user testing
