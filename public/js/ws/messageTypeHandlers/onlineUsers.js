import { chatState } from '../state.js';
import { updateUsersListView } from '../../views/usersListView.js';

/**
 * Handles incoming "online_users" WebSocket messages.
 * This function is called when the backend sends the list of all currently online users.
 * Typically sent to a newly logged-in user.
 * 
 * Flow:
 * 1. Validates that the input data contains a valid content field with JSON string
 * 2. Parses the JSON string to get array of online user ID strings
 * 3. Filters out the current user from the list
 * 4. Updates chatState.onlineUsers with the complete list
 * 5. If users list view is currently displayed, refreshes it
 * 
 * @param {Object} data - The online_users message data from WebSocket
 * @param {string} data.content - JSON string containing array of online user ID strings
 */
export function handleOnlineUsers(data) {
    console.log('[onlineUsers.js:handleOnlineUsers] Handling online_users event:', data);

    // Step 1: Validate input - check if content field exists and is a string
    if (!data || typeof data.content !== 'string') {
        console.error('[onlineUsers.js:handleOnlineUsers] Invalid data - no content string:', data);
        return;
    }

    // Step 2: Parse the JSON string to get array of user ID strings
    let onlineUsers;
    try {
        onlineUsers = JSON.parse(data.content);
    } catch (e) {
        console.error('[onlineUsers.js:handleOnlineUsers] Failed to parse content JSON:', data.content, e);
        return;
    }

    // Validate that we got an array
    if (!Array.isArray(onlineUsers)) {
        console.error('[onlineUsers.js:handleOnlineUsers] Content is not an array:', onlineUsers);
        return;
    }

    console.log('[onlineUsers.js:handleOnlineUsers] Received', onlineUsers.length, 'online users:', onlineUsers);

    // Get current user ID to exclude from online users list
    const currentUserId = chatState.currentUser?.id;
    console.log('[onlineUsers.js:handleOnlineUsers] Current user ID:', currentUserId);

    // Filter out the current user from the online users list
    // We don't want to show "You" in the online users list
    const filteredOnlineUsers = currentUserId 
        ? onlineUsers.filter(userId => userId !== currentUserId)
        : onlineUsers;

    console.log('[onlineUsers.js:handleOnlineUsers] Filtered to', filteredOnlineUsers.length, 'users (excluded self)');

    // Step 3: Update chatState.onlineUsers with the filtered list
    // Store the array of user ID strings directly
    chatState.onlineUsers = filteredOnlineUsers;

    console.log('[onlineUsers.js:handleOnlineUsers] Updated chatState.onlineUsers:', chatState.onlineUsers.length, 'users');
    console.log('[onlineUsers.js:handleOnlineUsers] Online user IDs:', chatState.onlineUsers);

    // Step 4: If users list view is currently displayed, refresh it
    if (chatState.usersListContainer) {
        console.log('[onlineUsers.js:handleOnlineUsers] Users list container exists, refreshing view');
        updateUsersListView();
    } else {
        console.log('[onlineUsers.js:handleOnlineUsers] No users list container, only data updated');
    }
}

