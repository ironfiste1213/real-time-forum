/**
 * Conversation Component
 * Creates a conversation view with navbar, messages area, and input.
 * Used for individual chat conversations in the chat panel.
 */

export function conversationComponent() {
    console.log('conversationComponent.js: conversationComponent() called');

    // Create the main conversation container
    const container = document.createElement('div');
    container.className = 'conversation-container';
    container.setAttribute('data-has-conversation-listener', 'true');

    // Navbar with back button and title
    const navbar = document.createElement('div');
    navbar.className = 'conversation-navbar';
    navbar.setAttribute('data-has-conversation-listener', 'true');

    // Back button "<"
    const backButton = document.createElement('button');
    backButton.className = 'conversation-back-btn';
    backButton.innerHTML = '<';
    backButton.title = 'Back to users list';
    backButton.setAttribute('data-has-conversation-listener', 'true');
    navbar.appendChild(backButton);

    // Conversation title
    const title = document.createElement('span');
    title.className = 'conversation-title';
    title.textContent = 'Chat';
    navbar.appendChild(title);

    // Navbar controls (optional spacer for balance)
    const controls = document.createElement('div');
    controls.className = 'conversation-navbar-controls';
    navbar.appendChild(controls);

    container.appendChild(navbar);

    // Messages area - this div will be used to render messages
    const messagesArea = document.createElement('div');
    messagesArea.className = 'conversation-messages';
    messagesArea.id = 'conversation-messages';
    container.appendChild(messagesArea);

    // Input area
    const inputArea = document.createElement('div');
    inputArea.className = 'conversation-input-area';

    // Text input
    const messageInput = document.createElement('input');
    messageInput.type = 'text';
    messageInput.placeholder = 'Type a message...';
    messageInput.className = 'conversation-input';
    messageInput.id = 'conversation-input';
    inputArea.appendChild(messageInput);

    // Send button
    const sendButton = document.createElement('button');
    sendButton.className = 'conversation-send-btn';
    sendButton.textContent = 'Send';
    sendButton.setAttribute('data-has-chat-listener', 'true');
    inputArea.appendChild(sendButton);

    container.appendChild(inputArea);

    console.log('conversationComponent.js: Conversation component created successfully');
    return container;
}

