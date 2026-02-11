
export async function loadConversations() {
    try {
        console.log('loadConversations.js: loadConversations() called');
        console.log('loadConversations.js: Sending GET to /api/conversations');

        const response = await fetch('/api/conversations', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        console.log('loadConversations.js: Response received, status:', response.status);

        if (!response.ok) {
            console.log('loadConversations.js: Response not OK, returning empty array');
            return [];
        }

        const data = await response.json();
        const conversations = data.conversations || [];

        console.log('loadConversations.js: Received', conversations, 'conversations');

        if (conversations.length === 0) {
            return [];
        }

        // Normalize field names (backend returns 'nickname', some code expects 'username')
        const normalizedConversations = conversations.map(conv => ({
            ...conv,
            username: conv.nickname || conv.username
        }));

        // Deduplicate by user_id, keeping only the conversation with the latest last_message_time
        const conversationMap = new Map();

        for (const conversation of normalizedConversations) {
            const userId = conversation.user_id;
            const messageTime = new Date(conversation.last_message_time);

            const existing = conversationMap.get(userId);
            if (!existing) {
                // First occurrence of this user, add to map
                conversationMap.set(userId, conversation);
            } else {
                // Check if this conversation has a newer message time
                const existingTime = new Date(existing.last_message_time);
                if (messageTime > existingTime) {
                    // Replace with newer conversation
                    conversationMap.set(userId, conversation);
                }
            }
        }
        console.log("--------------: ", conversationMap);
        
        // Convert map to array and sort by last_message_time descending (most recent first)
        const deduplicatedConversations = Array.from(conversationMap.values())
            .sort((a, b) => new Date(b.last_message_time) - new Date(a.last_message_time));

        console.log('loadConversations.js: Returning', deduplicatedConversations.length, 'deduplicated conversations');
        return deduplicatedConversations;

    } catch (error) {
        console.error('loadConversations.js: Error loading conversations:', error.message);
        // Handle fetch errors gracefully - return empty array
        return [];
    }
}

