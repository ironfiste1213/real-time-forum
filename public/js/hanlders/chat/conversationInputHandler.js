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
import { markMessagesAsRead } from '../../api/messages/markMessagesAsRead.js';

/**
 * Gets the conversation container - tries provided container first, then falls back to chatState
 */
function getConversationContainer() {
    // First try to find the container with the conversation
    let container = chatState.conversationContainer;
    
    // If not found, try to find it in the DOM
    if (!container) {
        container = document.querySelector('#conversation-container');
    }
    
    return container;
}

/**
 * Disables the conversation input area.
 * Call this when the recipient user goes offline.
 */
export function disableConversationInput() {
    console.log('[conversationInputHandler.js:disableConversationInput] Disabling conversation input');
    
    const container = getConversationContainer();
    console.log('[conversationInputHandler.js:disableConversationInput] Container found:', !!container);
    
    if (!container) {
        console.log('[conversationInputHandler.js:disableConversationInput] No conversation container found');
        return;
    }
    
    const inputArea = container.querySelector('#conversation-input-area');
    const messageInput = container.querySelector('#conversation-input');
    const sendButton = container.querySelector('.conversation-send-btn');
    
    console.log('[conversationInputHandler.js:disableConversationInput] Elements found:', {
        inputArea: !!inputArea,
        messageInput: !!messageInput,
        sendButton: !!sendButton
    });
    
    if (inputArea) {
        inputArea.classList.add('input-disabled');
    }
    
    if (messageInput) {
        messageInput.disabled = true;
        messageInput.placeholder = 'User is offline - cannot send messages';
    }
    
    if (sendButton) {
        sendButton.disabled = true;
    }
}

/**
 * Enables the conversation input area.
 * Call this when the recipient user comes online.
 */
export function enableConversationInput() {
    console.log('[conversationInputHandler.js:enableConversationInput] Enabling conversation input');
    
    const container = getConversationContainer();
    console.log('[conversationInputHandler.js:enableConversationInput] Container found:', !!container);
    
    if (!container) {
        console.log('[conversationInputHandler.js:enableConversationInput] No conversation container found');
        return;
    }
    
    const inputArea = container.querySelector('#conversation-input-area');
    const messageInput = container.querySelector('#conversation-input');
    const sendButton = container.querySelector('.conversation-send-btn');
    
    console.log('[conversationInputHandler.js:enableConversationInput] Elements found:', {
        inputArea: !!inputArea,
        messageInput: !!messageInput,
        sendButton: !!sendButton
    });
    
    if (inputArea) {
        inputArea.classList.remove('input-disabled');
    }
    
    if (messageInput) {
        messageInput.disabled = false;
        messageInput.placeholder = 'Type a message...';
    }
    
    if (sendButton) {
        sendButton.disabled = false;
    }
}

/**
 * Send a message to the active conversation user via WebSocket
 * 
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
    
    // Mark messages as read when user clicks/focuses on the input field
    messageInput.addEventListener('click', async () => {
        console.log('[conversationInputHandler.js:setupConversationInputListener] Input clicked - marking messages as read');
        const userId = chatState.activeConversation;
        if (userId) {
            await markMessagesAsRead(userId);
            // Clear unread count in local state
            const conversation = chatState.conversations.find(c => c.partner_id === userId || c.user_id === userId);
            if (conversation) {
                conversation.unread_count = 0;
            }
            const userInAllUsers = chatState.allUsers.find(u => u.id === userId);
            if (userInAllUsers) {
                userInAllUsers.unread_count = 0;
            }
            // Update total unread UI
            const { updateTotalUnreadUI } = await import('../../ws/helperFunctions/updateUnreadCounts.js');
            updateTotalUnreadUI();
        }
    });
    
    console.log('[conversationInputHandler.js:setupConversationInputListener] Input listeners set up successfully');
}

