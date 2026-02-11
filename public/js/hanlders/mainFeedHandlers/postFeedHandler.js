import { PostComponent } from "../../components/mainfeedComponent/postComponent.js";
import { loadMoreHandler, getCurrentChunk, resetChunk } from "./loadMoreHandler.js";
import { fetchPosts } from "../../api/posts/fetchposts.js"
import { creatPostFeedSectionContent } from "../../components/mainfeedComponent/mainFeedContainer.js";
import { postsPaginationState } from "../../viewState.js";

export const CHUNK_SIZE = 6;
export async function postsHandler() {
    console.log('postFeedHandler.js: postsHandler() called');
    const postFeedSection = document.querySelector("#post-feed-section");
    if (!postFeedSection) {
        console.log("postfeedsection not found !!!!");
        
    }
    creatPostFeedSectionContent(postFeedSection)
    const postFeed = document.querySelector("#post-feed")
    if (!postFeed) {
        
        console.log('postFeedHandler.js: post-feed element not found');
        return;
    }
    postFeed.innerHTML = "";
    try {
        console.log('postFeedHandler.js: Fetching posts...');
        const allPosts = await fetchPosts();
        console.log('postFeedHandler.js: Posts fetched, count:', allPosts.length);
        
        if (allPosts && allPosts.length > 0) {
            renderInitialPosts(postFeed, allPosts);
            
            // Check if we should show/hide the Load More button
            const trackedChunk = postsPaginationState.getChunk();
            const lastRenderedIndex = (trackedChunk + 1) * CHUNK_SIZE - 1;
            
            if (lastRenderedIndex < allPosts.length - 1) {
                // Not all posts are loaded yet, show Load More button
                loadMoreHandler(postFeed, allPosts, CHUNK_SIZE);
            } 
        } else {
            renderEmptyState(postFeed);
        }
    } catch (error) {
        renderError(postFeed, error.message);
    }
}


function renderInitialPosts(postFeed, allPosts) {
    if (!postFeed) return;
    // Clear previous content
    while (postFeed.firstChild) {
        postFeed.removeChild(postFeed.firstChild);
    }
    if (allPosts.length === 0) {
        renderEmptyState(postFeed);
        return;
    }
    // Get the tracked chunk from viewState (if any)
    const trackedChunk = postsPaginationState.getChunk();
    // Always start by rendering the first chunk (posts 0-5)
    const firstChunkEnd = CHUNK_SIZE - 1;
    renderPostsChunk(postFeed, allPosts, 0, firstChunkEnd);
    // If we have a tracked chunk (user previously clicked Load More),
    // render all chunks up to the tracked chunk
    if (trackedChunk > 0) {
        renderPostsUpToChunk(postFeed, allPosts, trackedChunk);
    }
}

/**
 * Render posts from chunk 1 up to the target chunk
 * 
 */
function renderPostsUpToChunk(postFeed, allPosts, targetChunk) {
    // Start from chunk 1 (posts 6-11) and render up to targetChunk
    for (let chunk = 1; chunk <= targetChunk; chunk++) {
        const startIndex = chunk * CHUNK_SIZE;
        const endIndex = startIndex + CHUNK_SIZE - 1;
        // Check if we have more posts to load
        if (startIndex >= allPosts.length) {
            break;
        }
        renderPostsChunk(postFeed, allPosts, startIndex, endIndex);
    }
}
export function renderPostsChunk(postFeed, posts, from, to) {
    if (!postFeed) return;    
    for (let i = from; i <= to && i < posts.length; i++) {
        const postElement = PostComponent(posts[i]);
        postFeed.appendChild(postElement);
    }
}


function renderEmptyState(postFeed) {
    const emptyState = document.createElement('p');
    emptyState.setAttribute('data-empty-state', '');
    emptyState.textContent = 'No posts yet. Be the first to create one!';
    postFeed.appendChild(emptyState);
}

function renderError(postFeed, message) {
    // Clear any existing content
    while (postFeed.firstChild) {
        postFeed.removeChild(postFeed.firstChild);
    }
    // Create error display div
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.setAttribute('data-error-display', '');
    errorDiv.textContent = `Error loading posts: ${message}`;
    postFeed.appendChild(errorDiv);
}

