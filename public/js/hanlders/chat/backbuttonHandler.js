import { transitionTo, ViewState } from "../../viewState.js";
import { clearCurrentMessages } from "../../ws/helperFunctions/privateMessagesHelper.js";
import { usersListView } from "../../views/usersListView.js";
import { chatState } from "../../ws/state.js";

/**
 * Set up the back button in conversation to return to users list
 * 
 * transitionTo handles:
 * 1. Clearing listeners from conversation container (data-has-conversation-listener)
 * 2. Then we render users list in the callback
 */
export function setupBackButton(conversationEl) {
    const backButton = conversationEl.querySelector('.conversation-back-btn');
    if (!backButton) {
        return;
    }
    
    backButton.addEventListener('click', () => {
        // Get both containers
        const conversationContainer = document.querySelector('#conversation-container');
        const usersContainer = document.querySelector('#users-list-container');
        
        // Clear conversation container reference
        chatState.conversationContainer = null;
        
        // Clear current messages when leaving conversation
        clearCurrentMessages();
        
        // Clear active conversation state
        chatState.activeConversation = null;
        
        // Track previous view before transitionTo modifies it
        const previousView = ViewState.currentView;
        
        // transitionTo clears listeners from conversationContainer, then we render users list
        if (usersContainer) {
            transitionTo('usersList', () => {
                // Clear conversation container first (after listeners are cleared)
                if (conversationContainer) {
                    conversationContainer.innerHTML = '';
                    conversationContainer.classList.remove('show');
                }
                
                // Show users list
                usersContainer.classList.add('show');
                
                // Only render users list if we were NOT already on usersList view
                // This prevents duplicate event listeners from being set up
                if (previousView !== 'usersList') {
                    return usersListView(usersContainer);
                }
                return usersContainer;
            }, {
                container: conversationContainer,
                dataAttribute: 'data-has-conversation-listener'
            });
        }
    });
}

