import { chatState } from "../state.js";
import { handleNotification } from "./notificationHandler.js";
import { updateUserOnlineStatus } from "../../views/usersListView.js";
import { disableConversationInput } from "../../hanlders/chat/conversationInputHandler.js";

/**
 * Handles incoming "user_offline" WebSocket messages.
 * 
 * Logic:
 * 1. When a user goes offline, wait 3 seconds
 * 2. If the user comes back online within 3s, cancel the notification
 * 3. If user is still offline after 3s, show notification
 * 
 * @param {Object} data - The user_offline message data from WebSocket
 * @param {number} data.from_user_id - The user ID who went offline
 * @param {string} [data.nickname] - The nickname of the user who went offline
 */
export function handleUserOffline(data) {
    console.log('[userOffline.js:handleUserOffline] Handling user_offline event:', data);

    // Step 1: Validate input
    if (!data || typeof data.from_user_id !== 'number' || data.from_user_id <= 0) {
        console.error('[userOffline.js:handleUserOffline] Invalid user data:', data);
        return;
    }

    const userId = data.from_user_id;
    const nickname = data.nickname || 'Unknown User';

    console.log('[userOffline.js:handleUserOffline] User went offline:', nickname, '(ID:', userId, ')');

    // Skip notification for current user
    const isCurrentUser = chatState.currentUser && userId === chatState.currentUser.id;
    if (isCurrentUser) {
        console.log('[userOffline.js:handleUserOffline] User is current user, skipping notification');
    }

    // Remove from online users
    const initialLength = chatState.onlineUsers.length;
    chatState.onlineUsers = chatState.onlineUsers.filter(nicknameItem => nicknameItem !== nickname);

    const removed = initialLength - chatState.onlineUsers.length;
    console.log('[userOffline.js:handleUserOffline] Removed', removed, 'user(s). Online users now:', chatState.onlineUsers.length);

    // Check if we have a pending online debounce for this user
    const pendingDebounce = chatState.userConnectionDebounce.get(userId);
    
    if (pendingDebounce && pendingDebounce.type === 'online') {
        // User came online and went offline within 3s - cancel the online notification
        console.log('[userOffline.js:handleUserOffline] User disconnected within 3s, canceling online notification');
        
        if (pendingDebounce.timeoutId) {
            clearTimeout(pendingDebounce.timeoutId);
        }
        
        // Remove the debounce entry - no notification needed
        chatState.userConnectionDebounce.delete(userId);
    } else if (!isCurrentUser) {
        // No pending online, this is a genuine new offline event
        // Set up a 3s debounce to show notification
        console.log('[userOffline.js:handleUserOffline] Waiting 3s before showing offline notification');
        
        const timeoutId = setTimeout(() => {
            console.log('[userOffline.js:handleUserOffline] 3s elapsed, showing notification for:', nickname);
            
            // Show notification
            handleNotification({
                type: 'info',
                message: `${nickname} went offline`
            });
            
            // Clean up debounce entry
            chatState.userConnectionDebounce.delete(userId);
        }, 3000);
        
        // Store the debounce state
        chatState.userConnectionDebounce.set(userId, {
            type: 'offline',
            timeoutId: timeoutId,
            handled: false
        });
    }

    // Update the view if we're in a users list view
    if (chatState.usersListContainer) {
        updateUserOnlineStatus(userId, false);
    }

    // Disable conversation input if needed
    if (chatState.activeConversation === userId) {
        disableConversationInput();
    }
}

