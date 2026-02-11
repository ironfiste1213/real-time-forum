
import { UsersListComponent } from '../components/chat/userslistcomponent.js';
import { chatState } from '../ws/state.js';
import { fileallusers } from '../hanlders/chat/userlisthandler.js';
import { setupUsersListHandler } from '../hanlders/chat/userlisthandler.js';


export async function usersListView(containerOrSelector) {
    // console.log('usersListView.js: usersListView() called');
    
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
    
    // console.log('usersListView.js: Container found:', !!container);

    // Clear existing content
    container.innerHTML = '';

   
    await fileallusers();
    // console.log('usersListView.js: chatState.allUsers has', chatState.allUsers.length, 'users');
    
    // Merge allUsers with online status - use is_online from HTTP response
    const usersWithStatus = chatState.allUsers.map(user => ({
        ...user,
        // Use nickname if available, otherwise fall back to name, username, or 'Unknown User'
        name: user.nickname || user.name || user.username || 'Unknown User',
        // Use is_online from the HTTP response (directly from hub)
        online: user.is_online || false
    }));
    console.log("--------------",usersWithStatus)
    // Filter out the current user from the list
    const currentUserNickname = chatState.currentUser?.nickname;
    const currentUserId = chatState.currentUser?.id;
    const filteredUsers = usersWithStatus.filter(user => 
        user.nickname !== currentUserNickname && user.id !== currentUserId
    );
    chatState.usersWithStatus = usersWithStatus;
    // console.log("filteredUsers ::",filteredUsers)
    // Create the users list component with filtered users (excluding current user)
    const usersListComponent = UsersListComponent({ users: filteredUsers });
    // console.log('usersListView.js: UsersListComponent created');
    
    // Append to container 
    container.appendChild(usersListComponent);
    // console.log('usersListView.js: Users list component appended to container');
    
    // Store reference to container for updates
    chatState.usersListContainer = container;
    
 
    const newContainer = container.cloneNode(true);
    if (container.parentNode) {
        container.parentNode.replaceChild(newContainer, container);
        chatState.usersListContainer = newContainer;
    }
    
    setupUsersListHandler(chatState.usersListContainer);
    
    return container;
}



export async function updateUsersListView() {
    // console.log('usersListView.js: updateUsersListView() called');
    
    if (!chatState.usersListContainer) {
        // console.log('usersListView.js: No container stored, calling usersListView()');
        await usersListView('#users-list-container');
        return;
    }
    
    // Re-render with updated online status
    await usersListView(chatState.usersListContainer);
}

export function updateUserOnlineStatus(userId, isOnline) {
    // console.log('usersListView.js: updateUserOnlineStatus() called for userId', userId, '- online:', isOnline);
    
    if (!chatState.usersListContainer) {
        // console.log('usersListView.js: No container stored');
        return;
    }
    
    // Find the user item in the DOM by userId
    const userItems = chatState.usersListContainer.querySelectorAll('.chat-user-item');
    for (const userItem of userItems) {
        // Get userId from the DOM element
        const itemUserId = parseInt(userItem.dataset.userId || userItem.dataset.nickname);
        // Compare as numbers
        if (itemUserId === userId) {
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
                // Match by user ID since onlineUsers stores user IDs
                const userWithStatus = chatState.usersWithStatus.find(u => u.id === userId);
                if (userWithStatus) {
                    userWithStatus.online = isOnline;
                }
                
                // console.log('usersListView.js: Updated status for user', userWithStatus?.name || userId);
            }
            break;
        }
    }
}

