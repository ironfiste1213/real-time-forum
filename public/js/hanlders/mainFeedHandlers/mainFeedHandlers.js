import { postsHandler } from "./postFeedHandler.js";
import { createPostToggleHandler } from "../creatPostHandlers/postToggeleHandler.js";
import { createPostHandler } from "../creatPostHandlers/creatPostHandler.js";
import { attachPostClickListeners } from "./postClicklistener.js";
import { categoriesHandler } from "../creatPostHandlers/categoriesHandler.js";
import { logoutHandler } from "../authHandlers/logoutLogic.js";
import { attachChatButtonListener } from "../chat/chatButtonHandler.js";
import { initWebSocket } from '../../ws/connection.js';
import { chatState } from '../../ws/state.js';

/**
 * Shared Main Feed Handlers
 * These handlers are shared between mainView and singlePostView.
 * They handle UI elements that exist in both views: navigation, create post, categories, logout, etc.
 * 
 * @param {HTMLElement} rootContainer - The root container element
 * @param {Object} user - The current user object (for WebSocket initialization)
 */
export function sharedMainFeedHandlers(rootContainer, user) {
    console.log('mainFeedHandlers.js: sharedMainFeedHandlers() called with rootContainer:', !!rootContainer);
    
    if (!rootContainer) {
        console.log('mainFeedHandlers.js: No rootContainer provided');
        return;
    }

    // Set current user in chat state for WebSocket handlers to reference
    chatState.currentUser = user;
    console.log('mainFeedHandlers.js: chatState.currentUser set to:', user?.id);

    // Handle logout button (shared - exists in both views)
    logoutHandler(rootContainer);
    console.log('mainFeedHandlers.js: logoutHandler() called');

    // Handle create post toggle (shared - exists in both views)
    createPostToggleHandler();
    console.log('mainFeedHandlers.js: createPostToggleHandler() called');

    // Handle categories (shared - load into #categories-container)
    categoriesHandler();
    console.log('mainFeedHandlers.js: categoriesHandler() called');

    // Handle create post form (shared - handles #create-post-form)
    createPostHandler(rootContainer);
    console.log('mainFeedHandlers.js: createPostHandler() called');

    // Handle chat button (shared - toggle users list panel)
    attachChatButtonListener();
    console.log('mainFeedHandlers.js: attachChatButtonListener() called');

    // Initialize WebSocket connection for logged-in user
    if (user && user.id) {
        console.log('mainFeedHandlers.js: Initializing WebSocket connection for user:', user.id);
         const wsUrl = `ws://localhost:8087/ws?user_id=${user.id}`;  
      
        initWebSocket(wsUrl);
    }
}

/**
 * Post List Handlers
 * These handlers are specific to the main feed view (post list).
 * They should NOT be called when viewing a single post directly.
 */
export function postListHandlers() {
    console.log('mainFeedHandlers.js: postListHandlers() called');

    // Handle posts feed (specific to main view)
    postsHandler();
    console.log('mainFeedHandlers.js: postsHandler() called');

    // Handle post click listeners for post details navigation (specific to main view)
    attachPostClickListeners();
    console.log('mainFeedHandlers.js: attachPostClickListeners() called');
}

/**
 * Main Feed Handler (Legacy - kept for backward compatibility)
 * Combines shared handlers and post-list specific handlers.
 * 
 * @param {HTMLElement} rootContainer - The root container element
 *  Use sharedMainFeedHandlers() + postListHandlers() instead for better separation
 */
export function mainFeedHandler(rootContainer) {
    console.log('mainFeedHandlers.js: mainFeedHandler() called with rootContainer:', !!rootContainer);
    
    // Call shared handlers
    sharedMainFeedHandlers(rootContainer);
    
    // Call post-list specific handlers
    postListHandlers();
}

