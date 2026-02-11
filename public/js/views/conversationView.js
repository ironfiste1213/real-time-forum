
import { setupBackButton } from '../hanlders/chat/backbuttonHandler.js';
import { conversationComponent } from '../components/chat/conversationComponent.js';
import { loadConversationHistory } from '../api/messages/conversationHistory.js';
import { chatState } from '../ws/state.js';
import { setupConversationInputListener, disableConversationInput, enableConversationInput } from '../hanlders/chat/conversationInputHandler.js';
import { clearCurrentMessages, storeConversationHistory, displayCurrentMessages } from '../ws/helperFunctions/privateMessagesHelper.js';
import { setupConversationScrollListener, initConversationPagination } from '../hanlders/chat/conversationScrollHandler.js';
import { transitionTo } from '../viewState.js';
import { updateTotalUnreadUI } from '../ws/helperFunctions/updateUnreadCounts.js';


export async function conversationView(containerOrSelector, userId) {
    // console.log('conversationView.js: conversationView() called with userId:', userId);
    
    // Get the dedicated conversation container
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
    
    // console.log('conversationView.js: Container found:', !!container);
    
    // FIX: Clear conversationContainer reference first to prevent stale references
    // This ensures displayCurrentMessages() doesn't use old container reference
    if (chatState.conversationContainer !== null) {
        // console.log('conversationView.js: Clearing stale conversationContainer reference');
        chatState.conversationContainer = null;
    }
    
    // Clear existing content
    container.innerHTML = '';
    // console.log('conversationView.js: Container cleared');
    
    // Clear current messages before loading new conversation
    clearCurrentMessages();
    // console.log('conversationView.js: Cleared currentMessages');

    // Look up the recipient's name from chatState
    let recipientName = 'Chat'; // Default fallback
    const userInAllUsers = chatState.allUsers.find(u => u.id === userId);
    if (userInAllUsers) {
        recipientName = userInAllUsers.nickname || userInAllUsers.username || 'Chat';
        console.log('conversationView.js: Found recipient name:', recipientName);
    } else {
        // Also check in conversations as fallback
        const conversation = chatState.conversations.find(c => c.partner_id === userId || c.user_id === userId);
        if (conversation) {
            recipientName = conversation.nickname || conversation.username || 'Chat';
            console.log('conversationView.js: Found recipient name in conversations:', recipientName);
        } else {
            console.log('conversationView.js: User not found, using default name');
        }
    }
    
    // Load conversation history
     console.log('====*****===conversationView.js: Loading conversation history for userId:', userId);

    const messages = await loadConversationHistory(userId);
    console.log('conversationView.js: Loaded', messages.length, 'messages');
    
    // Clear unread count for this conversation in chatState
    // The backend marks messages as read via the API call
    // Reuse the conversation variable if already defined, or find it
    const conversationForUnread = chatState.conversations.find(c => c.partner_id === userId || c.user_id === userId);
    if (conversationForUnread) {
        conversationForUnread.unread_count = 0;
    }
    // Also clear in allUsers - reuse userInAllUsers if available
    if (userInAllUsers) {
        userInAllUsers.unread_count = 0;
    } else {
        const userInAllUsersForUnread = chatState.allUsers.find(u => u.id === userId);
        if (userInAllUsersForUnread) {
            userInAllUsersForUnread.unread_count = 0;
        }
    }
    // Update total unread UI
    updateTotalUnreadUI();
    
    // Store the loaded messages in currentMessages
    storeConversationHistory(messages);
    // console.log('conversationView.js: Stored messages in currentMessages');
    
    // Create conversation component with recipient name
    const conversationEl = conversationComponent(recipientName);
    // console.log('conversationView.js: Conversation component created');
    
    // Set up input listener for sending messages
    setupConversationInputListener(conversationEl);
    // console.log('conversationView.js: Input listener set up');
    
    // Store reference to container for updates BEFORE displaying messages
    chatState.activeConversation = userId;
    chatState.conversationContainer = container;
    // console.log('conversationView.js: Set conversationContainer in chatState');

    // Append to container first - elements must exist before we can manipulate them
    container.appendChild(conversationEl);
    // console.log('conversationView.js: Conversation component appended to container');

    // Check if the recipient user is online and enable/disable input accordingly
    // This must happen AFTER the element is appended to the DOM
    const isRecipientOnline = chatState.onlineUsers.includes(recipientName);
    console.log('conversationView.js: Recipient userId', userId, 'is online:', isRecipientOnline);
    
    if (isRecipientOnline) {
        enableConversationInput();
    } else {
        disableConversationInput();
    }

    // Display messages from currentMessages (now populated)
    displayCurrentMessages(false);
    // console.log('conversationView.js: Displayed messages');
    
    // Set up scroll listener for loading more messages on scroll
    setupConversationScrollListener(conversationEl);
    // console.log('conversationView.js: Scroll listener set up');
    
    // Initialize pagination state for this conversation
    initConversationPagination(userId, messages.length);
    // console.log('conversationView.js: Pagination initialized');
    
    // Set up back button functionality
    setupBackButton(conversationEl);
    
    // Show conversation container, hide users list container
    container.classList.add('show');
    const usersContainer = document.querySelector('#users-list-container');
    if (usersContainer) {
        usersContainer.classList.remove('show');
    }
    
    return container;
}

