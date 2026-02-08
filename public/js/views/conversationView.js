/**
 * Conversation View
 * Displays a conversation with a specific user.
 * Loads conversation history and renders messages in the conversation component.
 */

import { conversationComponent } from '../components/chat/conversationComponent.js';
import { loadConversationHistory } from '../api/messages/conversationHistory.js';
import { chatState } from '../ws/state.js';
import { usersListView } from './usersListView.js';
import { setupConversationInputListener } from '../hanlders/chat/conversationInputHandler.js';
import { transitionTo } from '../viewState.js';
/**
 * Conversation View - Displays a conversation with a specific user
 * 
 * @param {HTMLElement|string} containerOrSelector - Container element or CSS selector
 * @param {number} userId - The user ID to load conversation with
 * @returns {Promise<HTMLElement|null>} The conversation container or null if error
 */
export async function conversationView(containerOrSelector, userId) {
    console.log('conversationView.js: conversationView() called with userId:', userId);
    
    // Get or create container element
    let container;
    if (typeof containerOrSelector === 'string') {
        container = document.querySelector(containerOrSelector);
        if (!container) {
            console.error('conversationView.js: Container not found:', containerOrSelector);
            return null;
        }
    } else {
        container = containerOrSelector;
    }
    
    console.log('conversationView.js: Container found:', !!container);
    
    // Clear existing content
    container.innerHTML = '';
    console.log('conversationView.js: Container cleared');
    
    // Load conversation history
    console.log('conversationView.js: Loading conversation history for userId:', userId);
    const messages = await loadConversationHistory(userId);
    console.log('conversationView.js: Loaded', messages.length, 'messages');
    
    // Create conversation component
    const conversationEl = conversationComponent();
    console.log('conversationView.js: Conversation component created');
    
    // Set up input listener for sending messages
    setupConversationInputListener(conversationEl);
    console.log('conversationView.js: Input listener set up');
    
    // Display messages in the conversation
    displayMessages(messages, conversationEl);
    
    // Append to container
    container.appendChild(conversationEl);
    console.log('conversationView.js: Conversation component appended to container');

    // Store reference to container for updates
    chatState.activeConversation = userId;
    chatState.conversationContainer = container;
    
    // Set up back button functionality
    setupBackButton(conversationEl);
    
    return container;
}

/**
 * Set up the back button in conversation to return to users list
 * Uses transitionTo to clear conversation listeners before showing users list
 * @param {HTMLElement} conversationEl - The conversation component element
 */
function setupBackButton(conversationEl) {
    const backButton = conversationEl.querySelector('.conversation-back-btn');
    if (!backButton) {
        console.log('conversationView.js: Back button not found');
        return;
    }
    
    console.log('conversationView.js: Setting up back button');
    
    backButton.addEventListener('click', () => {
        console.log('conversationView.js: Back button clicked');
        
        // Find the users container
        const usersContainer = document.querySelector('#users-list-container');
        if (usersContainer) {
            // Use transitionTo to handle cleanup of conversation listeners before showing users list
            // Pass usersContainer as arg to avoid variable shadowing
            transitionTo('usersList', (container) => {
                container.innerHTML = '';
                usersListView(container);
            }, {
                container: usersContainer,
                dataAttribute: 'data-has-conversation-listener'
            }, usersContainer);
        }

        // Clear conversation container reference
        chatState.activeConversation = null;
        chatState.conversationContainer = null;
    });
}

/**
 * Display messages in the conversation component
 * Takes a message list and renders them in the 'conversation-messages' div
 * 
 * @param {Array} messages - Array of message objects
 * @param {HTMLElement} conversationEl - The conversation component element
 */
export function displayMessages(messages, conversationEl) {
    console.log('conversationView.js: displayMessages() called with', messages.length, 'messages');
    
    // Find the messages container
    const messagesContainer = conversationEl.querySelector('#conversation-messages');
    if (!messagesContainer) {
        console.error('conversationView.js: Messages container not found');
        return;
    }
    
    console.log('conversationView.js: Messages container found');
    
    // Clear existing messages
    messagesContainer.innerHTML = '';
    
    // Check if there are no messages
    if (!messages || messages.length === 0) {
        console.log('conversationView.js: No messages to display');
        const noMessages = document.createElement('div');
        noMessages.className = 'conversation-no-messages';
        noMessages.textContent = 'No messages yet. Start the conversation!';
        messagesContainer.appendChild(noMessages);
        return;
    }
    
    console.log('conversationView.js: Rendering', messages.length, 'messages');
    
    // Render each message
    messages.forEach((message, index) => {
        const messageEl = createMessageElement(message);
        messagesContainer.appendChild(messageEl);
        console.log('conversationView.js: Rendered message', index + 1, '- ID:', message.id);
    });
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    console.log('conversationView.js: Scrolled to bottom');
}

/**
 * Create a single message element
 * Uses normalized message format with from_user_id field
 * 
 * @param {Object} message - Message object (should be normalized)
 * @returns {HTMLElement} The message element
 */
function createMessageElement(message) {
    const messageEl = document.createElement('div');
    messageEl.className = 'conversation-message';
    messageEl.dataset.messageId = message.id;

    // Normalize message to ensure consistent field access
    const normalized = normalizeMessageForView(message);

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
 * Normalize message object to consistent format for view rendering
 * Handles both WebSocket (snake_case) and HTTP API (camelCase) responses
 * 
 * @param {Object} rawMessage - Raw message from API or WebSocket
 * @returns {Object} Normalized message object
 */
function normalizeMessageForView(rawMessage) {
    return {
        id: rawMessage.id || rawMessage.message_id,
        from_user_id: rawMessage.from_user_id || rawMessage.senderId || rawMessage.sender_id,
        to_user_id: rawMessage.to_user_id || rawMessage.receiverId || rawMessage.receiver_id,
        content: rawMessage.content || rawMessage.text || rawMessage.message || '',
        createdAt: rawMessage.createdAt || rawMessage.created_at || rawMessage.timestamp || rawMessage.time,
        is_own: rawMessage.is_own === true
    };
}



