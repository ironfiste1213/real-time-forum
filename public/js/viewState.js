/**
 * View State Management
 * Simplified: tracks current view and provides view transition utilities
 *
 * Key insight: Instead of tracking previous view and complex transitions,
 * we simply clear event listeners before ANY view renders. This is simpler
 * and equally effective for preventing memory leaks.
 */

import { clearEventListeners } from './tools/dom/clearEventListeners.js';

export const pathState = {
    lastvalidpath: null
}

/**
 * Posts Pagination State
 * Tracks the chunk index for posts pagination so when users return 
 * to the main view, they see posts from their last position.
 */
export const postsPaginationState = {
    currentChunk: 0,
    
    /**
     * Set the current chunk index
     * @param {number} chunk - The chunk index to set
     */
    setChunk(chunk) {
        this.currentChunk = chunk;
        console.log(`[postsPaginationState] Chunk set to: ${this.currentChunk}`);
    },
    
    /**
     * Get the current chunk index
     * @returns {number} The current chunk index
     */
    getChunk() {
        return this.currentChunk;
    },
    
    /**
     * Reset the pagination state (useful when refreshing posts)
     */
    reset() {
        this.currentChunk = 0;
        console.log('[postsPaginationState] State reset to chunk 0');
    }
}
/**
 * Current view state - simplified to just track current view
 */
export const ViewState = {
    currentView: null,

    /**
     * Set the current view
     * @param {string} viewName - The name of the view being rendered
     */
    setView(viewName) {
        this.currentView = viewName;
        // currentChunk = 0
        console.log(`[ViewState] Current view: ${this.currentView}`);
    }
};

/**
 * View transition helper
 * Wraps view rendering with proper state management and cleanup
 * 
 * This is the CENTRAL place for all view transitions.
 * Any code that switches views should use this function.
 * 
 * @param {string} viewName - The name of the view
 * @param {Function} renderFn - The function that renders the view
 * @param {Object} [options] - Optional configuration for the transition
 * @param {Element} [options.container] - Container element to clear listeners from (default: #app)
 * @param {string} [options.dataAttribute] - Data attribute to target for clearing (default: 'data-has-listener')
 * @param {...any} args - Arguments to pass to the render function
 * @returns {any} The result of the render function
 * 
 * EXAMPLE USAGE:
 * ```js
 * // Default usage - clears #app with default data attribute
 * transitionTo('mainview', () => mainview(user));
 * 
 * // Custom container and data attribute for chat views
 * transitionTo('conversation', () => conversationView(container, userId), {
 *     container: chatPanel,
 *     dataAttribute: 'data-has-conversation-listener'
 * });
 * ```
 */
export function transitionTo(viewName, renderFn, options = {}, ...args) {
    // Handle both old signature (third param is arg) and new signature (options object)
    // If options is not an object or is a function, treat it as part of args (old signature)
    if (typeof options !== 'object' || options === null || options instanceof Function) {
        // Old signature: transitionTo(viewName, renderFn, ...args)
        options = {};
        args = [options, ...args].filter(arg => arg !== undefined);
    }
    
    // Default options
    const {
        container = document.querySelector('#app'),
        dataAttribute = 'data-has-listener'
    } = options;
    
    // Step 1: Clear event listeners from the previous view
    // This removes all listeners attached to elements in the specified container
    if (container) {
        clearEventListeners(container, dataAttribute);
    }
    
    // Step 2: Set the new view state
    ViewState.setView(viewName);
    
    // Step 3: Render the new view
    // Any new listeners will be attached during rendering
    console.log(`[ViewState] Rendering view: ${viewName}`);
    return renderFn(...args);
}

