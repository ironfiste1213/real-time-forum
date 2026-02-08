/**
 * Chat Panel Component
 * Creates a small floating chat panel (like Facebook Messenger).
 * This panel is toggled by the floating chat button.
 */

export function createChatPanel() {
    console.log('chatPanelComponent.js: createChatPanel() called');
    
    // Create the main chat panel container
    const panel = document.createElement('div');
    panel.className = 'chat-panel';
    panel.id = 'chat-panel';
    panel.setAttribute('data-has-chat-listener', 'true');
    
    // Header with title and controls
    const header = document.createElement('div');
    header.className = 'chat-panel-header';
    header.setAttribute('data-has-chat-listener', 'true');
    
    const title = document.createElement('span');
    title.className = 'chat-panel-title';
    title.textContent = 'Users';
    header.appendChild(title);
    
    const controls = document.createElement('div');
    controls.className = 'chat-panel-controls';
    
    const minimizeBtn = document.createElement('button');
    minimizeBtn.className = 'chat-panel-btn minimize-btn';
    minimizeBtn.innerHTML = '−';
    minimizeBtn.title = 'Minimize';
    minimizeBtn.setAttribute('data-has-chat-listener', 'true');
    controls.appendChild(minimizeBtn);
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'chat-panel-btn close-btn';
    closeBtn.innerHTML = '✕';
    closeBtn.title = 'Close';
    closeBtn.setAttribute('data-has-chat-listener', 'true');
    controls.appendChild(closeBtn);
    
    header.appendChild(controls);
    panel.appendChild(header);

    // Users list container
    const usersContainer = document.createElement('div');
    usersContainer.className = 'chat-panel-users';
    usersContainer.id = 'users-list-container';
    
    const loadingMessage = document.createElement('div');
    loadingMessage.className = 'chat-panel-loading';
    loadingMessage.textContent = 'Loading users...';
    usersContainer.appendChild(loadingMessage);
    
    panel.appendChild(usersContainer);
    
    console.log('chatPanelComponent.js: Chat panel created successfully');
    return panel;
}

