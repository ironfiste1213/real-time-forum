/**
 * Comments Pagination Handler
 * 
 * Dedicated handler for managing comment pagination logic.
 * This handler is responsible for:
 * - Tracking pagination state (current page, total, limit)
 * - Determining if Next/Prev buttons should be shown
 * - Creating pagination UI controls
 * - Handling pagination button events
 */

let currentPage = 1;
let totalComments = 0;
let currentPostId = null;
let commentsLimit = 5;
let fetchCallback = null;

/**
 * Initialize pagination with backend data
 */
export function initPagination(postId, total, page, limit = 5) {
    currentPostId = postId;
    totalComments = total;
    currentPage = page;
    commentsLimit = limit;
}

/**
 * Check if there are more comments to load (Next page exists)
 * 
 */
export function hasNextPage() {
    if (!totalComments || totalComments === 0) {
        return false;
    }
    const loadedSoFar = currentPage * commentsLimit;
    return loadedSoFar < totalComments;
}

/**
 * Check if there are previous comments (Not on first page)
 */
export function hasPrevPage() {
    return currentPage > 1;
}

/**
 * Get the current page number
 */
export function getCurrentPage() {
    return currentPage;
}

/**
 * Get the total number of comments
 */
export function getTotalComments() {
    return totalComments;
}

/**
 * Get comments limit per page
 */
export function getCommentsLimit() {
    return commentsLimit;
}

/**
 * Create pagination controls (Next/Prev buttons)
 */
export function createPaginationControls(container) {
    // Remove existing pagination controls if any
    removePaginationControls(container);
    if (!container) {
        console.error('commentsPaginationHandler.js: Container not found for pagination controls');
        return null;
    }
    const paginationContainer = document.createElement('div');
    paginationContainer.classList.add('comments-pagination-controls');
    paginationContainer.id = 'comments-pagination-controls';

    // Create Previous button
    if (hasPrevPage()) {
        const prevButton = document.createElement('button');
        prevButton.classList.add('pagination-btn', 'pagination-prev');
        prevButton.id = 'comments-pagination-prev';
        prevButton.textContent = '← Previous';
        paginationContainer.appendChild(prevButton);
    }

    // Create page indicator
    const pageIndicator = document.createElement('span');
    pageIndicator.classList.add('pagination-indicator');
    pageIndicator.id = 'comments-pagination-indicator';
    
    const totalPages = Math.ceil(totalComments / commentsLimit);
    pageIndicator.textContent = `Page ${currentPage}${totalPages > 0 ? ` of ${totalPages}` : ''}`;
    paginationContainer.appendChild(pageIndicator);

    // Create Next button
    if (hasNextPage()) {
        const nextButton = document.createElement('button');
        nextButton.classList.add('pagination-btn', 'pagination-next');
        nextButton.id = 'comments-pagination-next';
        nextButton.textContent = 'Next →';
        paginationContainer.appendChild(nextButton);
    }

    // Append to container
    container.appendChild(paginationContainer);

    console.log(`commentsPaginationHandler.js: Created pagination controls - Prev: ${hasPrevPage()}, Next: ${hasNextPage()}`);

    return paginationContainer;
}

/**
 * Remove pagination controls from container
 */
function removePaginationControls(container) {
    if (!container) {
        return;
    }

    const existingControls = container.querySelector('#comments-pagination-controls');
    if (existingControls) {
        existingControls.remove();
        console.log('commentsPaginationHandler.js: Removed existing pagination controls');
    }
}

/**
 * Attach event listeners to pagination buttons
 */
export function attachPaginationListeners(fetchHandler) {
    fetchCallback = fetchHandler;

    const prevButton = document.getElementById('comments-pagination-prev');
    const nextButton = document.getElementById('comments-pagination-next');

    // Attach Previous button listener
    if (prevButton) {
        // Remove existing listener to prevent duplicates
        const newPrevButton = prevButton.cloneNode(true);
        prevButton.parentNode.replaceChild(newPrevButton, prevButton);

        newPrevButton.addEventListener('click', async () => {
            if (currentPage <= 1) {
                console.log('commentsPaginationHandler.js: Already on first page, skipping...');
                return;
            }

            const prevPage = currentPage - 1;
            console.log(`commentsPaginationHandler.js: Previous button clicked, loading page ${prevPage}`);

            if (fetchCallback) {
                await fetchCallback(currentPostId, prevPage);
            }
        });
    }

    // Attach Next button listener
    if (nextButton) {
        // Remove existing listener to prevent duplicates
        const newNextButton = nextButton.cloneNode(true);
        nextButton.parentNode.replaceChild(newNextButton, nextButton);

        newNextButton.addEventListener('click', async () => {
            const loadedSoFar = currentPage * commentsLimit;
            if (loadedSoFar >= totalComments) {
                console.log('commentsPaginationHandler.js: No more comments to load, skipping...');
                return;
            }

            const nextPage = currentPage + 1;
            console.log(`commentsPaginationHandler.js: Next button clicked, loading page ${nextPage}`);

            if (fetchCallback) {
                await fetchCallback(currentPostId, nextPage);
            }
        });
    }

    console.log('commentsPaginationHandler.js: Pagination listeners attached');
}

/**
 * Update pagination UI after fetch
 * Called after comments are fetched to update button states
 */
export function updatePaginationUI(container) {
    if (!container) {
        console.error('commentsPaginationHandler.js: Container not found for UI update');
        return;
    }
    // Recreate pagination controls with updated state
    createPaginationControls(container);
    // Re-attach listeners
    if (fetchCallback) {
        attachPaginationListeners(fetchCallback);
    }

}

/**
 * Reset pagination state
 * Call this when navigating away from the post
 */
export function resetPagination() {
    currentPage = 1;
    totalComments = 0;
    currentPostId = null;
    commentsLimit = 5;
    fetchCallback = null;

    console.log('commentsPaginationHandler.js: Pagination state reset');
}

/**
 * Get current pagination state
 */
export function getPaginationState() {
    return {
        currentPage: currentPage,
        totalComments: totalComments,
        currentPostId: currentPostId,
        limit: commentsLimit,
        hasNext: hasNextPage(),
        hasPrev: hasPrevPage()
    };
}

