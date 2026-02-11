import { router } from "../../router.js";
import { logoutApi } from "../../api/auth/logoutRequest.js"
import { showError } from "../../tools/error/showError.js";
import { clearChatEventListeners } from "../chat/chatButtonHandler.js";
import { closeConnection } from "../../ws/connection.js";
import { chatState, resetChatState } from "../../ws/state.js";

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

