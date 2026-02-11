/**
 * Chat state object containing all WebSocket chat state properties
 */
export const chatState = {
    // WebSocket connection
    ws: null,
    
    // Connection status flags
    isConnected: false,
    connectionStatus: 'disconnected',
    
    // User lists
    onlineUsers: [],
    allUsers: [], // All registered users
    
    // Conversations
    conversations: [], // Recent conversations
    activeConversation: null,
    
    // Current conversation messages (only stores active conversation)
    currentMessages: [],
    
    // Current authenticated user
    currentUser: null,
    
    // Reconnection settings
    reconnectAttempts: 0,
    maxReconnectDelay: 30000,
    reconnectDelay: 1000,
    
    // UI state
    isChatOpen: false,
    
    // Message ID counter for generating unique message IDs
    messageIdCounter: 0,
    
    // Interval ID for periodically loading users
    loadUsersIntervalId: null,
    
    // Sorted users list (for display purposes)
    SortedUserslist: null,
    
    // Users with merged online status (for users list view)
    usersWithStatus: null,
    
    // Users list container reference
    usersListContainer: null,
    
    // Conversation container reference
    conversationContainer: null,
    
    // Conversation pagination state
    conversationOffset: 0,
    conversationHasMore: true,
    conversationIsLoading: false,
    conversationHistoryLoaded: false,
    conversationUserId: null,
    
    // User connection debounce state
    // Key: userId, Value: { type: 'online'|'offline', timeoutId: number, handled: boolean }
    userConnectionDebounce: new Map()
};

/**
 * Helper function to reset chat state (useful on logout)
 */
export function resetChatState() {
    chatState.ws = null;
    chatState.isConnected = false;
    chatState.connectionStatus = 'disconnected';
    chatState.onlineUsers = [];
    chatState.allUsers = [];
    chatState.conversations = [];
    chatState.activeConversation = null;
    chatState.currentMessages = [];
    chatState.currentUser = null;
    chatState.reconnectAttempts = 0;
    chatState.reconnectDelay = 1000;
    chatState.isChatOpen = false;
    chatState.messageIdCounter = 0;
    chatState.loadUsersIntervalId = null;
    chatState.usersWithStatus = null;
    chatState.usersListContainer = null;
    chatState.conversationContainer = null;
    chatState.conversationOffset = 0;
    chatState.conversationHasMore = true;
    chatState.conversationIsLoading = false;
    chatState.conversationHistoryLoaded = false;
    chatState.conversationUserId = null;
    
    // Clear all debounce timeouts
    chatState.userConnectionDebounce.forEach((value, key) => {
        if (value.timeoutId) {
            clearTimeout(value.timeoutId);
        }
    });
    chatState.userConnectionDebounce.clear();
}

/**
 * Generate a unique message ID
 * @returns {number} A unique message ID
 */
export function generateMessageId() {
    chatState.messageIdCounter += 1;
    return chatState.messageIdCounter;
}

