import { router } from "../../router.js";
import { logoutApi } from "../../api/auth/logoutRequest.js"
import { showError } from "../../tools/error/showError.js";
import { clearChatEventListeners } from "../chat/chatButtonHandler.js";
import { closeConnection } from "../../ws/connection.js";
import { chatState, resetChatState } from "../../ws/state.js";

/**
 * Handle unauthorized (401) response with full cleanup
 * This ensures proper cleanup of chat UI, WebSocket, and state before redirecting to login
 * 
 * @param {string} destination - The destination path to redirect to after login (default: "/")
 */
export function handleUnauthorized(destination = "/") {
    console.log('logoutLogic.js: handleUnauthorized() called - performing full cleanup');

    // 1. Clear all chat event listeners AND remove chat panel/button from DOM
    clearChatEventListeners();
    // Note: clearChatEventListeners() now handles removal of chat panel and button

    // 2. Close WebSocket connection
    closeConnection();
    console.log('logoutLogic.js: WebSocket connection closed');

    // 3. Reset chat state (clears all timeouts, intervals, and state)
    resetChatState();
    console.log('logoutLogic.js: Chat state reset');

    // 4. Redirect to login with destination
    router({ ispush: true, path: "/login", distination: destination });
    console.log('logoutLogic.js: Redirected to login page');
}

export async function logoutHandler(rootContainer) {
    console.log('logoutLogic.js: logoutHandler() called');
    const logoutButton = rootContainer.querySelector('#logout-button');
    console.log('logoutLogic.js: Logout button found:', !!logoutButton);
    if (!logoutButton) return;

    logoutButton.addEventListener('click', async function (e) {
        console.log('logoutLogic.js: Logout button clicked');
        e.preventDefault();

        const result = await logoutApi();
        console.log('logoutLogic.js: API result received, success:', result.success);

        if (result.success) {
            console.log('Logout successful');
            
            // Clear chat event listeners and remove chat panel
            clearChatEventListeners();
             const chatPanel = document.querySelector('#chat-panel');
             const chatButton = document.querySelector('#floating-chat-btn')
            if (chatPanel) chatPanel.remove()
             if(chatButton) chatButton.remove()
            // Redirect to login view
            router({ispush:false, path:"/login"})
            console.log('logoutLogic.js: Redirect initiated');
            
            // Close WebSocket connection properly
            closeConnection();
            
            // Reset chat state (including clearing debounce timeouts)
            resetChatState();
        } else {
            console.error('Logout failed:', result.error);
            // Show error message to user
            showError(rootContainer, result.error);
            console.log('logoutLogic.js: Error displayed to user');
        }
    });
}


export async function logout(container) {
    const result = await logoutApi();
        console.log('logoutLogic.js: API result received, success:', result.success);

        if (result.success) {
            console.log('Logout successful');
            
            // Clear chat event listeners and remove chat panel
            clearChatEventListeners();
             const chatPanel = document.querySelector('#chat-panel');
             const chatButton = document.querySelector('#floating-chat-btn')
            if (chatPanel) chatPanel.remove()
             if(chatButton) chatButton.remove()
            // Redirect to login view
            router({ispush:false, path:"/login"})
            console.log('logoutLogic.js: Redirect initiated');
            
            // Close WebSocket connection properly
            closeConnection();
            
            // Reset chat state (including clearing debounce timeouts)
            resetChatState();
        } else {
            console.error('Logout failed:', result.error);
            // Show error message to user
            showError(Container, result.error);
            console.log('logoutLogic.js: Error displayed to user');
        }
}
