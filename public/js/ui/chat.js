// Chat UI components and event handlers
import chatWS from '../ws.js';

// Chat UI initialization is now handled in views.js when showing main view

// Create the chat panel HTML structure (exported for use in views.js)
export function createChatPanel() {
    const chatPanel = document.createElement('div');
    chatPanel.id = 'chat-panel';
    chatPanel.className = 'chat-panel';

    // Create chat header
    const chatHeader = document.createElement('div');
    chatHeader.className = 'chat-header';

    const headerTitle = document.createElement('h3');
    headerTitle.textContent = 'Chat';
    chatHeader.appendChild(headerTitle);

    // Add back to public chat button (only show in private mode)
    const backBtn = document.createElement('button');
    backBtn.id = 'chat-back-btn';
    backBtn.className = 'chat-back-btn';
    backBtn.textContent = '← Back';
    backBtn.style.display = 'none'; // Hidden by default
    chatHeader.appendChild(backBtn);

    const closeBtn = document.createElement('button');
    closeBtn.id = 'chat-close-btn';
    closeBtn.className = 'chat-close-btn';
    closeBtn.textContent = '×';
    chatHeader.appendChild(closeBtn);

    chatPanel.appendChild(chatHeader);

    // Create connection status
    const connectionStatus = document.createElement('div');
    connectionStatus.className = 'chat-connection-status';

    const statusSpan = document.createElement('span');
    statusSpan.id = 'chat-connection-status';
    statusSpan.className = 'connection-status disconnected';
    statusSpan.textContent = 'Disconnected';
    connectionStatus.appendChild(statusSpan);

    chatPanel.appendChild(connectionStatus);

    // Create messages container
    const messagesDiv = document.createElement('div');
    messagesDiv.id = 'chat-messages';
    messagesDiv.className = 'chat-messages';
    chatPanel.appendChild(messagesDiv);

    // Create conversations list container
    const conversationsDiv = document.createElement('div');
    conversationsDiv.id = 'chat-conversations';
    conversationsDiv.className = 'chat-conversations';
    conversationsDiv.style.display = 'none'; // Hidden by default, shown in public mode
    chatPanel.appendChild(conversationsDiv);

    // Create users list container
    const usersListDiv = document.createElement('div');
    usersListDiv.id = 'chat-users-list';
    usersListDiv.className = 'chat-users-list';
    usersListDiv.style.display = 'block'; // Show by default in public mode
    chatPanel.appendChild(usersListDiv);

    // Create chat form
    const chatForm = document.createElement('form');
    chatForm.id = 'chat-form';
    chatForm.className = 'chat-form';

    const chatInput = document.createElement('input');
    chatInput.type = 'text';
    chatInput.id = 'chat-input';
    chatInput.placeholder = 'Type a message...';
    chatInput.maxLength = 500;
    chatInput.required = true;
    chatForm.appendChild(chatInput);

    const sendBtn = document.createElement('button');
    sendBtn.type = 'submit';
    sendBtn.textContent = 'Send';
    chatForm.appendChild(sendBtn);

    chatPanel.appendChild(chatForm);

    document.body.appendChild(chatPanel);
}

// Set up all chat-related event listeners (exported for use in views.js)
export function setupChatEventListeners() {
    // Remove existing event listeners to prevent duplicates
    const chatToggleBtn = document.getElementById('chat-toggle-btn');
    if (chatToggleBtn) {
        // Clone and replace to remove existing listeners
        const newChatToggleBtn = chatToggleBtn.cloneNode(true);
        chatToggleBtn.parentNode.replaceChild(newChatToggleBtn, chatToggleBtn);
        newChatToggleBtn.addEventListener('click', () => {
            chatWS.toggleChat();
        });
    }

    // Chat back button (to return to public chat)
    const chatBackBtn = document.getElementById('chat-back-btn');
    if (chatBackBtn) {
        // Clone and replace to remove existing listeners
        const newChatBackBtn = chatBackBtn.cloneNode(true);
        chatBackBtn.parentNode.replaceChild(newChatBackBtn, chatBackBtn);
        newChatBackBtn.addEventListener('click', () => {
            chatWS.activeConversation = null;
            chatWS.updateChatMode('public');
            chatWS.renderMessages(); // Show public messages again
        });
    }

    // Chat close button
    const chatCloseBtn = document.getElementById('chat-close-btn');
    if (chatCloseBtn) {
        // Clone and replace to remove existing listeners
        const newChatCloseBtn = chatCloseBtn.cloneNode(true);
        chatCloseBtn.parentNode.replaceChild(newChatCloseBtn, chatCloseBtn);
        newChatCloseBtn.addEventListener('click', () => {
            chatWS.toggleChat();
        });
    }

    // Chat form submission
    const chatForm = document.getElementById('chat-form');
    if (chatForm) {
        // Clone and replace to remove existing listeners
        const newChatForm = chatForm.cloneNode(true);
        chatForm.parentNode.replaceChild(newChatForm, chatForm);
        newChatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleChatSubmit();
        });
    }

    // Enter key in chat input
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        // Clone and replace to remove existing listeners
        const newChatInput = chatInput.cloneNode(true);
        chatInput.parentNode.replaceChild(newChatInput, chatInput);
        newChatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleChatSubmit();
            }
        });
    }

    // Window beforeunload (only add once)
    if (!window.chatUnloadListenerAdded) {
        window.addEventListener('beforeunload', () => {
            chatWS.sendLeaveMessage();
            chatWS.disconnect();
        });
        window.chatUnloadListenerAdded = true;
    }
}

// Handle chat message submission
function handleChatSubmit() {
    const chatInput = document.getElementById('chat-input');
    if (!chatInput) return;

    const message = chatInput.value.trim();
    if (message) {
        // Check if we're in private chat mode
        if (chatWS.activeConversation) {
            chatWS.sendPrivateMessage(message);
        } else {
            chatWS.sendChatMessage(message);
        }
        chatInput.value = ''; // Clear input
        chatInput.focus(); // Keep focus for next message
    }
}

// Initialize chat connection (called from auth.js on login success)
export function initializeChatConnection(e) {
    console.log('DEBUG: initializeChatConnection called - initializing chat connection');
    if (chatWS.isConnected || chatWS.ws) {
        console.log('DEBUG: Chat already connected, skipping duplicate initialization');
        return;
    }
    chatWS.connect(e);
}

// Disconnect chat (called from logout handler)
export function disconnectChat() {
    chatWS.sendLeaveMessage();
    chatWS.disconnect();
    chatWS.clearMessages();
}

// Show chat panel programmatically
export function showChat() {
    chatWS.isChatOpen = true;
    const chatPanel = document.getElementById('chat-panel');
    if (chatPanel) {
        chatPanel.classList.add('open');
    }
}

// Hide chat panel programmatically
export function hideChat() {
    chatWS.isChatOpen = false;
    const chatPanel = document.getElementById('chat-panel');
    if (chatPanel) {
        chatPanel.classList.remove('open');
    }
}

// Get chat connection status
export function getChatStatus() {
    return {
        isConnected: chatWS.isConnected,
        status: chatWS.connectionStatus,
        onlineUsers: chatWS.onlineUsers.length,
        messages: chatWS.messages.length
    };
}
