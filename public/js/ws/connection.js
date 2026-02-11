/**
 * WebSocket Connection Manager
 * Manages the WebSocket connection for real-time chat functionality.
 * 
 * This module handles:
 * - Opening and maintaining WebSocket connections
 * - Connection state management (connected/disconnected)
 * - Automatic reconnection with exponential backoff
 * - Error handling and message routing
 * 
 * Usage:
 * - Import: import { initWebSocket } from './chat/connection.js';
 * - Initialize: initWebSocket('ws://your-server/ws');
 */
import { loadConversationsAndUpdateUnread } from './helperFunctions/updateUnreadCounts.js';
import { chatState } from './state.js';
import { handleMessage } from './messageTypeHandlers/messagehandling.js';
import { router } from '../router.js';
import { transitionTo } from '../viewState.js';

/**
 * WebSocket connection instance
 * @type {WebSocket|null}
 */
let ws = null;

/**
 * Timeout ID for reconnect attempts
 * @type {number|null}
 */
let reconnectTimeout = null;

/**
 * Initialize a WebSocket connection to the given URL
 * @param {string} url - The WebSocket server URL
 */
export function initWebSocket(url) {
    // If we already have a valid connection, don't reinitialize
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        console.log('connection.js: WebSocket already connected or connecting, skipping initialization');
        return;
    }

    // Close any existing connection before creating a new one
    if (ws) {
        ws.close();
        ws = null;
    }
    if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
    }

    console.log('connection.js: Initializing WebSocket connection to:', url);
    
    // Update connection status to connecting
    chatState.connectionStatus = 'connecting';
    
    // Create new WebSocket connection
    ws = new WebSocket(url);
    
    // Store reference in chatState
    chatState.ws = ws;

    /**
     * Handle WebSocket connection open event
     * Updates chatState to reflect connected status
     */
    ws.onopen = () => {
        console.log('connection.js: WebSocket connection established');
        
        // Update connection state
        chatState.isConnected = true;
        chatState.connectionStatus = 'connected';
        chatState.reconnectAttempts = 0;
        chatState.reconnectDelay = 1000; // Reset reconnect delay
        
        console.log('connection.js: Connected - isConnected:', chatState.isConnected, '| Status:', chatState.connectionStatus);
    };

    /**
     * Handle WebSocket connection close event
     * Updates chatState and implements reconnection logic
     */
    ws.onclose = (event) => {
        console.log('connection.js: WebSocket connection closed', event.code, event.reason);
        
        // Update connection state
        chatState.isConnected = false;
        chatState.connectionStatus = 'disconnected';
        chatState.ws = null;
        
        console.log('connection.js: Disconnected - isConnected:', chatState.isConnected, '| Status:', chatState.connectionStatus);
        if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
            reconnectTimeout = null;
        }

        if (event.code != 1000 && event.code != 1008) {
        // Implement reconnection logic
            
        scheduleReconnect(url);
    }else {
        router({ispush: true, path:"/login"})
    }
    };

    /**
     * Handle WebSocket error event
     * Logs the error and attempts reconnection
     */
    ws.onerror = (error) => {
        console.error('connection.js: WebSocket error:', error);
        
        // Attempt reconnection on error
        scheduleReconnect(url);
    };

    /**
     * Handle incoming WebSocket messages
     * Routes messages to the appropriate handler
     * @param {MessageEvent} event - The message event
     */
    ws.onmessage = (event) => {
        console.log('connection.js: Received message:', event.data);
        const data = JSON.parse(event.data);
        // Call the message handler function (to be defined in handlers.js)
        handleMessage(data);
    };
}

/**
 * Schedule a reconnection attempt with exponential backoff
 * Uses chatState.reconnectDelay and chatState.maxReconnectDelay for timing
 * @param {string} url - The WebSocket server URL
 */
function scheduleReconnect(url) {
    // Clear any existing reconnect timeout
    if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
    }

    // Calculate delay with exponential backoff
    const delay = Math.min(
        chatState.reconnectDelay * Math.pow(2, chatState.reconnectAttempts),
        chatState.maxReconnectDelay
    );

    console.log('connection.js: Scheduling reconnect in', delay, 'ms (attempt', chatState.reconnectAttempts + 1, ')');

    // Update connection status to reconnecting
    chatState.connectionStatus = 'reconnecting';

    // Set timeout for reconnection attempt
    reconnectTimeout = setTimeout(() => {
        chatState.reconnectAttempts++;
        initWebSocket(url);
    }, delay);
}


/**
 * Close the WebSocket connection manually
 * Use this for cleanup (e.g., on logout)
 */
export function closeConnection() {
    if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
    }
    
    if (ws) {
        ws.close(1000, 'User disconnected');
        ws = null;
        chatState.ws = null;
    }
    
    chatState.isConnected = false;
    chatState.connectionStatus = 'disconnected';
    
    console.log('connection.js: Connection closed manually');
}

