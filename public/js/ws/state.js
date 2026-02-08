/**
 * Chat State Management
 * Centralized state object for real-time WebSocket chat functionality.
 * 
 * This module exports a single chatState object that holds all chat-related
 * state and can be imported and used in connection.js, handlers.js, or
 * any other chat module.
 * 
 * Usage:
 * - Import: import { chatState } from './chat/state.js';
 * - Access properties: chatState.isConnected, chatState.onlineUsers, etc.
 * - Modify state: chatState.isConnected = true;
 */

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
    
    // Private messages storage (map userId → messages array)
    privateMessages: {},
    
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
    conversationContainer: null
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
    chatState.privateMessages = {};
    chatState.currentUser = null;
    chatState.reconnectAttempts = 0;
    chatState.reconnectDelay = 1000;
    chatState.isChatOpen = false;
    chatState.messageIdCounter = 0;
    chatState.loadUsersIntervalId = null;
    chatState.SortedUserslist = null;
    chatState.usersWithStatus = null;
    chatState.usersListContainer = null;
    chatState.conversationContainer = null;
}

/**
 * Generate a unique message ID
 * @returns {number} A unique message ID
 */
export function generateMessageId() {
    chatState.messageIdCounter += 1;
    return chatState.messageIdCounter;
}

