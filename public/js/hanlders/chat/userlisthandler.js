/**
 * User List Handler
 * Handles fetching and storing all users for the chat feature.
 * Also sets up event delegation for opening conversations.
 */

import { fetchUsers } from '../../api/fetchUsers.js';
import { loadConversations } from '../../api/messages/loadConversations.js';
import { chatState } from '../../ws/state.js';
import { openConversation } from './conversationHandler.js';
import { organizeUsersByActivity } from '../../tools/sort/users.js';

/**
 * Sets up event delegation for clicking on users in the users list container.
 * Uses event delegation - a single listener on the container that finds the
 * nearest .chat-user-item when clicked.
 * 
 */
export function setupUsersListHandler(container) {
    // console.log('userlisthandler.js: setupUsersListHandler() called');
    
    if (!container) {
        console.error('userlisthandler.js: Container is null or undefined');
        return;
    }
    
    // Mark container for cleanup tracking
    container.setAttribute('data-has-users-listener', 'true');
    
    // Add single click event listener using event delegation
    container.addEventListener('click', (event) => {
         console.log('************userlisthandler.js: Click event detected on container**********');
        
        // Find the nearest user item element using closest()
        const userItem = event.target.closest('.chat-user-item');
        
        if (userItem) {
            // Get userId from the data attribute
            const userId = userItem.dataset.userId;
            
            if (userId) {
                // console.log('userlisthandler.js: User item clicked - ID:', userId);
                // Open conversation with the clicked user
                openConversation({ userId: parseInt(userId, 10) });
            } else {
                // console.warn('userlisthandler.js: User item found but no userId data attribute');
            }
        } else {
            // console.log('userlisthandler.js: Click did not hit a user item');
        }
    });
    
    // console.log('userlisthandler.js: Users list handler set up successfully');
}



/**
 * Fetches all users and stores them in chatState.allUsers
 * Also populates chatState.onlineUsers with nicknames of online users
 * Organizes users like Discord: active conversations first (sorted by last message),
 * followed by new users without messages (sorted alphabetically)
 * 
 */
export async function fileallusers() {
    // console.log('userlisthandler.js: fileallusers() called');
    
    // Fetch all users and conversations in parallel
    const [users, conversations] = await Promise.all([
        fetchUsers(),
        loadConversations()
    ]);
    
    // console.log('userlisthandler.js: Fetched', users.length, 'users and', conversations.length, 'conversations');
    
    // Organize users by activity (conversations first, then alphabetical)
    const organizedUsers = organizeUsersByActivity(users, conversations);
    
    // Store all users in chat state
    chatState.allUsers = organizedUsers;
    
    // Populate chatState.onlineUsers with nicknames of online users (from is_online property)
    chatState.onlineUsers = organizedUsers
        .filter(user => user.is_online === true)
        .map(user => user.nickname);
    
    // console.log('userlisthandler.js: chatState.allUsers filled with', organizedUsers.length, 'organized users');
    // console.log('userlisthandler.js: chatState.onlineUsers filled with', chatState.onlineUsers.length, 'online users:', chatState.onlineUsers);
    
    return organizedUsers;
}

