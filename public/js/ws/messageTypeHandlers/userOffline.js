
import { chatState } from "../state.js";
import { handleNotification } from "./notificationHandler.js";
import { updateUserOnlineStatus } from "../../views/usersListView.js";

/**
 * Handles incoming "user_offline" WebSocket messages.
 * This function is called when a user goes offline.
 * 
 * Flow:
 * 1. Validates that the input data contains a valid user ID and nickname
 * 2. Checks if the user going offline is the current user (skip if so)
 * 3. Removes the user from chatState.onlineUsers array (by nickname)
 * 4. Shows a notification (unless it's the current user)
 * 5. Updates the view if users list container exists
 * 
 * @param {Object} data - The user_offline message data from WebSocket
 * @param {number} data.from_user_id - The user ID who went offline
 * @param {string} data.nickname - The nickname of the user who went offline
 */
export function handleUserOffline(data) {
    console.log('[userOffline.js:handleUserOffline] Handling user_offline event:', data);

    // Step 1: Validate input - check if user ID exists and is valid
    if (!data || typeof data.from_user_id !== 'number' || data.from_user_id <= 0) {
        console.error('[userOffline.js:handleUserOffline] Invalid user data:', data);
        return;
    }

    const userId = data.from_user_id;
    const nickname = data.nickname || 'Unknown User';

    console.log('[userOffline.js:handleUserOffline] User went offline:', nickname, '(ID:', userId, ')');

    // Step 2: Check if the user going offline is the current user
    // If so, skip the notification (we don't want to notify ourselves)
    if (chatState.currentUser && userId === chatState.currentUser.id) {
        console.log('[userOffline.js:handleUserOffline] User is current user, skipping notification:', nickname);
        // Still remove from online users list
    }

    // Step 3: Remove the user from chatState.onlineUsers (array of nicknames)
    const initialLength = chatState.onlineUsers.length;
    chatState.onlineUsers = chatState.onlineUsers.filter(id => id !== nickname);

    const removed = initialLength - chatState.onlineUsers.length;
    console.log('[userOffline.js:handleUserOffline] Removed', removed, 'user(s). Online users now:', chatState.onlineUsers.length);

    // Step 4: Show notification (unless it was the current user)
    if (!(chatState.currentUser && userId === chatState.currentUser.id)) {
        handleNotification({
            type: 'info',
            message: `${nickname} went offline`
        });
    }

    // Step 5: Update the view if we're in a users list view
    if (chatState.usersListContainer) {
        console.log('[userOffline.js:handleUserOffline] Users list container exists, updating user status');
        updateUserOnlineStatus(nickname, false);
    } else {
        console.log('[userOffline.js:handleUserOffline] No users list container, only data updated');
    }
}

