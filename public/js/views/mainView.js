import { sharedMainFeedHandlers, postListHandlers } from '../hanlders/mainFeedHandlers/mainFeedHandlers.js';
import { createMainFeedContent } from '../components/mainfeedComponent/mainFeedContainer.js';
import { transitionTo } from '../viewState.js';
import { updateTotalUnreadUI } from '../ws/helperFunctions/updateUnreadCounts.js';

/**
 * Main View (Home/Feed)
 * Renders the main feed with posts, create post section, etc.
 * 
 * Composition pattern:
 * - Builds shared layout (navbar, create-post, chat button)
 * - Attaches shared handlers (logout, create-post toggle, categories, initWebSocket)
 * - Attaches post-list specific handlers (posts feed, click listeners)
 * 
 * @param {Object} user - The current user object
 */
export function mainview(user) {
    // Use transitionTo to handle cleanup and view state in one call
    transitionTo('mainview', () => {
        console.log('view.js: mainview() called');

        const rootContainer = document.querySelector('#app');
        console.log('view.js: Found #app element:', !!rootContainer);

        // Build shared layout (navbar, create-post, chat button)
        rootContainer.innerHTML = '';
        const mainContent = createMainFeedContent(user);
        rootContainer.appendChild(mainContent);
        console.log('view.js: Main feed content created and appended');
        
        // Attach shared handlers (includes logout, create-post toggle, categories, initWebSocket)
        sharedMainFeedHandlers(rootContainer, user);
        console.log('view.js: Shared handlers attached');

        // Attach post-list specific handlers (ONLY for main feed view)
        postListHandlers();
        console.log('view.js: Post list handlers attached');
    });
}

