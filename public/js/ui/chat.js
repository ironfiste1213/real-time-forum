// Chat UI components and event handlers
import chatWS from '../ws.js';

// Chat UI initialization is now handled in views.js when showing main view

// Create the chat panel HTML structure (exported for use in views.js)
export function createChatPanel() {
    const chatPanel = document.createElement('div');
    chatPanel.id = 'chat-panel';
    chatPanel.className = 'chat-panel discord-style fullscreen';

    // Create chat header
    const chatHeader = document.createElement('div');
    chatHeader.className = 'chat-header';

    // Left placeholder
    const headerLeft = document.createElement('div');
    headerLeft.className = 'chat-header-left';

    // Center: title only (we'll center via CSS)
    const headerCenter = document.createElement('div');
    headerCenter.className = 'chat-header-center';
    const headerTitle = document.createElement('h3');
    headerTitle.id = 'chat-title';
    headerTitle.textContent = 'Chat';
    headerCenter.appendChild(headerTitle);

    // Right: close button
    const headerRight = document.createElement('div');
    headerRight.className = 'chat-header-right';
    const closeBtn = document.createElement('button');
    closeBtn.id = 'chat-close-btn';
    closeBtn.className = 'chat-close-btn';
    closeBtn.textContent = '×';
    headerRight.appendChild(closeBtn);

    chatHeader.appendChild(headerLeft);
    chatHeader.appendChild(headerCenter);
    chatHeader.appendChild(headerRight);

    chatPanel.appendChild(chatHeader);

    // Create main chat container with two panels
    const chatContainer = document.createElement('div');
    chatContainer.className = 'chat-container';

    // Left panel - Users list (20%)
    const leftPanel = document.createElement('div');
    leftPanel.className = 'chat-left-panel';

    const usersListDiv = document.createElement('div');
    usersListDiv.id = 'chat-users-list';
    usersListDiv.className = 'chat-users-list';
    leftPanel.appendChild(usersListDiv);

    chatContainer.appendChild(leftPanel);

    // Right panel - Conversation area (80%)
    const rightPanel = document.createElement('div');
    rightPanel.className = 'chat-right-panel';

    // Messages container
    const messagesDiv = document.createElement('div');
    messagesDiv.id = 'chat-messages';
    messagesDiv.className = 'chat-messages';
    rightPanel.appendChild(messagesDiv);

    // Chat form (initially hidden, shown only when in conversation)
    const chatForm = document.createElement('form');
    chatForm.id = 'chat-form';
    chatForm.className = 'chat-form';
    chatForm.style.display = 'none'; // Hidden by default

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

    rightPanel.appendChild(chatForm);

    chatContainer.appendChild(rightPanel);

    chatPanel.appendChild(chatContainer);

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

    // No minimize button needed for separate conversation bars

    // Chat close button
    const chatCloseBtn = document.getElementById('chat-close-btn');
    if (chatCloseBtn) {
        // Clone and replace to remove existing listeners
        const newChatCloseBtn = chatCloseBtn.cloneNode(true);
        chatCloseBtn.parentNode.replaceChild(newChatCloseBtn, chatCloseBtn);
        newChatCloseBtn.addEventListener('click', () => {
            // Instead of just closing chat, restore main view
            const mainContainer = document.getElementById('main-container');
            const chatPanel = document.getElementById('chat-panel');
            const floatingChatBtn = document.getElementById('floating-chat-btn');

            if (mainContainer) mainContainer.classList.remove('hidden');
            if (chatPanel) chatPanel.classList.remove('open');
            if (floatingChatBtn) floatingChatBtn.style.display = 'block';
        });
    }

    // No minimized chat bar handling needed for separate conversation bars

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
