import { conversationView } from "../../views/conversationView.js";
import { transitionTo } from "../../viewState.js";

/**
 * Opens a conversation with a specific user.
 * Uses transitionTo to handle cleanup of users list listeners before showing conversation.
 * 
 */
export async function openConversation({ userId }) {
    console.log('conversationHandler.js: openConversation() called with userId:', userId);
    
    // Find the chat panel users container
    const usersContainer = document.querySelector('#conversation-container');
    if (!usersContainer) {
        console.error('conversationHandler.js: Users container not found');
        return;
    }
    
    console.log('conversationHandler.js: Users container found, opening conversation...');
    
    // Use transitionTo to handle cleanup of users list listeners before showing conversation
    await transitionTo('conversation', (container, recipientId) => {
        conversationView(container, recipientId);
    }, {
        container: usersContainer,
        dataAttribute: 'data-has-users-listener'
    }, usersContainer, userId);
    
    console.log('conversationHandler.js: Conversation opened for userId:', userId);
}
