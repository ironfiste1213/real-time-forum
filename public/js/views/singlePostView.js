import { sharedMainFeedHandlers } from '../hanlders/mainFeedHandlers/mainFeedHandlers.js';
import { createMainFeedContent } from '../components/mainfeedComponent/mainFeedContainer.js';
import { postDetailsHandler } from '../hanlders/postDetailsHandlers/postDetailsHandler.js';
import { transitionTo } from '../viewState.js';

/**
 * Post Details View
 * Renders the full post details when navigating to a specific post directly via URL.
 * 
 * Composition pattern:
 * - Always initializes shared layout (navbar, create-post, chat button)
 * - Attaches shared handlers (logout, create-post toggle, categories)
 * - DOES NOT attach post-list handlers (no posts feed, no click listeners)
 * - Renders single post details in the post-feed-section area
 * 
 * This ensures that shared UI and logic (nav, logout, create-post) are NOT duplicated
 * when a user enters directly via URL to a single post.
 * 
 * @param {number} postId - The ID of the post to display
 * @param {Object} user - The current user object
 */
export function singlePostView(postId, user) {
    // Use transitionTo to handle cleanup and view state in one call
    transitionTo('singlePostView', () => {
        console.log('view.js: singlePostView() called with postId:', postId);
        
        const rootContainer = document.querySelector('#app');
        if (!rootContainer) {
            console.error('view.js: #app element not found');
            return;
        }
        
        // Always initialize shared layout first (navbar, create-post, chat button)
        // This ensures shared UI is available even when entering via direct URL
        rootContainer.innerHTML = '';
        const mainContent = createMainFeedContent(user);
        rootContainer.appendChild(mainContent);
        console.log('view.js: Shared layout initialized');

        // Attach shared handlers (includes logout, create-post toggle, categories, initWebSocket)
        sharedMainFeedHandlers(rootContainer, user);
        console.log('view.js: Shared handlers attached');

        // Render single post details in the post-feed-section
        // Note: postDetailsHandler expects #post-feed-section to exist
        // which is created by createMainFeedContent()
        postDetailsHandler(postId);
        console.log('view.js: Post details rendered');
        
        console.log('view.js: singlePostView() completed');
    });
}

