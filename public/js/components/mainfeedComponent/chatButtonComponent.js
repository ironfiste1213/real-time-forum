// Create floating chat button (exported for use in views.js)
export function createFloatingChatButton() {
    console.log('chatButtonComponent.js: createFloatingChatButton() called');
    
    const floatingChatButton = document.createElement('button');
    floatingChatButton.id = 'floating-chat-btn';
    floatingChatButton.className = 'floating-chat-btn';
    floatingChatButton.title = 'Open Chat';
    floatingChatButton.setAttribute('data-has-chat-listener', 'true'); // Mark as having chat event listener
    console.log('chatButtonComponent.js: Floating chat button element created');

    const labelShort = document.createElement('span');
    labelShort.className = 'label-short';
    labelShort.textContent = '💬';
    floatingChatButton.appendChild(labelShort);

    const labelFull = document.createElement('span');
    labelFull.className = 'label-full';
    labelFull.textContent = ' chat ! 💬';
    floatingChatButton.appendChild(labelFull);
    console.log('chatButtonComponent.js: Labels added to button');

    console.log('chatButtonComponent.js: Floating chat button created successfully');
    return floatingChatButton;
}

