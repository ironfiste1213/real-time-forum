
import { chatState } from '../state.js';
import { displayCurrentMessages, storeCurrentMessage } from '../helperFunctions/privateMessagesHelper.js';
import { updateUsersListView } from '../../view.js';

/**
 * Handle incoming "message_from_me" WebSocket messages
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

        // Step 4: Store the message using helper function (normalizes and stores in currentMessages)
        storeCurrentMessage(message);

        // Step 5: Display the message in the active conversation (append mode)
        displayCurrentMessages(true);

        console.log('[messageFromMe.js:handleMessageFromMe] [DEBUG] ===== MESSAGE_FROM_ME PROCESSED SUCCESSFULLY =====');
    } else {
        updateUsersListView();
        console.log('[messageFromMe.js:handleMessageFromMe] [DEBUG] ✗ No active conversation with recipient (expected user ID:', toUserId, ', active conversation user ID:', chatState.activeConversation, '), ignoring message');
        console.log('[messageFromMe.js:handleMessageFromMe] [DEBUG] ===== MESSAGE_FROM_ME IGNORED =====');
    }
}

