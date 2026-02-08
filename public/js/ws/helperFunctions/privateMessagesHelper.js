/**
 * Private Messages Helper Functions
 * Shared utility functions for displaying and managing private messages.
 * Used by messageFromMe.js, privateMessage.js, and other message handlers.
 * 
 * NOTE: This module normalizes field names from both WebSocket (snake_case)
 * and HTTP API (camelCase) responses into a consistent format:
 * - from_user_id: sender's user ID
 * - to_user_id: recipient's user ID  
 * - content: message text
 * - createdAt: timestamp (normalized from created_at or timestamp)
 * - id: database message ID
 * - is_own: true if sent by current user
 */

import { chatState } from '../state.js';

/**
 * Normalize message object to consistent format
 * Handles both WebSocket (snake_case) and HTTP API (camelCase) responses
 * 
 * @param {Object} rawMessage - Raw message from API or WebSocket
 * @returns {Object} Normalized message object
 */
export function normalizeMessage(rawMessage) {
    return {
        id: rawMessage.id || rawMessage.message_id,
        from_user_id: rawMessage.from_user_id || rawMessage.senderId || rawMessage.sender_id,
        to_user_id: rawMessage.to_user_id || rawMessage.receiverId || rawMessage.receiver_id,
        content: rawMessage.content || rawMessage.text || rawMessage.message || '',
        createdAt: rawMessage.createdAt || rawMessage.created_at || rawMessage.timestamp || rawMessage.time,
        is_own: rawMessage.is_own === true
    };
}

/**
 * Display private messages for a specific user
 * Gets all messages from chatState.privateMessages and renders them in the conversation view
 * 
 * @param {number} userId - The user ID to display messages for
 * @param {boolean} append - If true, append to existing messages; if false, replace all (default: false)
 */
export function displayPrivateMessages(userId, append = false) {
    console.log('[privateMessagesHelper.js:displayPrivateMessages] [DEBUG] displayPrivateMessages() called for user', userId, '- append:', append);

    // Check if conversation container exists
    if (!chatState.conversationContainer) {
        console.log('[privateMessagesHelper.js:displayPrivateMessages] [DEBUG] No conversation container, skipping display');
        return;
    }

    // Get messages for this user from state
    const messages = chatState.privateMessages[userId] || [];
    console.log('[privateMessagesHelper.js:displayPrivateMessages] [DEBUG] Found', messages.length, 'messages for user', userId);

    // Check if messages container exists in the DOM
    const messagesContainer = chatState.conversationContainer.querySelector('#conversation-messages');
    if (!messagesContainer) {
        console.error('[privateMessagesHelper.js:displayPrivateMessages] Messages container not found in conversation view');
        return;
    }

    if (append) {
        // Append only the new message (last one)
        const lastMessage = messages[messages.length - 1];
        if (lastMessage) {
            const messageEl = createMessageElement(lastMessage);
            messagesContainer.appendChild(messageEl);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
            console.log('[privateMessagesHelper.js:displayPrivateMessages] [DEBUG] Message appended');
        }
    } else {
        // Replace all messages - clear and re-render
        messagesContainer.innerHTML = '';
        
        if (messages.length === 0) {
            const noMessages = document.createElement('div');
            noMessages.className = 'conversation-no-messages';
            noMessages.textContent = 'No messages yet. Start the conversation!';
            messagesContainer.appendChild(noMessages);
            console.log('[privateMessagesHelper.js:displayPrivateMessages] [DEBUG] No messages to display');
            return;
        }

        // Render each message
        messages.forEach((message) => {
            const messageEl = createMessageElement(message);
            messagesContainer.appendChild(messageEl);
        });

        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        console.log('[privateMessagesHelper.js:displayPrivateMessages] [DEBUG] All messages rendered and scrolled to bottom');
    }
}

/**
 * Create a single message element
 * Uses normalized message format with from_user_id field
 * 
 * @param {Object} message - Message object (should be normalized)
 * @returns {HTMLElement} The message element
 */
export function createMessageElement(message) {
    const messageEl = document.createElement('div');
    messageEl.className = 'conversation-message';
    messageEl.dataset.messageId = message.id;
    
    // Normalize message to ensure consistent field access
    const normalized = normalizeMessage(message);
    
    // Determine if message is sent by current user or received
    // Use is_own flag first (set when we send), then fall back to from_user_id comparison
    const isSent = normalized.is_own || normalized.from_user_id === chatState.currentUser?.id;
    messageEl.classList.add(isSent ? 'message-sent' : 'message-received');

    // Message content
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.textContent = normalized.content;
    messageEl.appendChild(messageContent);

    // Message time
    const messageTime = document.createElement('div');
    messageTime.className = 'message-time';
    if (normalized.createdAt) {
        const date = new Date(normalized.createdAt);
        messageTime.textContent = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
        messageTime.textContent = '';
    }
    messageEl.appendChild(messageTime);

    return messageEl;
}

/**
 * Store a private message in chatState.privateMessages
 * 
 * @param {Object} message - The message object to store (raw format)
 * @returns {Object} The normalized message object
 */
export function storePrivateMessage(message) {
    // Normalize the message first
    const normalized = normalizeMessage(message);
    
    // Determine which user ID to use as the key (conversation partner)
    // If this is our message (is_own), conversation partner is the recipient
    // If this is a received message, conversation partner is the sender
    const partnerId = normalized.is_own ? normalized.to_user_id : normalized.from_user_id;
    
    // Initialize message array for this conversation if needed
    if (!chatState.privateMessages[partnerId]) {
        chatState.privateMessages[partnerId] = [];
        console.log('[privateMessagesHelper.js:storePrivateMessage] [DEBUG] Created new message array for user', partnerId);
    }

    // Add normalized message to the array
    chatState.privateMessages[partnerId].push(normalized);
    console.log('[privateMessagesHelper.js:storePrivateMessage] [DEBUG] Added message to privateMessages. Total for user', partnerId, ':', chatState.privateMessages[partnerId].length);

    return normalized;
}

/**
 * Get all messages for a specific conversation
 * 
 * @param {number} userId - The user ID to get messages for
 * @returns {Array} Array of normalized message objects
 */
export function getPrivateMessages(userId) {
    return chatState.privateMessages[userId] || [];
}

/**
 * Clear all private messages for a specific user
 * 
 * @param {number} userId - The user ID to clear messages for
 */
export function clearPrivateMessages(userId) {
    chatState.privateMessages[userId] = [];
    console.log('[privateMessagesHelper.js:clearPrivateMessages] [DEBUG] Cleared messages for user', userId);
}

