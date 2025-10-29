// WebSocket client for real-time chat
class ChatWebSocket {
    constructor() {
        this.ws = null;
        this.isConnected = false;
        this.connectionStatus = 'disconnected';
        this.messages = [];
        this.onlineUsers = [];
        this.currentUser = null;
        this.reconnectAttempts = 0;
        this.maxReconnectDelay = 30000; // 30 seconds
        this.reconnectDelay = 1000; // Start with 1 second
        this.isChatOpen = false;
        this.messageIdCounter = 0;
    }

    // Initialize WebSocket connection
    connect() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            return; // Already connected
        }

        this.connectionStatus = 'connecting';
        this.updateConnectionStatus();

        // Get current user from session
        this.currentUser = this.getCurrentUser();
        if (!this.currentUser) {
            console.error('No user session found');
            return;
        }

        const wsUrl = `ws://localhost:8080/ws?token=${this.getSessionToken()}`;
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = (event) => {
            console.log('WebSocket connected');
            this.isConnected = true;
            this.connectionStatus = 'connected';
            this.reconnectAttempts = 0;
            this.reconnectDelay = 1000;
            this.updateConnectionStatus();

            // Send join message
            this.sendJoinMessage();
        };

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.handleMessage(data);
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
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
        switch (data.type) {
            case 'message':
                this.handleChatMessage(data);
                break;
            case 'user_joined':
                this.handleUserJoined(data.username);
                break;
            case 'user_left':
                this.handleUserLeft(data.username);
                break;
            case 'online_users':
                this.handleOnlineUsers(data.users);
                break;
            default:
                console.warn('Unknown message type:', data.type);
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
        this.onlineUsers = users;
        this.renderOnlineUsers();
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
        return null;
    }

    // Get session token
    getSessionToken() {
        return this.getCookie('session_token');
    }

    // Get cookie value
    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
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

        messagesContainer.innerHTML = '';

        this.messages.forEach(msg => {
            const messageElement = document.createElement('div');
            messageElement.className = `chat-message ${msg.type}`;
            if (msg.username === this.currentUser?.nickname) {
                messageElement.classList.add('own-message');
            }

            messageElement.innerHTML = `
                <span class="message-username">${msg.username}:</span>
                <span class="message-text">${msg.message}</span>
                <span class="message-time">${msg.timestamp}</span>
            `;

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
        this.renderMessages();
        this.renderOnlineUsers();
    }
}

// Export singleton instance
const chatWS = new ChatWebSocket();
export default chatWS;
