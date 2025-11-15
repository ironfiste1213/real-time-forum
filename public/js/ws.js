 // WebSocket client for real-time chat
 import { checkSession } from './session.js';


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
        this.conversationBars = {}; // userId -> conversation bar element
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
        console.log('---------------------------------[DEBUG] Current user set to:', this.currentUser);

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



    // Handle incoming messages
    handleMessage(data) {
        console.log('[DEBUG] Handling message:', data);
        switch (data.type) {
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
            case 'online_users':
                console.log('[DEBUG] Message type: online_users');
                this.handleOnlineUsers(data);
                break;
            default:
                console.log('[DEBUG] Unknown message type:', data.type);
        }
    }



    // Handle user online
    handleUserOnline(nickname) {
        console.log('[DEBUG] handleUserOnline called with nickname:', nickname);
        if (nickname && !this.onlineUsers.includes(nickname)) {
            console.log('[DEBUG] Adding user to online list:', nickname);
            this.onlineUsers.push(nickname);
            this.updateUsersList(); // Update the users list to reflect online status
            if (nickname !==this.currentUser?.nickname && !this.isChatOpen) {
                this.showOnlineNotification(nickname);
            }
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
            is_read: false,
            id: data.id // Include database ID if available
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

    // Handle online users list
    handleOnlineUsers(data) {
        console.log('[DEBUG] handleOnlineUsers called with data:', data);
        try {
            // Parse the content as JSON array
            const onlineUsersList = JSON.parse(data.content || '[]');
            console.log('[DEBUG] Parsed online users:', onlineUsersList);

            // Update the online users array
            this.onlineUsers = onlineUsersList;
            console.log('[DEBUG] Updated onlineUsers to:', this.onlineUsers);

            // Update the UI to reflect the new online users
            this.updateUsersList();
        } catch (error) {
            console.error('[DEBUG] Error parsing online users data:', error);
        }
    }



    // Generate unique message ID
    generateMessageId() {
        return `msg_${Date.now()}_${this.messageIdCounter++}`;
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
                console.log('[DEBUG] allUsers now contains', this.allUsers.length, 'users');
                console.log('[DEBUG] Calling updateUsersList to render users');
                this.updateUsersList(); // Update the UI with online/offline status
                console.log('[DEBUG] updateUsersList completed, users should be clickable now');
            } else {
                const errorText = await response.text();
                console.error('[DEBUG] Failed to load users:', response.status, errorText);
            }
        } catch (error) {
            console.error('[DEBUG] Error loading users:', error);
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

        const unreadMap = this.getUnreadMap();
        console.log('[DEBUG] Processing', this.allUsers.length, 'users');

        // Update online status based on real-time onlineUsers array
        const usersWithOnlineStatus = this.allUsers.map(user => ({
            ...user,
            is_online: this.onlineUsers.includes(user.nickname)
        }));

        // Sort users: online first, then alphabetically
        const sortedUsers = usersWithOnlineStatus.sort((a, b) => {
            console.log('[DEBUG] Sorting user:', a.nickname, 'online:', a.is_online);
            if (a.is_online && !b.is_online) return -1;
            if (!a.is_online && b.is_online) return 1;
            return a.nickname.localeCompare(b.nickname);
        });

        sortedUsers.forEach(user => {
            console.log('[DEBUG] Creating element for user:', user.nickname, 'online:', user.is_online);

            // Skip current user - don't show themselves in the list
            if (user.id === this.currentUser.id) {
                console.log('[DEBUG] Skipping current user:', user.nickname);
                return;
            }

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

            // Per-user unread badge
            const unreadCount = unreadMap[parseInt(user.id)] || 0;
            if (unreadCount > 0) {
                const userUnread = document.createElement('span');
                userUnread.className = 'user-unread-badge';
                userUnread.textContent = unreadCount;
                nicknameSpan.appendChild(userUnread);
            }
            
            // Add visual indication for offline users
            if (!user.is_online) {
                const offlineText = document.createElement('span');
                offlineText.className = 'offline-text';
                offlineText.textContent = ' (Offline)';
                offlineText.style.fontSize = '0.8em';
                offlineText.style.color = '#747f8d';
                nicknameSpan.appendChild(offlineText);
            }
            userElement.appendChild(nicknameSpan);

            // Add click handler for all users (can view message history even if offline)
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

        // Allow starting conversations - online status will be updated in real-time
        // Don't block based on initial online status as it may not be synced yet

        // Set active conversation
        this.activeConversation = { userId: parseInt(userId), nickname };

        // Reflect name at the top header
        this.updateChatHeaderTitle(nickname);

        // Always load conversation history so server can mark messages as read
        this.loadConversationHistory(userId);

        // Update UI to show private chat mode
        this.updateChatMode('private');

        // Create or show conversation bar for this user
        this.createConversationBar(userId, nickname);

        // Show the chat panel if it's not already open
        if (!this.isChatOpen) {
            this.showChat();
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
                const loadedMessages = data.messages || [];

                // Replace local cache with authoritative server history to avoid duplicates
                this.privateMessages[userId] = Array.isArray(loadedMessages) ? loadedMessages.slice() : [];

                // Sort messages chronologically (oldest first)
                this.privateMessages[userId].sort((a, b) => {
                    const aTime = a.createdAt || a.created_at;
                    const bTime = b.createdAt || b.created_at;
                    return new Date(aTime) - new Date(bTime);
                });

                console.log('[DEBUG] Set privateMessages for user', userId, 'total messages:', this.privateMessages[userId].length);
                this.displayPrivateMessages(userId);
                // Refresh conversations to update unread counts (since server marked messages as read)
                this.loadConversations();
            } else {
                const errorText = await response.text();
                console.error('[DEBUG] Failed to load conversation history:', response.status, errorText);
                // Still display existing conversation if API fails
                if (!this.privateMessages[userId]) {
                    this.privateMessages[userId] = [];
                }
                this.displayPrivateMessages(userId);
            }
        } catch (error) {
            console.error('[DEBUG] Error loading conversation history:', error);
            // Still display existing conversation if API fails
            if (!this.privateMessages[userId]) {
                this.privateMessages[userId] = [];
            }
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

        // Update chat header title to other user's nickname if available
        const conversation = this.activeConversation;
        if (conversation) {
            this.updateChatHeaderTitle(conversation.nickname);
        } else {
            this.updateChatHeaderTitle('Chat');
        }

        // Display messages
        messages.forEach((msg, index) => {
            console.log('[DEBUG] Displaying message', index, ':', msg);
            console.log('[DEBUG] currentUser:', this.currentUser);
            // Handle both camelCase (API) and snake_case (WebSocket) property names
            const senderId = msg.senderId || msg.sender_id;
            console.log('[DEBUG] senderId:', senderId, 'type:', typeof senderId);
            console.log('[DEBUG] currentUser.id:', this.currentUser?.id, 'type:', typeof this.currentUser?.id);
            const messageElement = document.createElement('div');
            // Safe comparison - ensure both IDs are compared as integers
            const isOwnMessage = this.currentUser && (parseInt(senderId) === parseInt(this.currentUser.id));
            console.log('[DEBUG] isOwnMessage:', isOwnMessage, 'comparison:', parseInt(senderId), '===', parseInt(this.currentUser?.id));
            messageElement.className = `chat-message private-message ${isOwnMessage ? 'own-message' : 'other-message'}`;

            const messageSpan = document.createElement('span');
            messageSpan.className = 'message-text';
            messageSpan.textContent = msg.content;
            messageElement.appendChild(messageSpan);

            const timeSpan = document.createElement('span');
            timeSpan.className = 'message-time';
            // Handle both camelCase (API) and snake_case (WebSocket) property names
            const timestamp = msg.createdAt || msg.created_at;
            timeSpan.textContent = new Date(timestamp).toLocaleTimeString();
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

        // Allow sending messages - the backend will handle delivery when user comes online

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
                    is_read: false,
                    // Generate a temporary ID for local tracking
                    temp_id: `temp_${Date.now()}_${Math.random()}`
                };

                if (!this.privateMessages[userId]) {
                    this.privateMessages[userId] = [];
                }
                this.privateMessages[userId].push(newMessage);
                this.displayPrivateMessages(userId);

                // Also send via WebSocket for real-time delivery
                this.send('private_message', {
                    to_user_id: userId,
                    content: message.trim(),
                    temp_id: newMessage.temp_id
                });
            } else {
                console.error('Failed to send private message:', response.status);
                this.showErrorMessage('Failed to send message. Please try again.');
            }
        } catch (error) {
            console.error('Error sending private message:', error);
            this.showErrorMessage('Network error. Please check your connection.');
        }
    }

    // Update chat mode (public/private)
    updateChatMode(mode) {
        console.log('[DEBUG] updateChatMode called with mode:', mode);
        const chatPanel = document.getElementById('chat-panel');
        if (chatPanel) {
            chatPanel.className = `chat-panel fullscreen discord-style open ${mode}-mode`;
        }

        // Update chat header title
        const title = mode === 'private' && this.activeConversation ? this.activeConversation.nickname : 'Chat';
        this.updateChatHeaderTitle(title);

        // Update input placeholder
        const chatInput = document.getElementById('chat-input');
        if (chatInput) {
            chatInput.placeholder = mode === 'private' ? 'Type a private message...' : 'Type a message...';
        }

        // Show/hide chat form based on mode
        const chatForm = document.getElementById('chat-form');
        if (chatForm) {
            chatForm.style.display = mode === 'private' ? 'flex' : 'none';
            console.log('[DEBUG] Set chat form display to:', mode === 'private' ? 'flex' : 'none');
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
            usersListDiv.style.display = 'block'; // Always show users list
            console.log('[DEBUG] Users list display set to: block');
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
                this.renderConversations();
                // Update unread badges in users list and chat button
                this.updateUsersList();
                this.updateChatUnreadUI();
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
            statusElement.textContent = this.connectionStatus === 'connected'
                ? 'Online'
                : this.connectionStatus.charAt(0).toUpperCase() + this.connectionStatus.slice(1);
        }
    }

    // Update chat header title text
    updateChatHeaderTitle(title) {
        const titleEl = document.getElementById('chat-title');
        if (titleEl) {
            titleEl.textContent = title || 'Chat';
        }
    }

    // Update the floating chat button unread badge and title
    updateChatUnreadUI() {
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
            console.error('[DEBUG] updateChatUnreadUI error:', e);
        }
    }



    // Render online users
    renderOnlineUsers() {
        const usersElement = document.getElementById('chat-online-users');
        if (usersElement) {
            usersElement.textContent = `Online: ${this.onlineUsers.join(', ')}`;
        }
    }

    // Render messages (for public chat mode - currently empty since we only have private messaging)
    renderMessages() {
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) return;

        // Clear existing messages
        while (messagesContainer.firstChild) {
            messagesContainer.removeChild(messagesContainer.firstChild);
        }

        // For now, just show a placeholder or welcome message in public mode
        const welcomeElement = document.createElement('div');
        welcomeElement.className = 'chat-message system';
        welcomeElement.textContent = 'Welcome to the chat! Select a user to start a private conversation.';
        messagesContainer.appendChild(welcomeElement);
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
        if (chatPanel) {
            chatPanel.classList.add('open', 'fullscreen');
        }
    }

    // Toggle chat panel
    toggleChat() {
        this.isChatOpen = !this.isChatOpen;
        const chatPanel = document.getElementById('chat-panel');
        if (chatPanel) {
            chatPanel.classList.toggle('open', this.isChatOpen);
            chatPanel.classList.add('fullscreen'); // Always keep fullscreen
        }
    }

    // Create conversation bar for a user
    createConversationBar(userId, nickname) {
        const barId = `conversation-bar-${userId}`;

        // Remove existing bar if it exists
        const existingBar = document.getElementById(barId);
        if (existingBar) {
            existingBar.remove();
        }

        // Create new conversation bar
        const bar = document.createElement('div');
        bar.id = barId;
        bar.className = 'conversation-bar';
        bar.setAttribute('data-user-id', userId);

        // Create bar content
        const content = document.createElement('div');
        content.className = 'conversation-bar-content';

        const avatar = document.createElement('div');
        avatar.className = 'conversation-bar-avatar';
        avatar.textContent = nickname.charAt(0).toUpperCase();

        const info = document.createElement('div');
        info.className = 'conversation-bar-info';

        const name = document.createElement('div');
        name.className = 'conversation-bar-name';
        name.textContent = nickname;

        const preview = document.createElement('div');
        preview.className = 'conversation-bar-preview';
        preview.textContent = 'Click to chat';

        info.appendChild(name);
        info.appendChild(preview);

        const closeBtn = document.createElement('button');
        closeBtn.className = 'conversation-bar-close';
        closeBtn.textContent = '×';
        closeBtn.onclick = (e) => {
            e.stopPropagation();
            this.closeConversationBar(userId);
        };

        content.appendChild(avatar);
        content.appendChild(info);
        content.appendChild(closeBtn);

        bar.appendChild(content);

        // Add click handler to open conversation
        bar.onclick = () => {
            this.activeConversation = { userId: parseInt(userId), nickname };
            this.displayPrivateMessages(userId);
            this.updateChatMode('private');
            this.showChat();
        };

        // Add to page
        document.body.appendChild(bar);

        // Store reference
        this.conversationBars[userId] = bar;

        // Auto-hide after 5 seconds if not clicked
        setTimeout(() => {
            if (this.conversationBars[userId]) {
                bar.classList.add('fading');
                setTimeout(() => {
                    this.closeConversationBar(userId);
                }, 1000);
            }
        }, 5000);
    }

    // Close conversation bar
    closeConversationBar(userId) {
        const bar = this.conversationBars[userId];
        if (bar) {
            bar.remove();
            delete this.conversationBars[userId];
        }
    }

    // Clear messages (on logout)
    clearMessages() {
        this.onlineUsers = [];
        this.conversations = [];
        this.activeConversation = null;
        this.privateMessages = {};
        // Close all conversation bars
        Object.keys(this.conversationBars).forEach(userId => {
            this.closeConversationBar(userId);
        });
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
