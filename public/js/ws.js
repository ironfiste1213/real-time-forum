 // WebSocket client for real-time chat
 import { checkSession } from './session.js';


 class ChatWebSocket {
    constructor() {
        this.ws = null;
        this.isConnected = false;
        this.connectionStatus = 'disconnected';
        this.messages = [];
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
    }

    // Initialize WebSocket connection
    connect(e) {
        console.log('[DEBUG] ChatWebSocket.connect called with:', e);
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            console.log('[DEBUG] Already connected, skipping');
            return; // Already connected
        }

        this.connectionStatus = 'connecting';
        this.updateConnectionStatus();

        // Get current user from parameter (already checked in session)
        this.currentUser = e;
        console.log('[DEBUG] Current user set to:', this.currentUser);

        if (!this.currentUser) {
            console.error('[DEBUG] No user session found, aborting connection');
            return;
        }

        // Simplified connection - use user ID from session for now
        const userId = this.getCurrentUserId(e);
        console.log('[DEBUG] User ID for WebSocket:', userId);

        const wsUrl = `ws://localhost:8083/ws?user_id=${userId}`;
        console.log('[DEBUG] Connecting to WebSocket URL:', wsUrl);
        this.ws = new WebSocket(wsUrl);

        // Load all users list when connecting
        console.log('[DEBUG] Calling loadAllUsers');
        this.loadAllUsers();

        // Load conversations when connecting
        console.log('[DEBUG] Calling loadConversations');
        this.loadConversations();

        this.ws.onopen = (event) => {
            console.log('[DEBUG] WebSocket connected successfully');
            this.isConnected = true;
            this.connectionStatus = 'connected';
            this.reconnectAttempts = 0;
            this.reconnectDelay = 1000;
            this.updateConnectionStatus();

            // Send join message
            console.log('[DEBUG] Sending join message');
            this.sendJoinMessage();
        };

        this.ws.onmessage = (event) => {
            console.log('[DEBUG] WebSocket message received:', event.data);
            try {
                const data = JSON.parse(event.data);
                console.log('[DEBUG] Parsed WebSocket message:', data);
                this.handleMessage(data);
            } catch (error) {
                console.error('[DEBUG] Error parsing WebSocket message:', error);
            }
        };

        this.ws.onclose = (event) => {
            console.log('WebSocket disconnected:', event.code, event.reason);
            this.isConnected = false;
            this.connectionStatus = 'disconnected';
            this.updateConnectionStatus();

            // Attempt reconnection if not intentional disconnect
            if (event.code !== 1000) { // 1000 = normal closure
                this.attemptReconnection();
            }
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.connectionStatus = 'error';
            this.updateConnectionStatus();
        };
    }

    // Disconnect WebSocket
    disconnect() {
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
            console.warn('WebSocket not connected, cannot send message');
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

    // Send chat message
    sendChatMessage(message) {
        if (message.trim()) {
            this.send('chat', { message: message.trim() });
        }
    }

    // Handle incoming messages
    handleMessage(data) {
        console.log('[DEBUG] Handling message:', data);
        switch (data.type) {
            case 'message':
                console.log('[DEBUG] Message type: message');
                this.handleChatMessage(data);
                break;
            case 'user_joined':
                console.log('[DEBUG] Message type: user_joined');
                this.handleUserJoined(data.username);
                break;
            case 'user_left':
                console.log('[DEBUG] Message type: user_left');
                this.handleUserLeft(data.username);
                break;
            case 'online_users':
                console.log('[DEBUG] Message type: online_users');
                this.handleOnlineUsers(data.users);
                break;
            case 'user_online':
                console.log('[DEBUG] Message type: user_online');
                this.handleUserOnline(data.nickname);
                break;
            case 'user_offline':
                console.log('[DEBUG] Message type: user_offline');
                this.handleUserOffline(data.nickname);
                break;
            case 'private_message':
                console.log('[DEBUG] Message type: private_message');
                this.handlePrivateMessage(data);
                break;
            case 'message_delivered':
                console.log('[DEBUG] Message type: message_delivered');
                this.handleMessageDelivered(data.message_id);
                break;
            case 'message_failed':
                console.log('[DEBUG] Message type: message_failed');
                this.handleMessageFailed(data.to_user_id);
                break;
            default:
                console.log('[DEBUG] Unknown message type:', data.type);
        }
    }

    // Handle chat message
    handleChatMessage(data) {
        const message = {
            id: this.generateMessageId(),
            username: data.username,
            message: data.message,
            timestamp: data.timestamp || new Date().toLocaleTimeString(),
            type: 'message'
        };
        this.messages.push(message);
        this.limitMessages();
        this.renderMessages();
        this.scrollToBottom();
    }

    // Handle user joined
    handleUserJoined(username) {
        if (!this.onlineUsers.includes(username)) {
            this.onlineUsers.push(username);
            this.renderOnlineUsers();
        }

        // Add system message
        this.addSystemMessage(`${username} joined the chat`);
    }

    // Handle user left
    handleUserLeft(username) {
        this.onlineUsers = this.onlineUsers.filter(user => user !== username);
        this.renderOnlineUsers();

        // Add system message
        this.addSystemMessage(`${username} left the chat`);
    }

    // Handle online users list
    handleOnlineUsers(users) {
        console.log('[DEBUG] handleOnlineUsers called with users:', users);
        this.onlineUsers = users || [];
        console.log('[DEBUG] Set onlineUsers to:', this.onlineUsers);
        this.renderOnlineUsers();
    }

    // Handle user online
    handleUserOnline(nickname) {
        console.log('[DEBUG] handleUserOnline called with nickname:', nickname);
        if (nickname && !this.onlineUsers.includes(nickname)) {
            console.log('[DEBUG] Adding user to online list:', nickname);
            this.onlineUsers.push(nickname);
            this.updateUsersList(); // Update the users list to reflect online status
        } else {
            console.log('[DEBUG] User already online or invalid nickname:', nickname);
        }
    }

    // Handle user offline
    handleUserOffline(nickname) {
        console.log('[DEBUG] handleUserOffline called with nickname:', nickname);
        if (nickname) {
            console.log('[DEBUG] Removing user from online list:', nickname);
            this.onlineUsers = this.onlineUsers.filter(user => user !== nickname);
            this.updateUsersList(); // Update the users list to reflect offline status
        } else {
            console.log('[DEBUG] Invalid nickname for offline:', nickname);
        }
    }

    // Handle incoming private message
    handlePrivateMessage(data) {
        console.log('[DEBUG] handlePrivateMessage called with data:', data);
        const fromUserId = data.from_user_id;
        console.log('[DEBUG] From user ID:', fromUserId);

        // Check if this message is already in our local state to prevent duplicates
        if (this.privateMessages[fromUserId]) {
            const existingMessage = this.privateMessages[fromUserId].find(msg =>
                msg.content === data.content &&
                msg.sender_id === fromUserId &&
                Math.abs(new Date(msg.created_at) - new Date(data.timestamp || new Date())) < 1000 // Within 1 second
            );
            if (existingMessage) {
                console.log('[DEBUG] Duplicate private message detected, ignoring');
                return;
            }
        }

        const message = {
            sender_id: fromUserId,
            receiver_id: this.currentUser.id,
            content: data.content,
            created_at: data.timestamp || new Date().toISOString(),
            is_read: false
        };

        // Store the message
        if (!this.privateMessages[fromUserId]) {
            this.privateMessages[fromUserId] = [];
        }
        this.privateMessages[fromUserId].push(message);
        console.log('[DEBUG] Stored private message');

        // If this conversation is active, display it immediately
        if (this.activeConversation && this.activeConversation.userId === fromUserId) {
            console.log('[DEBUG] Active conversation matches, displaying messages');
            this.displayPrivateMessages(fromUserId);
        }

        // Update conversations list to show new message
        console.log('[DEBUG] Loading conversations after private message');
        this.loadConversations();
    }

    // Handle message delivered confirmation
    handleMessageDelivered(messageId) {
        console.log('Message delivered:', messageId);
        // Could add visual confirmation here if needed
    }

    // Handle message delivery failure
    handleMessageFailed(receiverId) {
        console.error('Message failed to deliver to user:', receiverId);
        // Could show error notification to user
    }

    // Add system message
    addSystemMessage(message) {
        const systemMessage = {
            id: this.generateMessageId(),
            username: 'System',
            message: message,
            timestamp: new Date().toLocaleTimeString(),
            type: 'system'
        };
        this.messages.push(systemMessage);
        this.limitMessages();
        this.renderMessages();
        this.scrollToBottom();
    }

    // Generate unique message ID
    generateMessageId() {
        return `msg_${Date.now()}_${this.messageIdCounter++}`;
    }

    // Limit messages to last 100
    limitMessages() {
        if (this.messages.length > 100) {
            this.messages = this.messages.slice(-100);
        }
    }

    // Attempt reconnection with exponential backoff
    attemptReconnection() {
        if (this.reconnectAttempts >= 5) {
            console.log('Max reconnection attempts reached');
            return;
        }

        this.reconnectAttempts++;
        console.log(`Attempting reconnection ${this.reconnectAttempts}/5 in ${this.reconnectDelay}ms`);

        setTimeout(() => {
            this.connect();
        }, this.reconnectDelay);

        // Exponential backoff
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
    }

    // Get current user from session
    getCurrentUser() {
        // This should match how auth.js stores user data
        const userData = localStorage.getItem('user');
        if (userData) {
            try {
                return JSON.parse(userData);
            } catch (error) {
                console.error('Error parsing user data:', error);
            }
        }
        console.log(userData);
        
        return null;
    }

    // Get current user ID from session
    getCurrentUserId(e) {
     //   const user =  checkSession();
        console.log(e.id);
        
        if (e && e.id) {
            return e.id;
        }
        console.error('No user ID found in session');
        return null;
    }

    // Get session token
    getSessionToken() {
        const token = this.getCookie('session_token');
        console.log('WebSocket getting session token:', token ? 'found' : 'not found');
        return token;
    }

    // Get cookie value
    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }

    // Load all users from API
    async loadAllUsers() {
        try {
            console.log('[DEBUG] Loading all users from API...');
            const response = await fetch('/api/users', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'same-origin' // Include session cookies
            });

            console.log('[DEBUG] Users API response status:', response.status);
            if (response.ok) {
                const users = await response.json();
                console.log('[DEBUG] Loaded users:', users);
                this.allUsers = users; // Store all users
                console.log('[DEBUG] Calling updateUsersList');
                this.updateUsersList(); // Update the UI with online/offline status
            } else {
                const errorText = await response.text();
                console.error('[DEBUG] Failed to load users:', response.status, errorText);
            }
        } catch (error) {
            console.error('[DEBUG] Error loading users:', error);
        }
    }

    // Update users list in UI
    updateUsersList() {
        console.log('[DEBUG] updateUsersList called');

        const usersListElement = document.getElementById('chat-users-list');
        if (!usersListElement) {
            console.log('[DEBUG] chat-users-list element not found');
            return;
        }
        console.log('[DEBUG] Found chat-users-list element');

        // Clear existing list
        while (usersListElement.firstChild) {
            console.log('[DEBUG] Removing child element');
            usersListElement.removeChild(usersListElement.firstChild);
        }
        console.log('[DEBUG] Cleared existing list');

        if (!this.allUsers || this.allUsers.length === 0) {
            console.log('[DEBUG] No users found, showing no users message');
            const noUsersElement = document.createElement('div');
            noUsersElement.className = 'no-users';
            noUsersElement.textContent = 'No users found';
            usersListElement.appendChild(noUsersElement);
            return;
        }

        console.log('[DEBUG] Processing', this.allUsers.length, 'users');

        // Sort users: online first, then alphabetically
        const sortedUsers = this.allUsers.sort((a, b) => {
            console.log('[DEBUG] Sorting user:', a.nickname, 'online:', a.is_online);
            if (a.is_online && !b.is_online) return -1;
            if (!a.is_online && b.is_online) return 1;
            return a.nickname.localeCompare(b.nickname);
        });

        sortedUsers.forEach(user => {
            console.log('[DEBUG] Creating element for user:', user.nickname, 'online:', user.is_online);

            const userElement = document.createElement('div');
            userElement.className = `chat-user ${user.is_online ? 'online' : 'offline'}`;
            userElement.setAttribute('data-user-id', user.id);

            const statusIndicator = document.createElement('span');
            statusIndicator.className = 'user-status';
            statusIndicator.textContent = user.is_online ? '●' : '○';
            userElement.appendChild(statusIndicator);

            const nicknameSpan = document.createElement('span');
            nicknameSpan.className = 'user-nickname';
            nicknameSpan.textContent = user.nickname;
            userElement.appendChild(nicknameSpan);

            // Add click handler to start conversation
            userElement.addEventListener('click', () => {
                console.log('[DEBUG] User clicked:', user.nickname);
                this.startConversation(user.id, user.nickname);
            });

            usersListElement.appendChild(userElement);
            console.log('[DEBUG] Added user element to list');
        });

        console.log('[DEBUG] updateUsersList completed');
    }

    // Start conversation with a user
    startConversation(userId, nickname) {
        console.log(`Starting conversation with ${nickname} (ID: ${userId})`);

        // Set active conversation
        this.activeConversation = { userId: parseInt(userId), nickname };

        // Load conversation history if not already loaded
        if (!this.privateMessages[userId]) {
            this.loadConversationHistory(userId);
        } else {
            // Display existing messages
            this.displayPrivateMessages(userId);
        }

        // Update UI to show private chat mode
        this.updateChatMode('private');

        // Show the chat panel if it's not already open
        if (!this.isChatOpen) {
            this.toggleChat();
        }
    }

    // Load conversation history from API
    async loadConversationHistory(userId) {
        try {
            console.log(`[DEBUG] Loading conversation history with user ${userId}`);
            const response = await fetch(`/api/messages?user_id=${userId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'same-origin'
            });

            console.log('[DEBUG] Conversation history response status:', response.status);
            if (response.ok) {
                const data = await response.json();
                console.log('[DEBUG] Conversation history data:', data);
                this.privateMessages[userId] = data.messages || [];
                console.log('[DEBUG] Set privateMessages for user', userId, 'to:', this.privateMessages[userId]);
                this.displayPrivateMessages(userId);
            } else {
                const errorText = await response.text();
                console.error('[DEBUG] Failed to load conversation history:', response.status, errorText);
                // Still display empty conversation if API fails
                this.privateMessages[userId] = [];
                this.displayPrivateMessages(userId);
            }
        } catch (error) {
            console.error('[DEBUG] Error loading conversation history:', error);
            // Still display empty conversation if API fails
            this.privateMessages[userId] = [];
            this.displayPrivateMessages(userId);
        }
    }

    // Display private messages for a conversation
    displayPrivateMessages(userId) {
        console.log('[DEBUG] displayPrivateMessages called for userId:', userId);
        const messages = this.privateMessages[userId] || [];
        console.log('[DEBUG] Messages for this conversation:', messages);
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) {
            console.log('[DEBUG] chat-messages container not found');
            return;
        }
        console.log('[DEBUG] Found chat-messages container');

        // Clear existing messages
        while (messagesContainer.firstChild) {
            messagesContainer.removeChild(messagesContainer.firstChild);
        }
        console.log('[DEBUG] Cleared existing messages');

        // Add conversation header
        const conversation = this.activeConversation;
        if (conversation) {
            const headerElement = document.createElement('div');
            headerElement.className = 'conversation-header';
            headerElement.textContent = `Private chat with ${conversation.nickname}`;
            messagesContainer.appendChild(headerElement);
            console.log('[DEBUG] Added conversation header:', headerElement.textContent);
        }

        // Display messages
        messages.forEach((msg, index) => {
            console.log('[DEBUG] Displaying message', index, ':', msg);
            const messageElement = document.createElement('div');
            messageElement.className = `chat-message private-message ${msg.sender_id === this.currentUser.id ? 'own-message' : 'other-message'}`;

            const usernameSpan = document.createElement('span');
            usernameSpan.className = 'message-username';
            usernameSpan.textContent = msg.sender_id === this.currentUser.id ? 'You:' : `${conversation.nickname}:`;
            messageElement.appendChild(usernameSpan);

            const messageSpan = document.createElement('span');
            messageSpan.className = 'message-text';
            messageSpan.textContent = msg.content;
            messageElement.appendChild(messageSpan);

            const timeSpan = document.createElement('span');
            timeSpan.className = 'message-time';
            timeSpan.textContent = new Date(msg.created_at).toLocaleTimeString();
            messageElement.appendChild(timeSpan);

            messagesContainer.appendChild(messageElement);
            console.log('[DEBUG] Added message element to container');
        });

        console.log('[DEBUG] Finished displaying', messages.length, 'messages');
        this.scrollToBottom();
    }

    // Send private message
    async sendPrivateMessage(message) {
        if (!this.activeConversation || !message.trim()) return;

        const { userId } = this.activeConversation;

        try {
            const response = await fetch('/api/messages/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    receiver_id: userId,
                    content: message.trim()
                })
            });

            if (response.ok) {
                // Add message to local state immediately for better UX
                const newMessage = {
                    sender_id: this.currentUser.id,
                    receiver_id: userId,
                    content: message.trim(),
                    created_at: new Date().toISOString(),
                    is_read: false
                };

                if (!this.privateMessages[userId]) {
                    this.privateMessages[userId] = [];
                }
                this.privateMessages[userId].push(newMessage);
                this.displayPrivateMessages(userId);

                // Also send via WebSocket for real-time delivery
                this.send('private_message', {
                    to_user_id: userId,
                    content: message.trim()
                });
            } else {
                console.error('Failed to send private message:', response.status);
            }
        } catch (error) {
            console.error('Error sending private message:', error);
        }
    }

    // Update chat mode (public/private)
    updateChatMode(mode) {
        console.log('[DEBUG] updateChatMode called with mode:', mode);
        const chatPanel = document.getElementById('chat-panel');
        if (chatPanel) {
            chatPanel.className = `chat-panel ${mode}-mode`;
        }

        // Update input placeholder
        const chatInput = document.getElementById('chat-input');
        if (chatInput) {
            chatInput.placeholder = mode === 'private' ? 'Type a private message...' : 'Type a message...';
        }

        // Show/hide back button
        const backBtn = document.getElementById('chat-back-btn');
        if (backBtn) {
            backBtn.style.display = mode === 'private' ? 'inline-block' : 'none';
        }

        // Show/hide conversations and users lists based on mode
        const conversationsDiv = document.getElementById('chat-conversations');
        const usersListDiv = document.getElementById('chat-users-list');
        const messagesDiv = document.getElementById('chat-messages');

        if (conversationsDiv) {
            conversationsDiv.style.display = mode === 'public' ? 'block' : 'none';
            console.log('[DEBUG] Set conversations display to:', mode === 'public' ? 'block' : 'none');
        }
        if (usersListDiv) {
            usersListDiv.style.display = mode === 'public' ? 'block' : 'none';
            console.log('[DEBUG] Set users list display to:', mode === 'public' ? 'block' : 'none');
        }
        if (messagesDiv) {
            messagesDiv.style.display = 'block'; // Always show messages
            console.log('[DEBUG] Messages display set to: block');
        }
    }

    // Load conversations from API
    async loadConversations() {
        try {
            console.log('Loading conversations...');
            const response = await fetch('/api/conversations', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'same-origin'
            });

            if (response.ok) {
                const data = await response.json();
                this.conversations = data.conversations || [];
                this.renderConversations();
            } else {
                console.error('Failed to load conversations:', response.status);
            }
        } catch (error) {
            console.error('Error loading conversations:', error);
        }
    }

    // Render conversations list
    renderConversations() {
        const conversationsElement = document.getElementById('chat-conversations');
        if (!conversationsElement) return;

        // Clear existing conversations
        while (conversationsElement.firstChild) {
            conversationsElement.removeChild(conversationsElement.firstChild);
        }

        if (this.conversations.length === 0) {
            const noConversationsElement = document.createElement('div');
            noConversationsElement.className = 'no-conversations';
            noConversationsElement.textContent = 'No conversations yet';
            conversationsElement.appendChild(noConversationsElement);
            return;
        }

        this.conversations.forEach(conv => {
            const convElement = document.createElement('div');
            convElement.className = `conversation-item ${this.activeConversation && this.activeConversation.userId === conv.user_id ? 'active' : ''}`;
            convElement.setAttribute('data-user-id', conv.user_id);

            const nicknameSpan = document.createElement('span');
            nicknameSpan.className = 'conversation-nickname';
            nicknameSpan.textContent = conv.nickname;
            convElement.appendChild(nicknameSpan);

            if (conv.unread_count > 0) {
                const unreadBadge = document.createElement('span');
                unreadBadge.className = 'unread-badge';
                unreadBadge.textContent = conv.unread_count;
                convElement.appendChild(unreadBadge);
            }

            const lastMessageSpan = document.createElement('span');
            lastMessageSpan.className = 'last-message';
            lastMessageSpan.textContent = conv.last_message || 'No messages yet';
            convElement.appendChild(lastMessageSpan);

            // Add click handler
            convElement.addEventListener('click', () => {
                this.startConversation(conv.user_id, conv.nickname);
            });

            conversationsElement.appendChild(convElement);
        });
    }

    // Update connection status in UI
    updateConnectionStatus() {
        const statusElement = document.getElementById('chat-connection-status');
        if (statusElement) {
            statusElement.className = `connection-status ${this.connectionStatus}`;
            statusElement.textContent = this.connectionStatus.charAt(0).toUpperCase() + this.connectionStatus.slice(1);
        }
    }

    // Render messages in UI
    renderMessages() {
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) return;

        // Clear existing messages
        while (messagesContainer.firstChild) {
            messagesContainer.removeChild(messagesContainer.firstChild);
        }

        this.messages.forEach(msg => {
            const messageElement = document.createElement('div');
            messageElement.className = `chat-message ${msg.type}`;
            if (msg.username === this.currentUser?.nickname) {
                messageElement.classList.add('own-message');
            }

            const usernameSpan = document.createElement('span');
            usernameSpan.className = 'message-username';
            usernameSpan.textContent = `${msg.username}:`;
            messageElement.appendChild(usernameSpan);

            const messageSpan = document.createElement('span');
            messageSpan.className = 'message-text';
            messageSpan.textContent = msg.message;
            messageElement.appendChild(messageSpan);

            const timeSpan = document.createElement('span');
            timeSpan.className = 'message-time';
            timeSpan.textContent = msg.timestamp;
            messageElement.appendChild(timeSpan);

            messagesContainer.appendChild(messageElement);
        });
    }

    // Render online users
    renderOnlineUsers() {
        const usersElement = document.getElementById('chat-online-users');
        if (usersElement) {
            usersElement.textContent = `Online: ${this.onlineUsers.join(', ')}`;
        }
    }

    // Scroll to bottom of messages
    scrollToBottom() {
        const messagesContainer = document.getElementById('chat-messages');
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    // Toggle chat panel
    toggleChat() {
        this.isChatOpen = !this.isChatOpen;
        const chatPanel = document.getElementById('chat-panel');
        if (chatPanel) {
            chatPanel.classList.toggle('open', this.isChatOpen);
        }
    }

    // Clear messages (on logout)
    clearMessages() {
        this.messages = [];
        this.onlineUsers = [];
        this.conversations = [];
        this.activeConversation = null;
        this.privateMessages = {};
        this.renderMessages();
        this.renderOnlineUsers();
        this.renderConversations();
        this.updateChatMode('public'); // Reset to public mode
    }

    // Close chat panel
    closeChat() {
        this.isChatOpen = false;
        const chatPanel = document.getElementById('chat-panel');
        if (chatPanel) {
            chatPanel.classList.remove('open');
        }
    }
}

// Export singleton instance
const chatWS = new ChatWebSocket();
export default chatWS;
