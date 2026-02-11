import { chatState } from "../state.js";
import { handleNotification } from "./notificationHandler.js";
import { updateUserOnlineStatus } from "../../views/usersListView.js";
import { enableConversationInput } from "../../hanlders/chat/conversationInputHandler.js";

/**
 * Handles incoming "user_online" WebSocket messages.
 * 
 * Logic:
 * 1. When a user comes online, wait 3 seconds
 * 2. If the user goes offline within 3s, cancel the notification
 * 3. If user is still online after 3s, show notification
 * 
 * @param {Object} data - The user_online message data from WebSocket
 * @param {number} data.from_user_id - The ID of the user who came online
 * @param {string} [data.nickname] - Optional nickname of the user who came online
 */
export function handleUserOnline(data) {
    console.log('[userOnline.js:handleUserOnline] Handling user_online event:', data);

    // Step 1: Validate input
    if (!data || typeof data.from_user_id !== 'number' || data.from_user_id <= 0) {
        console.error('[userOnline.js:handleUserOnline] Invalid user data:', data);
        return;
    } 

    const userId = data.from_user_id;
    const nickname = data.nickname || String(userId);

    // Skip notification for current user
    if (chatState.currentUser && userId === chatState.currentUser.id) {
        console.log('[userOnline.js:handleUserOnline] User is current user, skipping notification:', nickname);
        return;
    }

    // Check if already online
    const isAlreadyOnline = chatState.onlineUsers.includes(nickname);

    if (!isAlreadyOnline) {
        console.log('[userOnline.js:handleUserOnline] User is new online:', nickname, '(ID:', userId, ')');
        
        // Add to online users
        chatState.onlineUsers.push(userId);
        
        // Check if we have a pending offline debounce for this user
        const pendingDebounce = chatState.userConnectionDebounce.get(userId);
        
        if (pendingDebounce && pendingDebounce.type === 'offline') {
            // User went offline and came back online within 3s - cancel the offline notification
            console.log('[userOnline.js:handleUserOnline] User reconnected within 3s, canceling offline notification');
            
            if (pendingDebounce.timeoutId) {
                clearTimeout(pendingDebounce.timeoutId);
            }
            
            // Remove the debounce entry - no notification needed
            chatState.userConnectionDebounce.delete(userId);
        } else {
            // No pending offline, this is a genuine new online event
            // Set up a 3s debounce to show notification
            console.log('[userOnline.js:handleUserOnline] Waiting 3s before showing online notification');
            
            const timeoutId = setTimeout(() => {
                console.log('[userOnline.js:handleUserOnline] 3s elapsed, showing notification for:', nickname);
                
                // Show notification
                handleNotification({
                    type: 'info',
                    message: `${nickname} is online`
                });
                
                // Clean up debounce entry
                chatState.userConnectionDebounce.delete(userId);
            }, 3000);
            
            // Store the debounce state
            chatState.userConnectionDebounce.set(userId, {
                type: 'online',
                timeoutId: timeoutId,
                handled: false
            });
        }
    } else {
        console.log('[userOnline.js:handleUserOnline] User was already online:', nickname);
    }

    // Update the view
    if (chatState.usersListContainer) {
        updateUserOnlineStatus(userId, true);
    }

    // Enable conversation input if needed
    if (chatState.activeConversation === userId) {
        enableConversationInput();
    }
}

