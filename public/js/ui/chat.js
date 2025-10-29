// Chat UI components and event handlers
import chatWS from '../ws.js';

// Initialize chat UI when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeChatUI();
});

function initializeChatUI() {
    // Create chat panel HTML
    createChatPanel();

    // Set up event listeners
    setupChatEventListeners();

    // Connect to WebSocket on login (will be called from auth.js)
    // chatWS.connect(); // This will be called from auth success handler
}

// Create the chat panel HTML structure
function createChatPanel() {
    const chatPanel = document.createElement('div');
    chatPanel.id = 'chat-panel';
    chatPanel.className = 'chat-panel';
    chatPanel.innerHTML = `
        <div class="chat-header">
            <h3>Chat</h3>
            <button id="chat-close-btn" class="chat-close-btn">×</button>
        </div>
        <div class="chat-connection-status">
            <span id="chat-connection-status" class="connection-status disconnected">Disconnected</span>
        </div>
        <div id="chat-messages" class="chat-messages">
            <!-- Messages will be rendered here -->
        </div>
        <div id="chat-online-users" class="chat-online-users">
            Online: (connecting...)
        </div>
        <form id="chat-form" class="chat-form">
            <input type="text" id="chat-input" placeholder="Type a message..." maxlength="500" required>
            <button type="submit">Send</button>
        </form>
    `;

    document.body.appendChild(chatPanel);
}

// Set up all chat-related event listeners
function setupChatEventListeners() {
    // Chat toggle button (will be added to navigation)
    const chatToggleBtn = document.getElementById('chat-toggle-btn');
    if (chatToggleBtn) {
        chatToggleBtn.addEventListener('click', () => {
            chatWS.toggleChat();
        });
    }

    // Chat close button
    const chatCloseBtn = document.getElementById('chat-close-btn');
    if (chatCloseBtn) {
        chatCloseBtn.addEventListener('click', () => {
            chatWS.toggleChat();
        });
    }

    // Chat form submission
    const chatForm = document.getElementById('chat-form');
    if (chatForm) {
        chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleChatSubmit();
        });
    }

    // Enter key in chat input
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleChatSubmit();
            }
        });
    }

    // Window beforeunload - disconnect WebSocket
    window.addEventListener('beforeunload', () => {
        chatWS.sendLeaveMessage();
        chatWS.disconnect();
    });
}

// Handle chat message submission
function handleChatSubmit() {
    const chatInput = document.getElementById('chat-input');
    if (!chatInput) return;

    const message = chatInput.value.trim();
    if (message) {
        chatWS.sendChatMessage(message);
        chatInput.value = ''; // Clear input
        chatInput.focus(); // Keep focus for next message
    }
}

// Initialize chat connection (called from auth.js on login success)
export function initializeChatConnection() {
    chatWS.connect();
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
