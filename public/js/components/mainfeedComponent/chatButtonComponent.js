// Create floating chat button (exported for use in views.js)
export function createFloatingChatButton() {
    //console.log('chatButtonComponent.js: createFloatingChatButton() called');
    
    const floatingChatButton = document.createElement('button');
    floatingChatButton.id = 'floating-chat-btn';
    floatingChatButton.className = 'floating-chat-btn';
    floatingChatButton.title = 'Open Chat';
    floatingChatButton.setAttribute('data-has-chat-listener', 'true'); // Mark as having chat event listener
    //console.log('chatButtonComponent.js: Floating chat button element created');

    const labelShort = document.createElement('span');
    labelShort.className = 'label-short';
    labelShort.textContent = '💬';
    floatingChatButton.appendChild(labelShort);

    const labelFull = document.createElement('span');
    labelFull.className = 'label-full';
    labelFull.textContent = ' chat ! 💬';
    floatingChatButton.appendChild(labelFull);
   // console.log('chatButtonComponent.js: Labels added to button');

    //console.log('chatButtonComponent.js: Floating chat button created successfully');
    return floatingChatButton;
}

/**
 * Initialize the chat button - creates it once and appends to body directly.
 * This function is idempotent - calling it multiple times won't create duplicates.
 */
export function initChatButton() {
    // Check if the chat button already exists in the DOM
    let floatingChatButton = document.querySelector('#floating-chat-btn');
    
    if (floatingChatButton) {
        //console.log('chatButtonComponent.js: Chat button already exists, returning existing element');
        return floatingChatButton;
    }
    
    // Create and append to body
    floatingChatButton = createFloatingChatButton();
    document.body.appendChild(floatingChatButton);
    //console.log('chatButtonComponent.js: Chat button created and appended to body');
    
    return floatingChatButton;
}

