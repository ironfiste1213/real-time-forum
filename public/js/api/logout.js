import { showLoginForm } from "../ui/auth.js";
import { clearUIElement } from "../ui/clear.js";
import chatWS from "../ws.js";

export async function handleLogout() {
    try {
        const response = await fetch('/logout', {
            method: 'POST', // Or GET, depending on your server route's expectation
        });

        if (!response.ok) {
            const result = await response.json();
            console.error('Logout failed on server:', result.message);
        }
    } catch (error) {
        console.error('Network error during logout:', error);
    } finally {
        // Always switch the view, even if the server call fails, to ensure the user is logged out on the frontend.
        // Manually clear the session state without making another API call
        // Clear all UI elements except auth
        clearAllUIElements();
        // Disconnect WebSocket before clearing
        chatWS.disconnect();
        // Use router to navigate to the login page
        window.history.pushState({}, "", "/login");
        showLoginForm();
    }
}

// Clear all UI elements except auth container
function clearAllUIElements() {
    // Clear main container
    const mainContainer = document.getElementById('main-container');
    clearUIElement(mainContainer);

    // Clear single post view
    const singlePostView = document.getElementById('single-post-view');
    clearUIElement(singlePostView);

    // Clear chat panel
    const chatPanel = document.getElementById('chat-panel');
    clearUIElement(chatPanel);

    // Close chat panel and clear messages
    chatWS.clearMessages();
    chatWS.closeChat();
}
