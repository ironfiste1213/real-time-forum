/**
 * Users List Component for Chat Panel
 * Creates user items with avatar, name, and online status for the small chat panel.
 */

import { conversationView } from '../../views/conversationView.js';
import { transitionTo } from '../../viewState.js';

export function UsersListComponent(users) {
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
        console.log('userslistcomponent.js: Processing user:', user.name, '- Online:', user.online);
        
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
        
        // User name
        const userName = document.createElement('div');
        userName.classList.add('chat-user-name');
        userName.textContent = user.name || 'Unknown User';
        userInfo.appendChild(userName);
        
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

/**
 * Open conversation with a specific user
 * Uses transitionTo to clear users list listeners before showing conversation
 * @param {number} userId - The user ID to open conversation with
 */
export async function openConversation(userId) {
    console.log('userslistcomponent.js: openConversation() called with userId:', userId);
    
    // Find the chat panel users container
    const usersContainer = document.querySelector('#users-list-container');
    if (!usersContainer) {
        console.error('userslistcomponent.js: Users container not found');
        return;
    }
    
    console.log('userslistcomponent.js: Users container found, opening conversation...');
    
    // Use transitionTo to handle cleanup of users list listeners before showing conversation
    // Pass usersContainer and userId as args to avoid variable shadowing
    // The callback receives the passed args: container and recipientId
    await transitionTo('conversation', (container, recipientId) => {
        conversationView(container, recipientId);
    }, {
        container: usersContainer,
        dataAttribute: 'data-has-users-listener'
    }, usersContainer, userId);
    
    console.log('userslistcomponent.js: Conversation opened for userId:', userId);
}

