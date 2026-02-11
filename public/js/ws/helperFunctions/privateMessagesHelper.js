/**
 * Current Conversation Helper Functions
 * Shared utility functions for displaying and managing messages in the CURRENT conversation.
 * Used by messageFromMe.js, privateMessage.js, and conversationView.js.
 * 
 * NOTE: This module stores ONLY the active conversation messages in chatState.currentMessages.
 * When a user switches conversations or goes back, messages are cleared.
 * 
 * Message format (normalized):
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
 * Display messages for the current conversation
 * Gets all messages from chatState.currentMessages and renders them in the conversation view
 * 
 * @param {boolean} append - If true, append new message to existing; if false, replace all (default: false)
 */
export function displayCurrentMessages(append = false) {
    // console.log('[privateMessagesHelper.js:displayCurrentMessages] [DEBUG] displayCurrentMessages() called - append:', append);

    // Check if conversation container exists
    if (!chatState.conversationContainer) {
        // console.log('[privateMessagesHelper.js:displayCurrentMessages] [DEBUG] No conversation container, skipping display');
        return;
    }

    const messages = chatState.currentMessages;
    // console.log('[privateMessagesHelper.js:displayCurrentMessages] [DEBUG] Found', messages.length, 'messages in currentMessages');

    // Check if messages container exists in the DOM
    const messagesContainer = chatState.conversationContainer.querySelector('#conversation-messages');
    if (!messagesContainer) {
        console.error('[privateMessagesHelper.js:displayCurrentMessages] Messages container not found in conversation view');
        return;
    }

    if (append) {
        // Append only the new message (last one)
        const lastMessage = messages[messages.length - 1];
        if (lastMessage) {
            const messageEl = createMessageElement(lastMessage);
            messagesContainer.appendChild(messageEl);
            // Scroll to bottom after append
            requestAnimationFrame(() => {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            });
            // console.log('[privateMessagesHelper.js:displayCurrentMessages] [DEBUG] Message appended');
        }
    } else {
        // Replace all messages - clear and re-render
        messagesContainer.innerHTML = '';
        
        if (messages.length === 0) {
            const noMessages = document.createElement('div');
            noMessages.className = 'conversation-no-messages';
            noMessages.textContent = 'No messages yet. Start the conversation!';
            messagesContainer.appendChild(noMessages);
            // Scroll to bottom even when no messages
            requestAnimationFrame(() => {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            });
            // console.log('[privateMessagesHelper.js:displayCurrentMessages] [DEBUG] No messages to display');
            return;
        }

        // Render each message
        messages.forEach((message) => {
            const messageEl = createMessageElement(message);
            messagesContainer.appendChild(messageEl);
        });

        // Scroll to bottom using requestAnimationFrame for proper DOM timing
        // Using double rAF + setTimeout to ensure scroll works after container is visible
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
                // Fallback with small delay for edge cases
                setTimeout(() => {
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                }, 50);
            });
        });
        // console.log('[privateMessagesHelper.js:displayCurrentMessages] [DEBUG] All messages rendered and scrolled to bottom');
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
 * Store a message in the current conversation
 * Clears any existing messages first, then adds the new message
 * Used when opening a conversation or receiving a new message
 * 
 * @param {Object} message - The message object to store (raw format)
 * @returns {Object} The normalized message object
 */
export function storeCurrentMessage(message) {
    // Normalize the message first
    const normalized = normalizeMessage(message);
    
    // Add normalized message to currentMessages array
    chatState.currentMessages.push(normalized);
    // console.log('[privateMessagesHelper.js:storeCurrentMessage] [DEBUG] Added message to currentMessages. Total:', chatState.currentMessages.length);

    return normalized;
}

/**
 * Store multiple messages (conversation history) in currentMessages
 * Replaces any existing messages
 * 
 * @param {Array} messages - Array of message objects (raw format)
 * @returns {Array} Array of normalized message objects
 */
export function storeConversationHistory(messages) {
    // Clear existing messages first
    chatState.currentMessages = [];
    
    // Normalize and store each message
    const normalizedMessages = messages.map(msg => storeCurrentMessage(msg));
    
    // console.log('[privateMessagesHelper.js:storeConversationHistory] [DEBUG] Stored', normalizedMessages.length, 'messages in currentMessages');
    
    return normalizedMessages;
}

/**
 * Clear all messages in the current conversation
 * Called when user goes back from conversation or switches to another
 */
export function clearCurrentMessages() {
    chatState.currentMessages = [];
    // console.log('[privateMessagesHelper.js:clearCurrentMessages] [DEBUG] Cleared currentMessages');
}

/**
 * Get all messages for the current conversation
 * 
 * @returns {Array} Array of normalized message objects
 */
export function getCurrentMessages() {
    return chatState.currentMessages;
}

