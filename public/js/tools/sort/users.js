/**
 * Helper function to organize users like Discord:
 * - Users with conversations: sorted by last message sent (newest first)
 * - Users without messages: sorted alphabetically by name
 */
export function organizeUsersByActivity(allUsers, conversations) {
    console.log('userlisthandler.js: Organizing users by activity...', allUsers,conversations );
    
    // Create a map of user_id -> last_message_time, last_message, and unread_count for quick lookup
    const conversationMap = new Map();
    for (const conv of conversations) {
        if (conv.user_id) {
            conversationMap.set(conv.user_id, {
                last_message_time: new Date(conv.last_message_time || 0),
                last_message: conv.last_message || '',
                unread_count: conv.unread_count || 0
            });
        }
    }
    
    // Separate users into two groups
    const usersWithMessages = [];
    const usersWithoutMessages = [];
    
    for (const user of allUsers) {
        if (conversationMap.has(user.id)) {
            const convData = conversationMap.get(user.id);
            usersWithMessages.push({
                ...user,
                last_message_time: convData.last_message_time,
                last_message: convData.last_message,
                unread_count: convData.unread_count
            });
        } else {
            usersWithoutMessages.push(user);
        }
    }
    
    // Sort users with messages by last_message_time (newest first)
    usersWithMessages.sort((a, b) => b.last_message_time - a.last_message_time);
    
    // Sort users without messages alphabetically by name/nickname
    usersWithoutMessages.sort((a, b) => {
        const nameA = (a.nickname || a.name || a.username || '').toLowerCase();
        const nameB = (b.nickname || b.name || b.username || '').toLowerCase();
        return nameA.localeCompare(nameB);
    });    
    // Combine: users with messages first (sorted by activity), then new users (alphabetical)
    return [...usersWithMessages, ...usersWithoutMessages];
}