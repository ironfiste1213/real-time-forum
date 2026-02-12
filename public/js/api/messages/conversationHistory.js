import { handleStatusCode } from '../../tools/error/statusCodeHandler.js';
import { handleNetworkError } from '../../tools/error/networkErrorHandler.js';

export async function loadConversationHistory(userId, offset = 0, limit = 10) {
    try {
        console.log('conversationHistory.js: loadConversationHistory() called');
        console.log('conversationHistory.js: userId:', userId, 'offset:', offset, 'limit:', limit);

        const timestamp = Date.now();
        const url = `/api/messages?user_id=${userId}&limit=${limit}&offset=${offset}&_t=${timestamp}`;
        console.log('conversationHistory.js: Fetching from:', url);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'same-origin',
            cache: 'no-store' // Prevent caching
        });

        console.log('conversationHistory.js: Response received, status:', response.status);

        if (!response.ok) {
            // Handle status code (will redirect to login on 401)
            handleStatusCode(response);
            console.log('conversationHistory.js: Response not OK, returning empty array');
            return [];
        }

        const data = await response.json();
        const messages = data.messages || [];

        console.log('conversationHistory.js: Received', messages.length, 'messages');

        // Sort messages chronologically, oldest first
        const sortedMessages = messages.sort((a, b) => {
            const timeA = new Date(a.created_at || a.timestamp || a.time).getTime();
            const timeB = new Date(b.created_at || b.timestamp || b.time).getTime();
            return timeA - timeB;
        });

        console.log('conversationHistory.js: Returning', sortedMessages.length, 'sorted messages');
        return sortedMessages;

    } catch (error) {
        handleNetworkError(error, 'loadConversationHistory');
        // Handle fetch errors gracefully - return empty array
        return [];
    }
}

