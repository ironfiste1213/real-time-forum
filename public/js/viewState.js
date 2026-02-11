
import { clearEventListeners } from './tools/dom/clearEventListeners.js';

export const pathState = {
    lastvalidpath: null
}


export const postsPaginationState = {
    currentChunk: 0,
    
   
    setChunk(chunk) {
        this.currentChunk = chunk;
        console.log(`[postsPaginationState] Chunk set to: ${this.currentChunk}`);
    },

    getChunk() {
        return this.currentChunk;
    },
    

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


    setView(viewName) {
        this.currentView = viewName;
        // currentChunk = 0
        console.log(`[ViewState] Current view: ${this.currentView}`);
    }
};


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

//export function  transitionTochat(viewName, renderFn, op)