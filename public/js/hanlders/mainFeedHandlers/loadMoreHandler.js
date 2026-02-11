import { createLoadMoreButton } from "../../components/mainfeedComponent/loadmoreButtonCoponent.js";
import { renderPostsChunk } from "./postFeedHandler.js";
import { postsPaginationState } from "../../viewState.js";

// Keep local currentChunk for tracking (synced with postsPaginationState)
let currentChunk = 0;

export function loadMoreHandler(postFeed, allPosts, CHUNK_SIZE) {
    if (allPosts.length > CHUNK_SIZE) {
        if (postFeed) {
            // Remove existing load more button if any
            const existingButton = document.getElementById('load-more-button');
            if (existingButton) {
                existingButton.remove();
            }
            
            // Add new load more button
            const loadMoreButton = createLoadMoreButton();
            loadMoreButton.addEventListener('click', () => loadMorePosts(postFeed, allPosts, loadMoreButton, CHUNK_SIZE));
            postFeed.parentNode.insertBefore(loadMoreButton, postFeed.nextSibling);
        }
    }
}

function loadMorePosts(postFeed, allPosts, loadMoreButton, CHUNK_SIZE) {
    // Sync local currentChunk with tracked state (in case we returned to main view)
    currentChunk = postsPaginationState.getChunk();
    
    currentChunk++;
    
    // Save the chunk index to viewState for persistence
    postsPaginationState.setChunk(currentChunk);
    
    const startIndex = currentChunk * CHUNK_SIZE;
    const endIndex = startIndex + CHUNK_SIZE - 1;
    
    // Check if we have more posts to load
    if (startIndex >= allPosts.length) {
        return; // No more posts to load
    }
    renderPostsChunk(postFeed, allPosts, startIndex, endIndex);
    // Hide load more button if no more posts
    if (endIndex >= allPosts.length - 1) {      
        if (loadMoreButton) {
            loadMoreButton.style.display = 'none';
        }
    }
}

/**
 * Get the current chunk index from viewState
 */
export function getCurrentChunk() {
    return postsPaginationState.getChunk();
}

/**
 * Reset the chunk index to 0
 */
export function resetChunk() {
    currentChunk = 0;
    postsPaginationState.reset();
}
