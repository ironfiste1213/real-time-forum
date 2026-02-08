/**
 * User List Handler
 * Handles fetching and storing all users for the chat feature.
 * Also sets up event delegation for opening conversations.
 */

import { fetchUsers } from '../../api/fetchUsers.js';
import { loadConversations } from '../../api/messages/loadConversations.js';
import { chatState } from '../../ws/state.js';
import { openConversation } from '../../components/chat/userslistcomponent.js';

/**
 * Sets up event delegation for clicking on users in the users list container.
 * Uses event delegation - a single listener on the container that finds the
 * nearest .chat-user-item when clicked.
 * 
 * @param {HTMLElement} container - The users list container element
 */
export function setupUsersListHandler(container) {
    console.log('userlisthandler.js: setupUsersListHandler() called');
    
    if (!container) {
        console.error('userlisthandler.js: Container is null or undefined');
        return;
    }
    
    // Mark container for cleanup tracking
    container.setAttribute('data-has-users-listener', 'true');
    
    // Add single click event listener using event delegation
    container.addEventListener('click', (event) => {
        console.log('userlisthandler.js: Click event detected on container');
        
        // Find the nearest user item element using closest()
        const userItem = event.target.closest('.chat-user-item');
        
        if (userItem) {
            // Get userId from the data attribute
            const userId = userItem.dataset.userId;
            
            if (userId) {
                console.log('userlisthandler.js: User item clicked - ID:', userId);
                // Open conversation with the clicked user
                openConversation(parseInt(userId, 10));
            } else {
                console.warn('userlisthandler.js: User item found but no userId data attribute');
            }
        } else {
            console.log('userlisthandler.js: Click did not hit a user item');
        }
    });
    
    console.log('userlisthandler.js: Users list handler set up successfully');
}

/**
 * Helper function to organize users like Discord:
 * - Users with conversations: sorted by last message sent (newest first)
 * - Users without messages: sorted alphabetically by name
 * @param {Array} allUsers - All registered users
 * @param {Array} conversations - Conversations with last message info
 * @returns {Array} Organized users array
 */
function organizeUsersByActivity(allUsers, conversations) {
    console.log('userlisthandler.js: Organizing users by activity...');
    
    // Create a map of user_id -> last_message_time for quick lookup
    const conversationMap = new Map();
    for (const conv of conversations) {
        if (conv.user_id) {
            conversationMap.set(conv.user_id, {
                last_message_time: new Date(conv.last_message_time || 0),
                lastMessage: conv.last_message || ''
            });
        }
    }
    
    // Separate users into two groups
    const usersWithMessages = [];
    const usersWithoutMessages = [];
    
    for (const user of allUsers) {
        if (conversationMap.has(user.id)) {
            usersWithMessages.push({
                ...user,
                last_message_time: conversationMap.get(user.id).last_message_time,
                last_message: conversationMap.get(user.id).lastMessage
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
    
    console.log('userlisthandler.js: Organized -', usersWithMessages.length, 'with messages,', usersWithoutMessages.length, 'without messages');
    
    // Combine: users with messages first (sorted by activity), then new users (alphabetical)
    return [...usersWithMessages, ...usersWithoutMessages];
}

/**
 * Fetches all users and stores them in chatState.allUsers
 * Organizes users like Discord: active conversations first (sorted by last message),
 * followed by new users without messages (sorted alphabetically)
 * @returns {Promise<Array>} Array of organized user objects
 */
export async function fileallusers() {
    console.log('userlisthandler.js: fileallusers() called');
    
    // Fetch all users and conversations in parallel
    const [users, conversations] = await Promise.all([
        fetchUsers(),
        loadConversations()
    ]);
    
    console.log('userlisthandler.js: Fetched', users.length, 'users and', conversations.length, 'conversations');
    
    // Organize users by activity (conversations first, then alphabetical)
    const organizedUsers = organizeUsersByActivity(users, conversations);
    
    // Store in chat state
    chatState.allUsers = organizedUsers;
    
    console.log('userlisthandler.js: chatState.allUsers filled with', organizedUsers.length, 'organized users');
    
    return organizedUsers;
}



