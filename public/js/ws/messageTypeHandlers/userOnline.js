import { chatState } from "../state.js";
import { showNotification } from "../../components/notification/notificationComponent.js";
import { handleNotification } from "./notificationHandler.js";
import { updateUserOnlineStatus } from "../../views/usersListView.js";

/**
 * Handles incoming "user_online" WebSocket messages.
 * This function is used as a handler for the user_online message type.
 * 
 * Flow:
 * 1. Validates that the input data contains a valid user ID string
 * 2. Checks if the user is already in chatState.onlineUsers
 * 3. If not already present:
 *    - Shows a notification using the notification handler
 *    - Adds the user to chatState.onlineUsers
 * 4. Updates the view:
 *    - If usersListContainer exists → updates single user status in view
 *    - If not → just updates the data (already done in step 3)
 * 
 * @param {Object} data - The user_online message data from WebSocket
 * @param {string} data.from_user_id - The ID of the user who came online (string)
 * @param {string} [data.nickname] - Optional nickname of the user who came online
 */
export function handleUserOnline(data) {
    console.log('[userOnline.js:handleUserOnline] Handling user_online event:', data);

    // Step 1: Validate input - check if user ID exists and is valid
    if (!data || typeof data.from_user_id !== 'number' || data.from_user_id <= 0) {
        console.error('[userOnline.js:handleUserOnline] Invalid user data:', data);
        return;
    } 

    const userId = data.from_user_id;
    const nickname = data.nickname || String(userId);

    // Check if the user coming online is the current user
    // If so, skip the notification (we don't want to notify ourselves)
    if (chatState.currentUser && userId === chatState.currentUser.id) {
        console.log('[userOnline.js:handleUserOnline] User is current user, skipping notification:', nickname, '(ID:', userId, ')');
        return;
    }

    // Step 2: Check if user is already in chatState.onlineUsers (array of nicknames)
    const isAlreadyOnline = chatState.onlineUsers.includes(userId);

    // Step 3: If not already online, show notification and add to state
    if (!isAlreadyOnline) {
        console.log('[userOnline.js:handleUserOnline] User is new online:', nickname, '(ID:', userId, ')');

        // Show notification using the notification handler
        handleNotification({
            type: 'info',
            message: `${nickname} is online`
        });

        // Add the user to chatState.onlineUsers (array of nicknames)
        chatState.onlineUsers.push(userId);

        console.log('[userOnline.js:handleUserOnline] User added to onlineUsers. Total online:', chatState.onlineUsers.length);
    } else {
        console.log('[userOnline.js:handleUserOnline] User was already online:', nickname, '(ID:', userId, ')');
    }

    // Step 4: Update the view if we're in a users list view
    if (chatState.usersListContainer) {
        console.log('[userOnline.js:handleUserOnline] Users list container exists, updating single user status');
        updateUserOnlineStatus(userId, true);
    } else {
        console.log('[userOnline.js:handleUserOnline] No users list container, only data updated');
    }
}

