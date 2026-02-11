import { postsHandler } from "./postFeedHandler.js";
import { createPostToggleHandler } from "../creatPostHandlers/postToggeleHandler.js";
import { createPostHandler } from "../creatPostHandlers/creatPostHandler.js";
import { attachPostClickListeners } from "./postClicklistener.js";
import { categoriesHandler } from "../creatPostHandlers/categoriesHandler.js";
import { logoutHandler } from "../authHandlers/logoutLogic.js";
import { attachChatButtonListener } from "../chat/chatButtonHandler.js";
import { initWebSocket } from '../../ws/connection.js';
import { chatState } from '../../ws/state.js';
import { updateTotalUnreadUI } from '../../ws/helperFunctions/updateUnreadCounts.js';
import { initChatButton } from "../../components/mainfeedComponent/chatButtonComponent.js";
/**
 * Shared Main Feed Handlers
 * These handlers are shared between mainView and singlePostView.
 * They handle UI elements that exist in both views: navigation, create post, categories, logout, etc.
 * 
 */
export function sharedMainFeedHandlers(rootContainer, user) {
    if (!rootContainer) {
        return;
    }
    // Set current user in chat state for WebSocket handlers to reference
    chatState.currentUser = user;
    // Handle logout button (shared - exists in both views)
    logoutHandler(rootContainer);
    // Handle create post toggle (shared - exists in both views)
    createPostToggleHandler();
    // Handle categories (shared - load into #categories-container)
    categoriesHandler();
// Initialize chat button once and append to body directly
    initChatButton();
    // Handle create post form (shared - handles #create-post-form)
    createPostHandler(rootContainer);
    updateTotalUnreadUI()
    // Handle chat button (shared - toggle users list panel)
    attachChatButtonListener();
    // Initialize WebSocket connection for logged-in user (only if not already connected)
    if (user && user.id && (!chatState.ws || !chatState.isConnected)) {
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
    // Handle posts feed (specific to main view)
    postsHandler();
    // Handle post click listeners for post details navigation (specific to main view)
    attachPostClickListeners();
}
/**
 * Main Feed Handler (Legacy - kept for backward compatibility)
 * Combines shared handlers and post-list specific handlers.
 * 
 *  Use sharedMainFeedHandlers() + postListHandlers() instead for better separation
 */
export function mainFeedHandler(rootContainer) {
    //console.log('mainFeedHandlers.js: mainFeedHandler() called with rootContainer:', !!rootContainer);
    // Call shared handlers
    sharedMainFeedHandlers(rootContainer);
    // Call post-list specific handlers
    postListHandlers();
}

