/**
 * Chat Button Handler
 * Handles the floating chat button click to show/hide the small chat panel.
 */

import { createChatPanel } from '../../components/chat/chatPanelComponent.js';
import { usersListView } from '../../views/usersListView.js';
import { chatState } from '../../ws/state.js';
import { clearEventListeners } from '../../tools/dom/clearEventListeners.js';

let hidePanelTimeout = null;

/**
 * Toggles the chat panel visibility.
 * Creates the panel if it doesn't exist, otherwise toggles its visibility.
 */
export function chatButtonHandler() {
    console.log('chatButtonHandler.js: chatButtonHandler() called');
    
    let chatPanel = document.querySelector('#chat-panel');
    
    if (chatPanel) {
        // Panel exists, toggle visibility
        toggleChatPanel(chatPanel);
    } else {
        // Create and show the panel
        showChatPanel();
    }
}

/**
 * Shows the chat panel and loads the users list.
 */
function showChatPanel() {
    console.log('chatButtonHandler.js: showChatPanel() called');

    // Clear any existing hide timeout
    if (hidePanelTimeout) {
        clearTimeout(hidePanelTimeout);
        hidePanelTimeout = null;
    }

    // Create the chat panel
    const chatPanel = createChatPanel();

    // Add to the body
    document.body.appendChild(chatPanel);
    console.log('chatButtonHandler.js: Chat panel appended to body');

    // Show the panel with animation - add expanded class
    requestAnimationFrame(() => {
        chatPanel.classList.add('show', 'expanded');
    });

    // Update chat state
    chatState.isChatOpen = true;

    // Load the users list
    const usersContainer = chatPanel.querySelector('#users-list-container');
    if (usersContainer) {
        // Ensure users list is visible
        usersContainer.classList.add('show');
        // Ensure conversation container is hidden
        const conversationContainer = chatPanel.querySelector('#conversation-container');
        if (conversationContainer) {
            conversationContainer.classList.remove('show');
        }
        usersListView(usersContainer);
    }

    // Add close button event listener
    const closeBtn = chatPanel.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            hideChatPanel(chatPanel);
        });
    }

    // Add minimize button event listener
    const minimizeBtn = chatPanel.querySelector('.minimize-btn');
    if (minimizeBtn) {
        minimizeBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            minimizeChatPanel(chatPanel);
        });
    }

    // Make the panel draggable
    makeDraggable(chatPanel);
}

/**
 * Hides the chat panel.
 * @param {HTMLElement} chatPanel - The chat panel element to hide
 */
function hideChatPanel(chatPanel) {
    console.log('chatButtonHandler.js: hideChatPanel() called');

    chatPanel.classList.remove('show');
    chatPanel.classList.add('hide');

    // Remove after animation
    hidePanelTimeout = setTimeout(() => {
        if (chatPanel.parentNode) {
            chatPanel.parentNode.removeChild(chatPanel);
        }
    }, 300);

    // Update chat state
    chatState.isChatOpen = false;
}

/**
 * Minimizes the chat panel (small version).
 * @param {HTMLElement} chatPanel - The chat panel element to minimize
 */
function minimizeChatPanel(chatPanel) {
    console.log('chatButtonHandler.js: minimizeChatPanel() called');
    
    chatPanel.classList.remove('expanded');
    chatPanel.classList.add('minimized');
    
    // Update chat state
    chatState.isChatOpen = false;
    
    // Make the header clickable to expand
    const header = chatPanel.querySelector('.chat-panel-header');
    if (header) {
        header.addEventListener('click', () => expandChatPanel(chatPanel), { once: true });
    }
}

/**
 * Expands the chat panel from minimized state.
 * @param {HTMLElement} chatPanel - The chat panel element to expand
 */
function expandChatPanel(chatPanel) {
    console.log('chatButtonHandler.js: expandChatPanel() called');

    chatPanel.classList.remove('minimized');
    chatPanel.classList.add('expanded');

    // Update chat state
    chatState.isChatOpen = true;

    // Reset container states - show users list, hide conversation
    const usersContainer = chatPanel.querySelector('#users-list-container');
    const conversationContainer = chatPanel.querySelector('#conversation-container');

    if (usersContainer) {
        usersContainer.classList.add('show');
    }
    if (conversationContainer) {
        conversationContainer.classList.remove('show');
    }

    // Re-add button event listeners
    const closeBtn = chatPanel.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            hideChatPanel(chatPanel);
        });
    }

    const minimizeBtn = chatPanel.querySelector('.minimize-btn');
    if (minimizeBtn) {
        minimizeBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            minimizeChatPanel(chatPanel);
        });
    }
}

/**
 * Toggles the chat panel visibility.
 * @param {HTMLElement} chatPanel - The chat panel element
 */
function toggleChatPanel(chatPanel) {
    console.log('chatButtonHandler.js: toggleChatPanel() called');
    
    if (chatPanel.classList.contains('minimized')) {
        expandChatPanel(chatPanel);
    } else if (chatPanel.classList.contains('expanded') || chatPanel.classList.contains('show')) {
        hideChatPanel(chatPanel);
    } else {
        showChatPanel();
    }
}

/**
 * Makes the chat panel draggable.
 * @param {HTMLElement} panel - The chat panel element
 */
function makeDraggable(panel) {
    const header = panel.querySelector('.chat-panel-header');
    if (!header) return;
    
    let isDragging = false;
    let startX, startY, initialX, initialY;
    
    header.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        initialX = panel.offsetLeft;
        initialY = panel.offsetTop;
        panel.style.transition = 'none';
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        
        panel.style.left = `${initialX + dx}px`;
        panel.style.top = `${initialY + dy}px`;
        panel.style.right = 'auto';
        panel.style.bottom = 'auto';
    });
    
    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            panel.style.transition = '';
        }
    });

   
}

/**
 * Tracks whether the chat button listener has already been attached
 * @type {boolean}
 */
let chatButtonListenerAttached = false;

/**
 * Attaches the chat button click listener.
 * This function is idempotent - calling it multiple times won't add duplicate listeners.
 */
export function attachChatButtonListener() {
    // Prevent duplicate listener attachment
    if (chatButtonListenerAttached) {
        //console.log('chatButtonHandler.js: Chat button listener already attached, skipping');
        return;
    }
    
    const chatButton = document.querySelector('#floating-chat-btn');
    if (chatButton) {
        chatButton.addEventListener('click', (event) => {
            event.stopPropagation();
            chatButtonHandler();
        });
        chatButtonListenerAttached = true;
        //console.log('chatButtonHandler.js: Chat button listener attached');
    } else {
        console.warn('chatButtonHandler.js: Chat button not found');
    }
}

/**
 * Resets the listener attachment flag (useful for testing or cleanup)
 */
export function resetChatButtonListenerFlag() {
    chatButtonListenerAttached = false;
}

/**
 * Clear chat event listeners from elements with data-has-chat-listener attribute.
 * Should be called during logout to clean up chat-specific listeners.
 */
export function clearChatEventListeners() {
    console.log('[ChatHandler] Clearing chat event listeners...');

    // Use the reusable clearEventListeners function
    clearEventListeners(document, 'data-has-chat-listener');

    // Also remove the chat panel from DOM if it exists
    const chatPanel = document.querySelector('#chat-panel');
    if (chatPanel && chatPanel.parentNode) {
        chatPanel.parentNode.removeChild(chatPanel);
        console.log('[ChatHandler] Chat panel removed from DOM');
    }

    // Reset chat state
    chatState.isChatOpen = false;

    console.log('[ChatHandler] Chat event listener cleanup complete');
}

