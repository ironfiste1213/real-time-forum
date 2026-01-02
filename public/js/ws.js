// WebSocket client for real-time chat


class ChatWebSocket {

    constructor() {
        this.ws = null;
        this.isConnected = false;
        this.connectionStatus = 'disconnected';
        this.onlineUsers = [];
        this.allUsers = []; // All registered users
        this.conversations = []; // Recent conversations
        this.activeConversation = null; // Currently selected conversation
        this.privateMessages = {}; // userId -> messages array
        this.currentUser = null;
        this.reconnectAttempts = 0;
        this.maxReconnectDelay = 30000; // 30 seconds
        this.reconnectDelay = 1000; // Start with 1 second
        this.isChatOpen = false;
        this.messageIdCounter = 0;
        this.pendingOfflineRemovals = new Map();

        this.loadUsersIntervalId = null; // Interval ID for periodic loadAllUsers calls
        this.SortedUserslist = null;

        // Typing indicator state - NEW: Simplified approach
        this.typingUsers = new Map(); // userId -> { nickname, lastTypingTime }
        this.typingCooldown = false; // Prevent typing spam
        this.typingCooldownMs = 1000; // 1 second cooldown between sending typing events
    }

    // Initialize WebSocket connection
    connect(e) {
        // IMPORTANT: Always disconnect any existing connection first
        // This handles page refresh scenarios where the old connection is stale
        if (this.ws) {
            console.log('[ws.js:connect] Disconnecting existing WebSocket connection before creating new one');
            this.ws.close(1000, 'Creating new connection');
            this.ws = null;
            this.isConnected = false;
            this.connectionStatus = 'disconnected';
        }

        this.connectionStatus = 'connecting';
        this.updateConnectionStatus();

        // Get current user from parameter (already checked in session)
        this.currentUser = e;

        if (!this.currentUser) {
            console.error('[ws.js:connect] No user session found, aborting connection');
            return;
        }

        // Simplified connection - use user ID from session for now
        const userId = this.getCurrentUserId(e);

        const wsUrl = `ws://localhost:8083/ws?user_id=${userId}`;
        this.ws = new WebSocket(wsUrl);

        // Load all users list when connecting
        this.loadAllUsers();

        // Load conversations when connecting
        this.loadConversations();
        this.ws.onopen = (event) => {
            this.isConnected = true;
            this.connectionStatus = 'connected';
            this.reconnectAttempts = 0;
            this.reconnectDelay = 1000;
            this.updateConnectionStatus();

            // Send join message
            this.sendJoinMessage();

            // Start periodic loadAllUsers calls every 10 seconds
            this.loadUsersIntervalId = setInterval(() => {
                this.loadAllUsers();
                this.loadConversations();
            }, 5000); // 10 seconds
        };

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type == 'user_online' && !this.allUsers.includes(data.nickname)) {
                    this.loadAllUsers();
                }
                this.handleMessage(data);
            } catch (error) {
                console.error('[ws.js:connect] Error parsing WebSocket message:', error);
            }
        };

        this.ws.onclose = (event) => {
            this.isConnected = false;
            this.connectionStatus = 'disconnected';
            this.updateConnectionStatus();

            // Stop periodic loadAllUsers calls
            if (this.loadUsersIntervalId) {
                clearInterval(this.loadUsersIntervalId);
                this.loadUsersIntervalId = null;
            }

            // Clear all typing indicators on disconnect
            this.clearAllTypingIndicators();

            // Attempt reconnection if not intentional disconnect
            if (event.code !== 1000) { // 1000 = normal closure
                this.attemptReconnection();
            }
        };

        this.ws.onerror = (error) => {
            console.error('[ws.js:connect] WebSocket error:', error);
            this.connectionStatus = 'error';
            this.updateConnectionStatus();
        };
    }

    // Disconnect WebSocket
    disconnect() {
        // Stop periodic loadAllUsers calls
        if (this.loadUsersIntervalId) {
            clearInterval(this.loadUsersIntervalId);
            this.loadUsersIntervalId = null;
        }

        // Clear all typing indicators
        this.clearAllTypingIndicators();
        

        if (this.ws) {
            this.ws.close(1000, 'User disconnected');
            this.ws = null;
        }
        this.isConnected = false;
        this.connectionStatus = 'disconnected';
        this.updateConnectionStatus();
    }

    // Send message to server
    send(type, data = {}) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const message = { type, ...data };
            this.ws.send(JSON.stringify(message));
        } else {
            console.warn('[ws.js:send] WebSocket not connected, cannot send message');
        }
    }

    // Send join message
    sendJoinMessage() {
        this.send('join', { username: this.currentUser.nickname });
    }

    // Send leave message
    sendLeaveMessage() {
        this.send('leave');
    }


    // Handle incoming messages
    handleMessage(data) {
        switch (data.type) {
            case 'user_online':
                this.handleUserOnline(data);
                break;
            case 'user_offline':
                this.handleUserOffline(data.nickname);
                break;
            case 'private_message':
                this.handlePrivateMessage(data);
                break;
            case 'message_delivered':
                this.handleMessageDelivered(data.message_id);
                break;
            case 'message_failed':
                this.handleMessageFailed(data.to_user_id);
                break;
            case 'online_users':
                this.handleOnlineUsers(data);
                break;
            case 'message_from_me':
                this.handleMessageFromMe(data);
                break;
            case 'user_typing':
                this.handleUserTyping(data);
                break;
            case 'user_stopped_typing':
                this.handleUserStoppedTyping(data);
                break;

            default:
                break;
        }
    }

    // ==================== Typing Indicator Methods (NEW APPROACH) ====================

    // Send typing event to the target user (with cooldown to prevent spam)
    sendTyping() {
        if (!this.activeConversation || !this.currentUser) return;

        // Check cooldown to prevent spam
        if (this.typingCooldown) return;

        const toUserId = this.activeConversation.userId;
        if (!toUserId) return;

        this.send('user_typing', {
            to_user_id: toUserId,
            nickname: this.currentUser.nickname
        });

        // Set cooldown to prevent sending too many typing events
        this.typingCooldown = true;
        setTimeout(() => {
            this.typingCooldown = false;
        }, this.typingCooldownMs);
    }

    // Send stopped typing event immediately (called when user submits message or types away)
    sendStoppedTyping() {
        if (!this.activeConversation || !this.currentUser) return;

        const toUserId = this.activeConversation.userId;
        if (!toUserId) return;

        this.send('user_stopped_typing', {
            to_user_id: toUserId,
            nickname: this.currentUser.nickname
        });
    }

    // Handle incoming typing event from another user
    handleUserTyping(data) {
        const fromUserId = data.from_user_id;
        const nickname = data.nickname;

        if (!fromUserId || !nickname) return;

        // Update typing timestamp - backend will handle timeout detection
        this.typingUsers.set(fromUserId, { 
            nickname, 
            lastTypingTime: Date.now() 
        });

        // Update UI based on active conversation
        if (this.activeConversation && this.activeConversation.userId === fromUserId) {
            // User is the active conversation - show animation in chat area
            this.showTypingIndicatorInChat(nickname);
        } else {
            // User is not active - show indicator in users list
            this.showTypingIndicatorInUsersList(fromUserId, nickname);
        }

        this.updateUsersList();
    }

    // Handle stopped typing event from another user (sent by backend when timeout expires)
    handleUserStoppedTyping(data) {
        const fromUserId = data.from_user_id;

        if (!fromUserId) return;

        // Remove from typing users
        this.typingUsers.delete(fromUserId);

        // Update UI based on active conversation
        if (this.activeConversation && this.activeConversation.userId === fromUserId) {
            // User is the active conversation - hide animation in chat area
            this.hideTypingIndicatorInChat();
        } else {
            // User is not active - hide indicator in users list
            this.hideTypingIndicatorInUsersList(fromUserId);
        }

        this.updateUsersList();
    }

    // Show typing indicator in the chat messages area
    showTypingIndicatorInChat(nickname) {
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) return;

        // Remove existing typing indicator
        this.hideTypingIndicatorInChat();

        // Create typing indicator element
        const typingIndicator = document.createElement('div');
        typingIndicator.id = 'typing-indicator';
        typingIndicator.className = 'typing-indicator';
        typingIndicator.innerHTML = '<span class="typing-name">' + nickname + '</span><span class="typing-dots"><span class="dot"></span><span class="dot"></span><span class="dot"></span></span>';

        messagesContainer.appendChild(typingIndicator);
        //this.scrollToBottom();
    }

    // Hide typing indicator in the chat messages area
    hideTypingIndicatorInChat() {
        const existingIndicator = document.getElementById('typing-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }
    }

    // Show typing indicator in the users list
    showTypingIndicatorInUsersList(userId, nickname) {
        const userElement = document.querySelector('.chat-user[data-user-id="' + userId + '"]');
        if (!userElement) return;

        // Remove existing indicator
        this.hideTypingIndicatorInUsersList(userId);

        // Add typing class
        userElement.classList.add('typing');

        // Add typing indicator icon
        const indicator = document.createElement('span');
        indicator.className = 'user-typing-indicator';
        indicator.innerHTML = '•';
        indicator.title = nickname + ' is typing...';
        userElement.appendChild(indicator);
    }

    // Hide typing indicator in the users list
    hideTypingIndicatorInUsersList(userId) {
        const userElement = document.querySelector('.chat-user[data-user-id="' + userId + '"]');
        if (!userElement) return;

        userElement.classList.remove('typing');

        const indicator = userElement.querySelector('.user-typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    // Clear all typing indicators (on disconnect, conversation change, etc.)
    clearAllTypingIndicators() {
        // Clear typing users map
        this.typingUsers.clear();

        // Hide typing indicator in chat
        this.hideTypingIndicatorInChat();

        // Hide all typing indicators in users list
        document.querySelectorAll('.chat-user.typing').forEach(el => {
            el.classList.remove('typing');
            const indicator = el.querySelector('.user-typing-indicator');
            if (indicator) indicator.remove();
        });
    }

    // Handle local input typing - called on each key event
    handleLocalTyping() {
        if (!this.activeConversation) return;
        // Immediately send typing event (cooldown handled internally)
        this.sendTyping();
    }

    // Handle local input - called when user sends message or types away
    handleLocalInput() {
        // Immediately send stopped typing event
        this.sendStoppedTyping();
    }

    // ==================== End Typing Indicator Methods ====================



  handleUserOnline(data) {
    const nickname = data.nickname;

    if (!nickname) {
        return;
    }

    // --- CANCEL PENDING OFFLINE REMOVAL ---
    if (this.pendingOfflineRemovals?.has(nickname)) {
        clearTimeout(this.pendingOfflineRemovals.get(nickname));
        this.pendingOfflineRemovals.delete(nickname);
    }

    // --- ADD USER IF NOT ALREADY ONLINE ---
    if (!this.onlineUsers.includes(nickname)) {
        this.onlineUsers.push(nickname);
        this.updateUsersList(); // Update the users list to reflect online status

        // Show notification if chat not open and it's not the current user
        if (nickname !== this.currentUser?.nickname && !this.isChatOpen) {
            this.showOnlineNotification(nickname);
        }
    }

    // --- UPDATE CHAT MODE IF THIS USER IS IN ACTIVE CONVERSATION ---
    if (this.activeConversation && nickname === this.activeConversation.nickname) {
        this.updateChatMode('private');
    }
}


    // Handle user offline
   handleUserOffline(nickname) {
    if (!nickname) {
        return;
    }

    // If already waiting for removal, do nothing
    if (this.pendingOfflineRemovals.has(nickname)) {
        return;
    }

    const timeoutId = setTimeout(() => {
        this.onlineUsers = this.onlineUsers.filter(user => user !== nickname);
        this.updateUsersList();

        if ( this.activeConversation && nickname === this.activeConversation.nickname ) {
            this.updateChatMode('private');
        }

        // Cleanup
        this.pendingOfflineRemovals.delete(nickname);
    }, 5000);

    // Store timeout so we can cancel it if user reconnects
    this.pendingOfflineRemovals.set(nickname, timeoutId);
}


    // Handle incoming private message
    handlePrivateMessage(data) {
        const fromUserId = data.from_user_id;

        // Check if this message is already in our local state to prevent duplicates
        if (this.privateMessages[fromUserId]) {
            const existingMessage = this.privateMessages[fromUserId].find(msg =>
                msg.content === data.content &&
                msg.sender_id === fromUserId &&
                Math.abs(new Date(msg.created_at) - new Date(data.timestamp || new Date())) < 1000 // Within 1 second
            );
            if (existingMessage) {
                // return;
            }
        }

        const message = {
            sender_id: fromUserId,
            receiver_id: this.currentUser.id,
            content: data.content,
            created_at: data.timestamp || new Date().toISOString(),
            is_read: false,
            id: data.id // Include database ID if available
        };

        // Store the message
        if (!this.privateMessages[fromUserId]) {
            this.privateMessages[fromUserId] = [];
        }
        this.privateMessages[fromUserId].push(message);

        // Move user to top and update unread count
        this.moveUserToTop(fromUserId);

        // Update users list to reflect changes
        this.updateUsersList();

        // If this conversation is active, display it immediately
        if (this.activeConversation && this.activeConversation.userId === fromUserId) {
            this.displayPrivateMessages(fromUserId);
        }

        // Hide typing indicator when receiving a message
        this.handleUserStoppedTyping({ from_user_id: fromUserId });

        // Update conversations list to show new message
        this.loadConversations();
    }

    // Handle message delivered confirmation
    handleMessageDelivered(messageId) {
        // Could add visual confirmation here if needed
    }

    // Handle message delivery failure
    handleMessageFailed(receiverId) {
        // Could show error notification to user
    }

    // Handle online users list
    handleOnlineUsers(data) {
        try {
            // Parse the content as JSON array
            const onlineUsersList = JSON.parse(data.content || '[]');

            // Update the online users array
            this.onlineUsers = onlineUsersList;

            // Update the UI to reflect the new online users
            this.updateUsersList();
        } catch (error) {
            console.error('[ws.js:handleOnlineUsers] Error parsing online users data:', error);
        }
    }

    // Handle message from me (sent from another connection)
    handleMessageFromMe(data) {
        const toUserId = data.to_user_id;

        // Check if we are in conversation with the recipient
        if (this.activeConversation && this.activeConversation.userId === toUserId) {
            const message = {
                sender_id: this.currentUser.id,
                receiver_id: toUserId,
                content: data.content,
                created_at: data.timestamp || new Date().toISOString(),
                is_read: false,
                id: data.id, // Include database ID if available
                source: 'message_from_me' // Mark the source for debugging
            };

            // Store the message
            if (!this.privateMessages[toUserId]) {
                this.privateMessages[toUserId] = [];
            }
            this.privateMessages[toUserId].push(message);

            // Display the message in the active conversation
            this.displayPrivateMessages(toUserId);
        }
    }




    // Attempt reconnection with exponential backoff
    attemptReconnection() {
        if (this.reconnectAttempts >= 5) {
            return;
        }

        this.reconnectAttempts++;

        setTimeout(() => {
            this.connect();
        }, this.reconnectDelay);

        // Exponential backoff
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
    }


    // Get current user ID from session
    getCurrentUserId(e) {
        //   const user =  checkSession();
        if (e && e.id) {
            return e.id;
        }
        console.error('[ws.js:getCurrentUserId] No user ID found in session');
        return null;
    }


    // Load all users from API
    async loadAllUsers() {
        try {
            const response = await fetch('/api/users', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'same-origin' // Include session cookies
            });

            if (response.ok) {
                const users = await response.json();
                this.allUsers = users.filter(user => user && typeof user.id === 'number' && typeof user.nickname === 'string');
            } else {
                const errorText = await response.text();
            }
        } catch (error) {
            console.error('[ws.js:loadAllUsers] Error loading users:', error);
        }
    }

    // Build a map of unread counts per user from conversations
    getUnreadMap() {
        const map = {};
        if (Array.isArray(this.conversations)) {
            this.conversations.forEach(c => {
                if (c && typeof c.user_id !== 'undefined') {
                    map[parseInt(c.user_id)] = c.unread_count || 0;
                }
            });
        }
        return map;
    }

    // Update users list in UI
    updateUsersList() {
        const usersListElement = document.getElementById('chat-users-list');
        if (!usersListElement) return;

        // Clear existing list
        usersListElement.innerHTML = '';

        if (!this.SortedUserslist || this.SortedUserslist.length === 0) {
            const noUsersElement = document.createElement('div');
            noUsersElement.className = 'no-users';
            noUsersElement.textContent = 'No users found';
            usersListElement.appendChild(noUsersElement);
            return;
        }

        this.SortedUserslist.forEach(user => {
            // Skip current user
            if (user.id === this.currentUser.id) return;

            const userElement = document.createElement('div');
            const isTyping = this.typingUsers.has(user.id);

            userElement.className = 'chat-user' + (this.onlineUsers.includes(user.nickname) ? ' online' : '') + (isTyping ? ' typing' : '');
            userElement.setAttribute('data-user-id', user.id);

            const nicknameSpan = document.createElement('span');
            nicknameSpan.className = 'user-nickname';
            nicknameSpan.textContent = '👤 ' + user.nickname;

            if (user.unread_count > 0 && !isTyping) {
                const userUnread = document.createElement('span');
                userUnread.className = 'user-unread-badge';
                userUnread.textContent = user.unread_count;
                nicknameSpan.appendChild(userUnread);
            }

            userElement.appendChild(nicknameSpan);

            if (isTyping) {
                const typingIndicator = document.createElement('span');
                typingIndicator.className = 'user-typing-indicator';
                typingIndicator.innerHTML = '•';
                typingIndicator.title = user.nickname + ' is typing...';
                userElement.appendChild(typingIndicator);
            }

            const statusSpan = document.createElement('span');
            statusSpan.className = 'user-status ' + (this.onlineUsers.includes(user.nickname) ? 'online' : 'offline');
            statusSpan.textContent = this.onlineUsers.includes(user.nickname) ? 'online' : 'offline';
            userElement.appendChild(statusSpan);

            userElement.addEventListener('click', () => {
                this.startConversation(user.id, user.nickname);
            });

            usersListElement.appendChild(userElement);
        });
    }

    // Start conversation with a user
    startConversation(userId, nickname) {
        // Send stopped typing for previous conversation
      //  this.sendStoppedTyping();

        // Allow starting conversations with any user (online or offline) for history viewing

        // Set active conversation
        this.activeConversation = {
            userId: parseInt(userId),
            nickname,
            offset: 0,
            hasMore: true,
            isLoading: false
        };

        // Reflect name at the top header
        this.updateChatHeaderTitle(nickname);

        // Clear existing messages in UI first
        const messagesContainer = document.getElementById('chat-messages');
        if (messagesContainer) {
            messagesContainer.innerHTML = '';
            // Remove old scroll listener if any (though we usually recreate the element or it's global)
            // We will attach a new one in displayPrivateMessages or here
        }

        // Reset local message cache for this user to ensure fresh start or handle it in loadConversationHistory
        // Actually, we might want to keep cache but for this task let's reset to ensure correct pagination
        this.privateMessages[userId] = [];

        // Always load conversation history so server can mark messages as read
        this.loadConversationHistory(userId);

        // Update UI to show private chat mode (will hide input if user is offline)
        this.updateChatMode('private');



        // Show the chat panel if it's not already open
        if (!this.isChatOpen) {
            this.showChat();
        }
    }

    // Load conversation history from API
    async loadConversationHistory(userId, offset = 0) {
        if (this.activeConversation && this.activeConversation.isLoading) return;

        // If loading more (offset > 0) and we know there's no more, stop.
        if (offset > 0 && this.activeConversation && !this.activeConversation.hasMore) return;

        try {
            if (this.activeConversation) this.activeConversation.isLoading = true;

            const limit = 10; // Load 10 at a time as requested
            // Add timestamp to prevent caching
            const response = await fetch(`/api/messages?user_id=${userId}&limit=${limit}&offset=${offset}&_t=${Date.now()}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'same-origin',
                cache: 'no-store' // Prevent caching
            });

            if (response.ok) {
                const data = await response.json();
                const loadedMessages = data.messages || [];

                if (loadedMessages.length < limit) {
                    if (this.activeConversation) this.activeConversation.hasMore = false;
                }

                // Sort messages chronologically (oldest first)
                loadedMessages.sort((a, b) => {
                    const aTime = a.createdAt || a.created_at;
                    const bTime = b.createdAt || b.created_at;
                    return new Date(aTime) - new Date(bTime);
                });

                if (offset === 0) {
                    // Initial load
                    this.privateMessages[userId] = loadedMessages;
                    this.displayPrivateMessages(userId, true); // true = scroll to bottom
                } else {
                    // Prepend messages
                    this.privateMessages[userId] = [...loadedMessages, ...this.privateMessages[userId]];
                    this.displayPrivateMessages(userId, false, loadedMessages.length); // false = maintain position
                }

                // Refresh conversations to update unread counts (since server marked messages as read)
                if (offset === 0) this.loadConversations();
            } else {
                const errorText = await response.text();
                console.error('[ws.js:loadConversationHistory] Failed to load conversation history:', response.status, errorText);
            }
        } catch (error) {
            console.error('[ws.js:loadConversationHistory] Error loading conversation history:', error);
        } finally {
            if (this.activeConversation) this.activeConversation.isLoading = false;
        }
    }

    // Display private messages for a conversation
    displayPrivateMessages(userId, scrollToBottom = true, newMessagesCount = 0) {
        const messages = this.privateMessages[userId] || [];
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) return;

        // Save scroll position if we are prepending
        let oldScrollHeight = 0;
        if (!scrollToBottom) {
            oldScrollHeight = messagesContainer.scrollHeight;
        }

        // Clear existing messages
        messagesContainer.innerHTML = '';

        // Update chat header title to other user's nickname if available
        const conversation = this.activeConversation;
        if (conversation) {
            this.updateChatHeaderTitle(conversation.nickname);
        } else {
            this.updateChatHeaderTitle('Chat');
        }

        // Add loading indicator at top if there are more messages
        if (conversation && conversation.hasMore) {
            const loadingDiv = document.createElement('div');
            loadingDiv.className = 'chat-loading-history';
            loadingDiv.textContent = 'Loading history...';
            loadingDiv.style.textAlign = 'center';
            loadingDiv.style.padding = '10px';
            loadingDiv.style.fontSize = '0.8em';
            loadingDiv.style.color = '#888';
            messagesContainer.appendChild(loadingDiv);

            // Setup intersection observer or scroll listener for infinite scroll
            // We'll use a simple scroll listener on the container
        }

        // Display messages
        messages.forEach((msg, index) => {
            // Handle both camelCase (API) and snake_case (WebSocket) property names
            const senderId = msg.senderId || msg.sender_id;
            const messageElement = document.createElement('div');
            // Safe comparison - ensure both IDs are compared as integers
            const isOwnMessage = this.currentUser && (parseInt(senderId) === parseInt(this.currentUser.id));
            messageElement.className = `chat-message private-message ${isOwnMessage ? 'own-message' : 'other-message'}`;

            const messageSpan = document.createElement('span');
            messageSpan.className = 'message-text';
            messageSpan.textContent = msg.content;
            messageElement.appendChild(messageSpan);

            const timeSpan = document.createElement('span');
            timeSpan.className = 'message-time';
            // Handle both camelCase (API) and snake_case (WebSocket) property names
            const timestamp = msg.createdAt || msg.created_at;
            timeSpan.textContent = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            messageElement.appendChild(timeSpan);

            messagesContainer.appendChild(messageElement);
        });

        // Attach scroll listener if not already attached
        if (!messagesContainer.hasAttribute('data-scroll-listener')) {
            messagesContainer.addEventListener('scroll', () => {
                if (messagesContainer.scrollTop === 0 && this.activeConversation && this.activeConversation.hasMore && !this.activeConversation.isLoading) {
                    this.activeConversation.offset += 10;
                    this.loadConversationHistory(this.activeConversation.userId, this.activeConversation.offset);
                }
            });
            messagesContainer.setAttribute('data-scroll-listener', 'true');
        }

        if (scrollToBottom) {
            this.scrollToBottom();
        } else {
            // Restore scroll position
            const newScrollHeight = messagesContainer.scrollHeight;
            messagesContainer.scrollTop = newScrollHeight - oldScrollHeight;
        }
    }

    // Send private message
    sendPrivateMessage(message) {
        if (!this.activeConversation || !message.trim()) return;

        // Clear typing indicator when sending
        this.handleLocalInput();

        const { userId } = this.activeConversation;

        // Allow sending messages - the backend will handle delivery when user comes online

        // try {
        //     const response = await fetch('/api/messages/send', {
        //         method: 'POST',
        //         headers: {
        //             'Content-Type': 'application/json',
        //         },
        //         credentials: 'same-origin',
        //         body: JSON.stringify({
        //             receiver_id: userId,
        //             content: message.trim()
        //         })
        //     });

        //     if (response.ok) {
        // Add message to local state immediately for better UX
        const newMessage = {
            sender_id: this.currentUser.id,
            receiver_id: userId,
            content: message.trim(),
            created_at: new Date().toISOString(),
            is_read: false,
            // Generate a temporary ID for local tracking
            temp_id: `temp_${Date.now()}_${Math.random()}`
        };

        if (!this.privateMessages[userId]) {
            this.privateMessages[userId] = [];
        }
        chatWS.send('private_message', {
            to_user_id: userId,
            content: message.trim(),
            temp_id: newMessage.temp_id
        });
        //this.privateMessages[userId].push(newMessage);
        //this.displayPrivateMessages(userId);

        // Also send via WebSocket for real-time delivery

        //     } else {
        //         console.error('Failed to send private message:', response.status);
        //         this.showErrorMessage('Failed to send message. Please try again.');
        //     }
        // } catch (error) {
        //     console.error('Error sending private message:', error);
        //     this.showErrorMessage('Network error. Please check your connection.');
        // }
    }

    // Update chat mode (public/private)
    updateChatMode(mode) {
        const chatPanel = document.getElementById('chat-panel');

        // Update chat header title
        const title = mode === 'private' && this.activeConversation ? this.activeConversation.nickname : 'Chat';
        this.updateChatHeaderTitle(title);

        // Update input placeholder
        const chatInput = document.getElementById('chat-input');
        if (chatInput) {
            chatInput.placeholder = mode === 'private' ? 'Type a private message...' : 'Type a message...';
        }

        // Show/hide chat form based on mode and online status
        const chatForm = document.getElementById('chat-form');
        if (chatForm) {
            if (mode === 'private' && this.activeConversation) {
                // In private mode, show form only if the other user is online
                const isOtherUserOnline = this.onlineUsers.includes(this.activeConversation.nickname);
                chatForm.style.display = isOtherUserOnline ? 'flex' : 'none';
            } else {
                // In public mode or no active conversation, hide form
                chatForm.style.display = 'none';
            }
        }

        // Show/hide conversations and users lists based on mode
        const conversationsDiv = document.getElementById('chat-conversations');
        const usersListDiv = document.getElementById('chat-users-list');
        const messagesDiv = document.getElementById('chat-messages');

        if (conversationsDiv) {
            conversationsDiv.style.display = mode === 'public' ? 'block' : 'none';
        }
        if (usersListDiv) {
            usersListDiv.style.display = 'block'; // Always show users list
        }
        if (messagesDiv) {
            messagesDiv.style.display = 'block'; // Always show messages
        }
    }

    // Load conversations from API
    async loadConversations() {
        try {
            const response = await fetch('/api/conversations', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'same-origin'
            });

            if (response.ok) {
                const data = await response.json();
                console.log(data);
                
                const list = data.conversations || [];
                // Deduplicate by user_id (backend may return multiple rows per partner)
                const byUser = {};
                for (const conv of list) {
                    const uid = parseInt(conv.user_id);
                    if (!byUser[uid]) {
                        byUser[uid] = conv;
                    } else {
                        // Keep the one with latest last_message_time if available
                        const a = new Date(byUser[uid].last_message_time || 0).getTime();
                        const b = new Date(conv.last_message_time || 0).getTime();
                        if (b > a) byUser[uid] = conv;
                    }
                }
                this.conversations = Object.values(byUser);
                // Update unread badges in users list and chat button
                this.getSortedUserList();
                this.updateUsersList();
                this.updateChatUnreadUI();
            } else {
                console.error('[ws.js:loadConversations] Failed to load conversations:', response.status);
            }
        } catch (error) {
            console.error('[ws.js:loadConversations] Error loading conversations:', error);
        }
    }

    // Sort conversations by last message time (most recent first)
    sortConversationsByLastMessageTime() {
        this.conversations.sort((a, b) => {
            const aTime = new Date(a.last_message_time || 0).getTime();
            const bTime = new Date(b.last_message_time || 0).getTime();
            return bTime - aTime; // Descending order (most recent first)
        });
    }

    // Get sorted list of users based on conversations and all users
    getSortedUserList() {
        // Sort conversations by last message time
        this.sortConversationsByLastMessageTime();

        // Create a set of user IDs that have conversations
        const conversationUserIds = new Set(this.conversations.map(conv => parseInt(conv.user_id)));

        // Map conversations to user objects
        const conversationUsers = this.conversations.map(conv => ({
            id: parseInt(conv.user_id),
            nickname: conv.nickname,
            unread_count: conv.unread_count || 0
        }));

        // Get users from allUsers not in conversations
        const nonConversationUsers = this.allUsers
            .filter(user => !conversationUserIds.has(parseInt(user.id)))
            .sort((a, b) => (a.nickname || '').localeCompare(b.nickname || ''))
            .map(user => ({
                id: parseInt(user.id),
                nickname: user.nickname,
                unread_count: 0
            }));

        // Combine: conversation users first, then non-conversation users

        this.SortedUserslist = [...conversationUsers, ...nonConversationUsers];
    }

    // Move user to top of sorted list and update unread count
    moveUserToTop(userId, fromus = false) {
        const userIndex = this.SortedUserslist.findIndex(user => parseInt(user.id) === parseInt(userId));
        if (userIndex !== -1) {
            // Increment unread count
            if (!fromus) {
                this.SortedUserslist[userIndex].unread_count = (this.SortedUserslist[userIndex].unread_count || 0) + 1;
            }
            // Move user to the front
            const user = this.SortedUserslist.splice(userIndex, 1)[0];
            this.SortedUserslist.unshift(user);
        }
    }


    // Update connection status in UI
    updateConnectionStatus() {
        const statusElement = document.getElementById('chat-connection-status');
        if (statusElement) {
            statusElement.className = `connection-status ${this.connectionStatus}`;
            statusElement.textContent = this.connectionStatus === 'connected'
                ? 'Online'
                : this.connectionStatus.charAt(0).toUpperCase() + this.connectionStatus.slice(1);
        }
    }

    // Update chat header title text
    updateChatHeaderTitle(title) {
        const titleEl = document.getElementById('chat-title');
        if (titleEl) {
            titleEl.textContent = title ? '👤 ' + title : 'Chat';
        }
    }

    // Update the floating chat button unread badge and title
    updateChatUnreadUI() {
        console.log("[updateChatUnreadUI() has been caled! ]");
        
        try {
            const totalUnread = Array.isArray(this.conversations)
                ? this.conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0)
                : 0;

            const btn = document.getElementById('floating-chat-btn');
            if (!btn) return;

            // Ensure badge element exists
            let badge = btn.querySelector('#chat-unread-badge');
            if (!badge) {
                badge = document.createElement('span');
                badge.id = 'chat-unread-badge';
                badge.className = 'chat-unread-badge';
                btn.appendChild(badge);
            }

            if (totalUnread > 0) {
                badge.textContent = totalUnread > 99 ? '99+' : String(totalUnread);
                badge.style.display = 'inline-flex';
                btn.title = `Open Chat (${totalUnread} unread)`;
            } else {
                badge.textContent = '';
                badge.style.display = 'none';
                btn.title = 'Open Chat';
            }
        } catch (e) {
            console.error('[ws.js:updateChatUnreadUI] updateChatUnreadUI error:', e);
        }
    }



    // Scroll to bottom of messages
    scrollToBottom() {
        const messagesContainer = document.getElementById('chat-messages');
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    // Show chat panel (force open, not toggle)
    showChat() {
        this.isChatOpen = true;
        const chatPanel = document.getElementById('chat-panel');
        const floatingChatBtn = document.getElementById('floating-chat-btn');
        const createPostToggle = document.getElementById('create-post-toggle');

        if (chatPanel) {
            chatPanel.classList.add('open', 'fullscreen');
        }
        if (floatingChatBtn) floatingChatBtn.style.display = 'none';
        if (createPostToggle) {
            createPostToggle.disabled = true;
            createPostToggle.style.opacity = '0.5';
            createPostToggle.style.cursor = 'not-allowed';
        }
    }

    // Toggle chat panel
    toggleChat() {
        this.isChatOpen = !this.isChatOpen;
        const chatPanel = document.getElementById('chat-panel');
        const floatingChatBtn = document.getElementById('floating-chat-btn');
        const createPostToggle = document.getElementById('create-post-toggle');

        if (chatPanel) {
            chatPanel.classList.toggle('open', this.isChatOpen);
            chatPanel.classList.add('fullscreen'); // Always keep fullscreen
        }

        if (this.isChatOpen) {
            if (floatingChatBtn) floatingChatBtn.style.display = 'none';
            if (createPostToggle) {
                createPostToggle.disabled = true;
                createPostToggle.style.opacity = '0.5';
                createPostToggle.style.cursor = 'not-allowed';
            }
        } else {
            if (floatingChatBtn) floatingChatBtn.style.display = 'block';
            if (createPostToggle) {
                createPostToggle.disabled = false;
                createPostToggle.style.opacity = '1';
                createPostToggle.style.cursor = 'pointer';
            }
        }
    }



    // Clear messages (on logout)
    clearMessages() {
        this.onlineUsers = [];
        this.conversations = [];
        this.activeConversation = null;
        this.privateMessages = {};

        this.updateChatMode('public'); // Reset to public mode
    }

    // Close chat panel
    closeChat() {
        this.isChatOpen = false;
        const chatPanel = document.getElementById('chat-panel');
        const floatingChatBtn = document.getElementById('floating-chat-btn');
        const createPostToggle = document.getElementById('create-post-toggle');

        if (chatPanel) {
            chatPanel.classList.remove('open');
        }
        if (floatingChatBtn) floatingChatBtn.style.display = 'block';
        if (createPostToggle) {
            createPostToggle.disabled = false;
            createPostToggle.style.opacity = '1';
            createPostToggle.style.cursor = 'pointer';
        }
    }
    // Show online notification
    showOnlineNotification(nickname) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'online-notification';
        notification.textContent = `${nickname} is now online`;

        // Style the notification
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.backgroundColor = '#4CAF50';
        notification.style.color = 'white';
        notification.style.padding = '12px 16px';
        notification.style.borderRadius = '4px';
        notification.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
        notification.style.zIndex = '10000';
        notification.style.fontSize = '14px';
        notification.style.fontWeight = '500';
        notification.style.maxWidth = '300px';
        notification.style.wordWrap = 'break-word';

        // Add to page
        document.body.appendChild(notification);

        // Auto-remove after 4 seconds with fade out
        setTimeout(() => {
            notification.style.transition = 'opacity 0.5s ease-out';
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 500);
        }, 4000);
    }


    // Mark messages as read for a conversation
    async markMessagesAsRead(userId) {
        try {
            const response = await fetch(`/api/messages/mark-read?user_id=${userId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'same-origin'
            });

            if (response.ok) {
                // Refresh conversations to update unread counts
                this.loadConversations();
            } else {
                console.error('[ws.js:markMessagesAsRead] Failed to mark messages as read:', response.status);
            }
        } catch (error) {
            console.error('[ws.js:markMessagesAsRead] Error marking messages as read:', error);
        }
    }

    // Show error message to user
    showErrorMessage(message) {
        // Create error message element
        const errorElement = document.createElement('div');
        errorElement.className = 'chat-message system error-message';
        errorElement.textContent = message;
        errorElement.style.color = '#f04747';
        errorElement.style.fontWeight = 'bold';

        // Add to messages container
        const messagesContainer = document.getElementById('chat-messages');
        if (messagesContainer) {
            messagesContainer.appendChild(errorElement);
            this.scrollToBottom();

            // Auto-remove after 5 seconds
            setTimeout(() => {
                if (errorElement.parentNode) {
                    errorElement.remove();
                }
            }, 5000);
        }
    }
}

// Export singleton instance
const chatWS = new ChatWebSocket();
export default chatWS;
