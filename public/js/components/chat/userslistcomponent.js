/**
 * Users List Component for Chat Panel
 * Creates user items with avatar, name, online status, and unread message badge for the small chat panel.
 */

export function UsersListComponent({ users }) {
    console.log('userslistcomponent.js: UsersListComponent() called with', users ? users.length : 0, 'users');
    
    // Create container div for the users list
    const container = document.createElement('div');
    container.classList.add('chat-panel-users-list');
    container.setAttribute('data-has-users-listener', 'true');
    console.log('userslistcomponent.js: Users list container created');

    // Check if users array is provided and has elements
    if (!users || users.length === 0) {
        console.log('userslistcomponent.js: No users provided');
        const noUsersMessage = document.createElement('div');
        noUsersMessage.classList.add('chat-panel-empty');
        noUsersMessage.textContent = 'No users available';
        container.appendChild(noUsersMessage);
        return container;
    }

    // Create a div for each user
    users.forEach((user, index) => {
        console.log('userslistcomponent.js: Processing user:', user.name, '- Online:', user.online, '- Unread:', user.unread_count);
        
        const userItem = document.createElement('div');
        userItem.classList.add('chat-user-item');
        userItem.dataset.userIndex = index;
        userItem.dataset.userId = user.id;

        // User avatar
        const avatar = document.createElement('div');
        avatar.classList.add('chat-user-avatar');
        // Use first letter of name or username
        const initial = (user.name || user.nickname || user.username || 'U').charAt(0).toUpperCase();
        avatar.textContent = initial;
        userItem.appendChild(avatar);

        // User info container
        const userInfo = document.createElement('div');
        userInfo.classList.add('chat-user-info');
        
        // User name row with unread badge
        const nameRow = document.createElement('div');
        nameRow.classList.add('chat-user-name-row');
        
        // User name
        const userName = document.createElement('div');
        userName.classList.add('chat-user-name');
        userName.textContent = user.name || 'Unknown User';
        nameRow.appendChild(userName);
        
        // Unread badge - red dot/count next to username
        if (user.unread_count > 0) {
            const unreadBadge = document.createElement('span');
            unreadBadge.classList.add('chat-unread-badge-user');
            
            if (user.unread_count > 99) {
                unreadBadge.textContent = '99+';
            } else {
                unreadBadge.textContent = user.unread_count;
            }
            nameRow.appendChild(unreadBadge);
            console.log('userslistcomponent.js: Added unread badge for user', user.name, '- count:', user.unread_count);
        }
        
        userInfo.appendChild(nameRow);
        
        // User status
        const userStatus = document.createElement('div');
        userStatus.classList.add('chat-user-status');
        
        if (user.online) {
            const onlineDot = document.createElement('span');
            onlineDot.classList.add('chat-online-dot');
            userStatus.appendChild(onlineDot);
            userStatus.appendChild(document.createTextNode('Online'));
            console.log('userslistcomponent.js: User', user.name, 'is online');
        } else {
            userStatus.textContent = 'Offline';
            console.log('userslistcomponent.js: User', user.name, 'is offline');
        }
        
        userInfo.appendChild(userStatus);
        userItem.appendChild(userInfo);
        container.appendChild(userItem);
    });

    console.log('userslistcomponent.js: Users list component created successfully with', users.length, 'users');
    return container;
}

