# TODO: Update Chat Interface to Discord-Style

## Overview
Transform the current sliding chat panel into a Discord-like interface with a floating chat button that transforms the main page into a full-screen chat with two panels: left (20% users list) and right (80% conversation area). Apply dark theme, rounded borders, hover effects, and ensure responsiveness.

## Tasks

### 1. Update public/js/ui/views.js
- [x] Add floating chat button (positioned at right edge, bottom or side).
- [x] Modify showMainFeedView to include the floating button instead of nav button.
- [x] Update chat toggle logic to hide main container and show full-screen chat overlay.
- [x] Ensure chat panel is created and events are set up.

### 2. Update public/js/ui/chat.js
- [x] Restructure createChatPanel for full-screen layout with two panels.
- [x] Left panel (20%): Users list (online/offline, sorted by last message).
- [x] Right panel (80%): Conversation area.
- [x] Modify toggleChat to transform main page (hide main, show chat full-screen).
- [x] Update event handlers for the new layout.
- [x] Ensure back button or close restores main view.

### 3. Update public/css/style.css
- [x] Add styles for floating chat button (fixed position, right edge).
- [x] Add full-screen chat overlay styles (position fixed, full viewport).
- [x] Implement two-panel layout (CSS grid: 20% left, 80% right).
- [x] Apply dark theme: charcoal/dark gray backgrounds, light text, Discord-inspired colors.
- [x] Add rounded borders, smooth hover effects, clean spacing.
- [x] Ensure responsive design (adjust for mobile: stack panels or adjust widths).
- [x] Style users list and conversation area accordingly.

### 4. Ensure Users List Functionality
- [x] Verify users list shows online/offline status.
- [x] Sort by last message (as per README).
- [x] Handle clicking on user to switch conversation in right panel.

### 5. Testing and Verification
- [x] Test layout on different screen sizes.
- [x] Verify WebSocket connections and message sending/receiving.
- [x] Check toggle behavior: button click transforms page, close restores main.
- [x] Ensure no backend logic changes.

## Completion Criteria
- Floating button appears on main page.
- Clicking button hides main content and shows full-screen chat.
- Chat has two panels: users left, conversation right.
- Dark theme applied.
- Responsive and functional.
- Users can only send messages to online users.
- Offline users are visually disabled and show "(Offline)" text.
- Error messages displayed when trying to message offline users.
