import { fetchComments } from '../../../api/postDetails/fetckPostComments.js';
import { CommentComponent } from '../../../components/PostDetailsComponents/comments/commentsComponent.js';
import { 
    initPagination,
    createPaginationControls,
    attachPaginationListeners,
    resetPagination,
    getPaginationState
} from './commentsPaginationHandler.js';

let currentPostId = null;
let isLoadingComments = false;

/**
 * Render Comment Handler (Pure UI Renderer)
 * 
 * This handler is responsible ONLY for rendering comments UI.
 * All pagination logic is delegated to commentsPaginationHandler.
 * 
 * @param {number} postId - The ID of the post to fetch comments for
 * @param {number} page - Page number (default: 1)
 * @returns {Promise<void>}
 */
export async function renderCommentHandler(postId, page = 1) {
    // Validate inputs
    if (!postId || postId <= 0) {
        console.error('renderCommenthander.js: Invalid post ID:', postId);
        return;
    }

    // Prevent duplicate requests
    if (isLoadingComments) {
        console.log('renderCommenthander.js: Already loading comments, skipping...');
        return;
    }

    // Reset state if starting fresh (page 1)
    if (page === 1) {
        currentPostId = postId;
        resetPagination();
    }

    // Store the post ID for reference
    currentPostId = postId;
    isLoadingComments = true;

    console.log(`renderCommenthander.js: Fetching comments for post ${postId}, page ${page}`);

    try {
        // Show loading indicator if this is a fresh load
        const commentsContainer = document.getElementById('post-details-comments-section');
        if (commentsContainer && page === 1) {
            const loadingIndicator = createLoadingIndicator();
            commentsContainer.innerHTML = '';
            commentsContainer.appendChild(loadingIndicator);
        }

        // Fetch comments from API (5 per page)
        const data = await fetchComments(postId, page, 5);

        console.log(`renderCommenthander.js: Fetched ${data.comments ? data.comments.length : 0} comments for page ${page}`);
        console.log(`renderCommenthander.js: Total comments: ${data.total}`);

        // Remove loading indicator
        if (commentsContainer) {
            const existingLoading = commentsContainer.querySelector('.loading-indicator');
            if (existingLoading) {
                existingLoading.remove();
            }
        }

        // Initialize pagination with backend data
        initPagination(postId, data.total, page, 5);

        // Render comments - always replace (no append)
        const targetContainer = document.getElementById('comments-placeholder');
        if (targetContainer) {
            renderCommentsSection(targetContainer, data.comments || [], data.total);

            // Create pagination controls (Next/Prev buttons)
            createPaginationControls(targetContainer);

            // Attach pagination event listeners
            attachPaginationListeners(renderCommentHandler);
        }else {
            console.log("eeeeeeeeeeeeeeeeeeeeeeeeeeee");
            
        }

    } catch (error) {
        console.error('renderCommenthander.js: Error fetching comments:', error);
        handleCommentsError(error);
    } finally {
        isLoadingComments = false;
    }
}

/**
 * Render the complete comments section (for page 1)
 * @param {HTMLElement} container - The container element
 * @param {Array} comments - Array of comment objects
 * @param {number} total - Total number of comments
 */ 

function renderCommentsSection(container, comments, total) {
    if (!container) {
        console.error('renderCommenthander.js: Comments container not found');
        return;
    }

    // Clear the container
    container.innerHTML = '';

    // Create and append the comments component
    const commentsComponent = CommentComponent(comments);
    container.appendChild(commentsComponent);

    // Update header with total count
    const header = container.querySelector('.comments-header');
    if (header) {
        header.textContent = `Comments (${total || comments.length})`;
    }

    console.log(`renderCommenthander.js: Rendered ${comments.length} comments`);
}

/**
 * Create a loading indicator element
 * @returns {HTMLElement} The loading indicator element
 */
function createLoadingIndicator() {
    const loadingDiv = document.createElement('div');
    loadingDiv.classList.add('loading-indicator');
    loadingDiv.innerHTML = `
        <div class="loading-spinner"></div>
        <p>Loading comments...</p>
    `;
    return loadingDiv;
}



/**
 * Handle comments fetch error
 * @param {Error} error - The error object
 */
function handleCommentsError(error) {
    const commentsSection = document.getElementById('post-details-comments-section');
    if (commentsSection) {
        // Remove loading indicator
        const loadingIndicator = commentsSection.querySelector('.loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.remove();
        }

        // Show error message
        const errorDiv = document.createElement('div');
        errorDiv.classList.add('comments-error');
        errorDiv.innerHTML = `
            <p>Failed to load comments. Please try again later.</p>
            <button onclick="location.reload()">Refresh</button>
        `;
        commentsSection.appendChild(errorDiv);
    }
}

/**
 * Reset the comment handler state
 * Useful when navigating away from a post
 */
export function resetCommentState() {
    currentPostId = null;
    isLoadingComments = false;
    resetPagination();
}

/**
 * Get the current comment state
 * @returns {Object} Current state object
 */
export function getCommentState() {
    return {
        ...getPaginationState(),
        currentPostId: currentPostId,
        isLoading: isLoadingComments
    };
}

