/**
 * Private Message Handler
 * Handles incoming "private_message" WebSocket messages from other users.
 * 
 * Flow:
 * 1. Validate required fields (from_user_id, content)
 * 2. If conversation with sender is active:
 *    - Store message in chatState.currentMessages
 *    - Display the new message
 * 3. If conversation is not active:
 *    - Update unread count badge only
 *    - Don't store (will fetch from API if user opens conversation)
 */

import { chatState } from '../state.js';
import { displayCurrentMessages, storeCurrentMessage } from '../helperFunctions/privateMessagesHelper.js';
import { incrementUnreadCount } from '../helperFunctions/updateUnreadCounts.js';
import { updateUsersListView } from '../../view.js';
/**
 * Handle incoming "private_message" WebSocket messages
 * 
 * @param {Object} data - The private_message event data from WebSocket
 * @param {number} data.from_user_id - The ID of the sender user
 * @param {string} data.content - The message content
 * @param {string} data.timestamp - ISO timestamp when message was sent
 * @param {number} data.id - The database ID of the message
 */
export function handlePrivateMessage(data) {
    console.log('[privateMessage.js:handlePrivateMessage] ===== INCOMING PRIVATE MESSAGE =====');
    console.log('[privateMessage.js:handlePrivateMessage] Raw data:', JSON.stringify(data, null, 2));

    // Step 1: Validate required fields
    if (!data || typeof data.from_user_id !== 'number' || !data.content) {
        console.error('[privateMessage.js:handlePrivateMessage] Invalid message data:', data);
        return;
    }

    const senderId = data.from_user_id;
    console.log('[privateMessage.js:handlePrivateMessage] Sender ID:', senderId);
    console.log('[privateMessage.js:handlePrivateMessage] Current user ID:', chatState.currentUser?.id);
    console.log('[privateMessage.js:handlePrivateMessage] Active conversation:', chatState.activeConversation);

    // Step 2: Create message object with proper structure (normalized field names)
    const message = {
        id: data.id,
        from_user_id: senderId,
        to_user_id: chatState.currentUser?.id,
        content: data.content,
        createdAt: data.timestamp || new Date().toISOString(),
        is_read: false,
        is_own: false // Mark as received message (not sent by current user)
    };

    console.log('[privateMessage.js:handlePrivateMessage] Created message object:', message);

    // Step 3: Check if we have an active conversation with the sender
    if (chatState.activeConversation && chatState.activeConversation === senderId) {
        console.log('[privateMessage.js:handlePrivateMessage] Active conversation with sender');

        // Store and display the message
        storeCurrentMessage(message);
        displayCurrentMessages(true);
        incrementUnreadCount(senderId);

        // Mark message as read
        message.is_read = true;

        console.log('[privateMessage.js:handlePrivateMessage] Message stored and displayed');
    } else {
        console.log('[privateMessage.js:handlePrivateMessage] No active conversation with sender');
        console.log('[privateMessage.js:handlePrivateMessage] Active conversation user ID:', chatState.activeConversation);

        // Step 5: Update unread counts (don't store - will fetch from API if user opens conversation)
        incrementUnreadCount(senderId);
        updateUsersListView()
        console.log('[privateMessage.js:handlePrivateMessage] Updated unread counts');
    }

    console.log('[privateMessage.js:handlePrivateMessage] ===== PRIVATE MESSAGE PROCESSED =====');
}

