import { handleStatusCode } from '../../tools/error/statusCodeHandler.js';
import { handleNetworkError } from '../../tools/error/networkErrorHandler.js';

export async function markMessagesAsRead(userId) {
    try {
        console.log(`markMessagesAsRead.js: markMessagesAsRead() called for userId: ${userId}`);
        console.log(`markMessagesAsRead.js: Sending POST to /api/messages/mark-read?user_id=${userId}`);

        const response = await fetch(`/api/messages/mark-read?user_id=${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'same-origin',
        });

        console.log(`markMessagesAsRead.js: Response received, status: ${response.status}`);

        if (response.ok) {
            console.log(`markMessagesAsRead.js: Successfully marked messages as read for userId: ${userId}`);
        } else {
            // Handle status code (will redirect to login on 401)
            handleStatusCode(response);
            console.error(`markMessagesAsRead.js: Failed to mark messages as read for userId: ${userId}, status: ${response.status}`);
        }
    } catch (error) {
        handleNetworkError(error, 'markMessagesAsRead');
    }
}

