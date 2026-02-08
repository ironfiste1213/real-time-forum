/**
 * Handle message from me (sent from another connection)
 * 
 * This handler processes "message_from_me" WebSocket messages which are sent when
 * the user sends a message from another browser tab/device. It stores the message
 * locally and updates the conversation view if visible.
 * 
 * Flow:
 * 1. Log incoming message data for debugging
 * 2. Validate required fields (to_user_id, content)
 * 3. Check if we have an active conversation with the recipient
 * 4. Create a message object with proper structure
 * 5. Store in chatState.privateMessages
 * 6. Update the conversation view if visible
 */

import { chatState } from '../state.js';
import { displayPrivateMessages, storePrivateMessage } from '../helperFunctions/privateMessagesHelper.js';

/**
 * Handle incoming "message_from_me" WebSocket messages
 * 
 * @param {Object} data - The message_from_me event data from WebSocket
 * @param {number} data.to_user_id - The ID of the recipient user
 * @param {string} data.content - The message content
 * @param {string} data.timestamp - ISO timestamp when message was sent
 * @param {number} data.id - The database ID of the message
 */
export function handleMessageFromMe(data) {
    console.log('[messageFromMe.js:handleMessageFromMe] [DEBUG] ===== MESSAGE_FROM_ME RECEIVED =====');
    console.log('[messageFromMe.js:handleMessageFromMe] [DEBUG] Raw data:', JSON.stringify(data, null, 2));

    // Step 1: Validate required fields
    if (!data || typeof data.to_user_id !== 'number' || !data.content) {
        console.error('[messageFromMe.js:handleMessageFromMe] Invalid message data:', data);
        return;
    }

    const toUserId = data.to_user_id;
    console.log('[messageFromMe.js:handleMessageFromMe] [DEBUG] To user ID:', toUserId);
    console.log('[messageFromMe.js:handleMessageFromMe] [DEBUG] Current user ID:', chatState.currentUser?.id);
    console.log('[messageFromMe.js:handleMessageFromMe] [DEBUG] Active conversation:', chatState.activeConversation);

    // Step 2: Check if we are in conversation with the recipient
    if (chatState.activeConversation && chatState.activeConversation === toUserId) {
        console.log('[messageFromMe.js:handleMessageFromMe] [DEBUG] ✓ Active conversation matches, processing message');

        // Step 3: Create message object with normalized field names
        const message = {
            id: data.id,
            from_user_id: chatState.currentUser?.id,
            to_user_id: toUserId,
            content: data.content,
            createdAt: data.timestamp || new Date().toISOString(),
            is_read: false,
            is_own: true // Mark as own message for display logic
        };

        console.log('[messageFromMe.js:handleMessageFromMe] [DEBUG] Created message object:', message);

        // Step 4: Store the message using helper function (normalizes and stores)
        storePrivateMessage(message);

        // Step 5: Display the message in the active conversation (append mode)
        displayPrivateMessages(toUserId, true);

        console.log('[messageFromMe.js:handleMessageFromMe] [DEBUG] ===== MESSAGE_FROM_ME PROCESSED SUCCESSFULLY =====');
    } else {
        console.log('[messageFromMe.js:handleMessageFromMe] [DEBUG] ✗ No active conversation with recipient (expected user ID:', toUserId, ', active conversation user ID:', chatState.activeConversation, '), ignoring message');
        console.log('[messageFromMe.js:handleMessageFromMe] [DEBUG] ===== MESSAGE_FROM_ME IGNORED =====');
    }
}

