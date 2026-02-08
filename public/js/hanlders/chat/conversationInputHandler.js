/**
 * Conversation Input Handler
 * Handles sending messages from the conversation view input.
 * 
 * Flow:
 * 1. User types message and clicks send (or presses Enter)
 * 2. Sends message via WebSocket to the active conversation user
 * 3. Clears the input field
 * 4. Server echoes back via 'message_from_me' event
 * 5. handleMessageFromMe renders the message in the conversation
 */

import { chatState } from '../../ws/state.js';

/**
 * Send a message to the active conversation user via WebSocket
 * 
 * @param {string} messageContent - The message text to send
 * @returns {boolean} True if message was sent, false otherwise
 */
function sendMessage(messageContent) {
    const toUserId = chatState.activeConversation;
    
    // Validate we have an active conversation
    if (!toUserId) {
        console.error('[conversationInputHandler.js:sendMessage] No active conversation');
        return false;
    }
    
    // Validate message content
    if (!messageContent || messageContent.trim() === '') {
        console.log('[conversationInputHandler.js:sendMessage] Empty message, not sending');
        return false;
    }
    
    // Check WebSocket connection
    if (!chatState.ws || chatState.ws.readyState !== WebSocket.OPEN) {
        console.error('[conversationInputHandler.js:sendMessage] WebSocket not connected');
        return false;
    }
    
    // Create the message payload
    const messagePayload = {
        type: 'private_message',
        to_user_id: toUserId,
        content: messageContent.trim()
    };
    
    console.log('[conversationInputHandler.js:sendMessage] Sending message to user', toUserId, ':', messagePayload);
    
    // Send via WebSocket
    chatState.ws.send(JSON.stringify(messagePayload));
    
    console.log('[conversationInputHandler.js:sendMessage] Message sent successfully');
    return true;
}

/**
 * Set up input event listeners for the conversation component
 * Handles both Enter key and Send button click
 * 
 * @param {HTMLElement} conversationEl - The conversation component element
 */
export function setupConversationInputListener(conversationEl) {
    console.log('[conversationInputHandler.js:setupConversationInputListener] Setting up input listeners');
    
    // Get input and send button
    const messageInput = conversationEl.querySelector('#conversation-input');
    const sendButton = conversationEl.querySelector('.conversation-send-btn');
    
    if (!messageInput) {
        console.error('[conversationInputHandler.js:setupConversationInputListener] Message input not found');
        return;
    }
    
    if (!sendButton) {
        console.error('[conversationInputHandler.js:setupConversationInputListener] Send button not found');
        return;
    }
    
    console.log('[conversationInputHandler.js:setupConversationInputListener] Input and button found');
    
    /**
     * Handle send action - called by both Enter key and Send button
     */
    function handleSendAction() {
        const message = messageInput.value;
        if (sendMessage(message)) {
            messageInput.value = '';
            messageInput.focus();
        }
    }
    
    // Handle Send button click
    sendButton.addEventListener('click', () => {
        console.log('[conversationInputHandler.js:setupConversationInputListener] Send button clicked');
        handleSendAction();
    });
    
    // Handle Enter key in input
    messageInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            console.log('[conversationInputHandler.js:setupConversationInputListener] Enter key pressed');
            event.preventDefault();
            handleSendAction();
        }
    });
    
    console.log('[conversationInputHandler.js:setupConversationInputListener] Input listeners set up successfully');
}

