
/**
 * Users List View
 * Sets up and renders the users list for the chat feature.
 * Uses UsersListComponent to display all users with their online/offline status.
 * 
 * NOTE: chatState.onlineUsers stores array of nicknames (strings) only:
 * ["aaaaAAAA", "bbbbBBBB"]
 */

import { UsersListComponent } from '../components/chat/userslistcomponent.js';
import { createSearchComponent } from '../components/chat/searchComponent.js';
import { chatState } from '../ws/state.js';
import { fileallusers } from '../hanlders/chat/userlisthandler.js';
import { setupUsersListHandler } from '../hanlders/chat/userlisthandler.js';

/**
 * Sets up and renders the users list view.
 * Fetches all users if not already loaded, merges with online status,
 * and renders using UsersListComponent.
 * 
 * @param {HTMLElement|string} containerOrSelector - Container element or CSS selector
 * @returns {Promise<HTMLElement>} The users list container element
 */
export async function usersListView(containerOrSelector) {
    console.log('usersListView.js: usersListView() called');
    
    // Get or create container element
    let container;
    if (typeof containerOrSelector === 'string') {
        container = document.querySelector(containerOrSelector);
        if (!container) {
            console.error('usersListView.js: Container not found:', containerOrSelector);
            return null;
        }
    } else {
        container = containerOrSelector;
    }
    
    console.log('usersListView.js: Container found:', !!container);

    // Clear existing content
    container.innerHTML = '';

    // Fetch all users if not already loaded
    if (!chatState.allUsers || chatState.allUsers.length === 0) {
        console.log('usersListView.js: No users in state, fetching...');
        await fileallusers();
    }
    
    console.log('usersListView.js: chatState.allUsers has', chatState.allUsers.length, 'users');
    console.log('usersListView.js: chatState.onlineUsers has', chatState.onlineUsers.length, 'users:', chatState.onlineUsers);
    
    // Create a set of online nicknames for fast lookup
    const onlineNicknames = new Set(chatState.onlineUsers);
    console.log('usersListView.js: Online nicknames:', Array.from(onlineNicknames));
    
    // Merge allUsers with online status - match by nickname
    const usersWithStatus = chatState.allUsers.map(user => ({
        ...user,
        // Use nickname if available, otherwise fall back to name, username, or 'Unknown User'
        name: user.nickname || user.name || user.username || 'Unknown User',
        // Mark as online if user's nickname is in the online users set
        online: onlineNicknames.has(user.nickname)
    }));
    
    // Filter out the current user from the list
    const currentUserNickname = chatState.currentUser?.nickname;
    const currentUserId = chatState.currentUser?.id;
    const filteredUsers = usersWithStatus.filter(user => 
        user.nickname !== currentUserNickname && user.id !== currentUserId
    );
    setupSearch(container);
    console.log('usersListView.js: Users with status prepared:', filteredUsers.length, '(excluded current user)');
    
    // Store original users for filtering (keep full list for search)
    chatState.usersWithStatus = usersWithStatus;
    
    // Create the users list component with filtered users (excluding current user)
    const usersListComponent = UsersListComponent(filteredUsers);
    console.log('usersListView.js: UsersListComponent created');
    
    // Append to container
    container.appendChild(usersListComponent);
    console.log('usersListView.js: Users list component appended to container');
    
    // Store reference to container for updates
    chatState.usersListContainer = container;
    
    // Set up search functionality if search input exists
   
    
    // Set up event delegation handler for opening conversations
    // This uses a single listener on the container instead of one per user item
    setupUsersListHandler(container);
    
    return container;
}

/**
 * Sets up search/filter functionality for the users list.
 * Uses createSearchComponent to create the search input.
 * 
 * @param {HTMLElement} container - The users list container
 */
function setupSearch(container) {
    console.log('usersListView.js: Setting up search functionality');
    
    // Create search component using the new function
    const searchInput = createSearchComponent(container);
    
    if (!searchInput) {
        console.log('usersListView.js: Search input not created');
        return;
    }
    
    // Add search event listener
    searchInput.addEventListener('input', (event) => {
        const searchTerm = event.target.value.toLowerCase().trim();
        filterUsers(searchTerm);
    });
    
    console.log('usersListView.js: Search functionality set up');
}

/**
 * Filters users based on search term.
 * @param {string} searchTerm - The search term to filter by
 */
async function filterUsers(searchTerm) {
    const container = chatState.usersListContainer;
    if (!container || !chatState.usersWithStatus) {
        return;
    }
    
    console.log('usersListView.js: Filtering users with term:', searchTerm);
    
    // Clear current content
    container.innerHTML = '';
    
    // Filter users
    const filteredUsers = chatState.usersWithStatus.filter(user => {
        const name = (user.name || '').toLowerCase();
        const nickname = (user.nickname || '').toLowerCase();
        const username = (user.username || '').toLowerCase();
        const searchLower = searchTerm.toLowerCase();
        
        return name.includes(searchLower) || 
               nickname.includes(searchLower) || 
               username.includes(searchLower);
    });
    
    console.log('usersListView.js: Filtered to', filteredUsers.length, 'users');
    
    // Re-render with filtered users
    const usersListComponent = UsersListComponent(filteredUsers);
    container.appendChild(usersListComponent);
}

/**
 * Updates the users list view with current online status.
 * Call this function when online users change (e.g., on WebSocket events).
 * 
 * @returns {Promise<void>}
 */
export async function updateUsersListView() {
    console.log('usersListView.js: updateUsersListView() called');
    
    if (!chatState.usersListContainer) {
        console.log('usersListView.js: No container stored, calling usersListView()');
        await usersListView('#users-list-container');
        return;
    }
    
    // Re-render with updated online status
    await usersListView(chatState.usersListContainer);
}

/**
 * Updates a single user's online status in the view.
 * More efficient than full re-render when only one user changes status.
 * 
 * @param {string} nickname - The nickname whose status changed
 * @param {boolean} isOnline - The new online status
 */
export function updateUserOnlineStatus(nickname, isOnline) {
    console.log('usersListView.js: updateUserOnlineStatus() called for user', nickname, '- online:', isOnline);
    
    if (!chatState.usersListContainer) {
        console.log('usersListView.js: No container stored');
        return;
    }
    
    // Find the user item in the DOM by nickname
    const userItems = chatState.usersListContainer.querySelectorAll('.chat-user-item');
    for (const userItem of userItems) {
        // Get nickname from the DOM element
        const itemNickname = userItem.dataset.nickname || userItem.dataset.userId;
        // Compare as strings
        if (String(itemNickname) === String(nickname)) {
            const statusElement = userItem.querySelector('.chat-user-status');
            if (statusElement) {
                // Clear and update status
                statusElement.innerHTML = '';
                
                if (isOnline) {
                    const onlineDot = document.createElement('span');
                    onlineDot.classList.add('chat-online-dot');
                    statusElement.appendChild(onlineDot);
                    statusElement.appendChild(document.createTextNode('Online'));
                } else {
                    statusElement.textContent = 'Offline';
                }
                
                // Update the user's online status in usersWithStatus array
                // Match by nickname since onlineUsers stores nicknames
                const userWithStatus = chatState.usersWithStatus.find(u => u.nickname === nickname);
                if (userWithStatus) {
                    userWithStatus.online = isOnline;
                }
                
                console.log('usersListView.js: Updated status for user', userWithStatus?.name || nickname);
            }
            break;
        }
    }
}

