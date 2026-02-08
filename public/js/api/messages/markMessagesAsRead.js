/**
 * Marks messages as read for a given user.
 * @param {string|number} userId - The ID of the user whose messages should be marked as read
 * @returns {Promise<void>} A promise that resolves when the operation completes
 */
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
            console.error(`markMessagesAsRead.js: Failed to mark messages as read for userId: ${userId}, status: ${response.status}`);
        }
    } catch (error) {
        console.error(`markMessagesAsRead.js: Network error marking messages as read for userId: ${userId}, error: ${error.message}`);
    }
}

