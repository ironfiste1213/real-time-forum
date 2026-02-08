/**
 * Private Message Handler
 * Handles incoming "private_message" WebSocket messages from other users.
 * 
 * Flow:
 * 1. Log incoming message data for debugging
 * 2. Validate required fields (from_user_id, content)
 * 3. Store the message in chatState.privateMessages
 * 4. If conversation with sender is active, display the new message
 * 5. If conversation is not active, update unread count
 */

import { chatState } from '../state.js';
import { displayPrivateMessages, storePrivateMessage } from '../helperFunctions/privateMessagesHelper.js';
import { incrementUnreadCount } from '../helperFunctions/updateUnreadCounts.js';

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

    // Step 3: Store the message using helper function (normalizes and stores)
    storePrivateMessage(message);
    console.log('[privateMessage.js:handlePrivateMessage] Message stored in chatState.privateMessages');

    // Step 4: Check if we have an active conversation with the sender
    if (chatState.activeConversation && chatState.activeConversation === senderId) {
        console.log('[privateMessage.js:handlePrivateMessage] Active conversation with sender, displaying message');

        // Display the new message in the conversation (append mode)
        displayPrivateMessages(senderId, true);

        // Mark message as read
        message.is_read = true;

        console.log('[privateMessage.js:handlePrivateMessage] Message displayed in active conversation');
    } else {
        console.log('[privateMessage.js:handlePrivateMessage] No active conversation with sender');
        console.log('[privateMessage.js:handlePrivateMessage] Active conversation user ID:', chatState.activeConversation);

        // Step 5: Update unread counts
        incrementUnreadCount(senderId);

        console.log('[privateMessage.js:handlePrivateMessage] Updated unread counts');
    }

    console.log('[privateMessage.js:handlePrivateMessage] ===== PRIVATE MESSAGE PROCESSED =====');
}

