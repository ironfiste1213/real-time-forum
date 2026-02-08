import { PostDetailsComponent } from "../../components/PostDetailsComponents/postDetailsComponent.js";
import { fetchPostDetails } from "../../api/postDetails/fetchPostDetails.js";
import { renderCommentHandler } from "./comments/renderCommenthander.js";
import { attachNewCommentHandler } from "./comments/newCommentHandler.js";
import { router } from "../../router.js";
import { pathState } from "../../viewState.js";
/**
 * Post Details Handler
 * Handles displaying full post details when a post is clicked
 * Clears the post feed and renders the post details with comments
 * 
 * @param {number} postId - The ID of the post to display
 * @param {HTMLElement} rootContainer - The root container (optional, will query if not provided)
 */
export async function postDetailsHandler(postId, rootContainer = null) {
    console.log('postDetailsHandler.js: postDetailsHandler() called with postId:', postId);
    
    // Validate input
    if (!postId || postId <= 0) {
        console.error('postDetailsHandler.js: Invalid post ID:', postId);
        return;
    }
    
    // Get container - use provided or query for it
    const container = rootContainer || document.querySelector('#app');
    if (!container) {
        console.error('postDetailsHandler.js: Container element not found');
        return;
    }
    
    // Get main feed view
    const mainFeedView = document.querySelector('#main-feed-view');
    if (!mainFeedView) {
        console.error('postDetailsHandler.js: #main-feed-view not found');
        return; 
    }
    
    // Get post feed section
    const postFeedSection = document.querySelector('#post-feed-section');
    if (!postFeedSection) {
        console.error('postDetailsHandler.js: #post-feed-section not found');
        return;
    }

    // Clear the post feed section
    console.log('postDetailsHandler.js: Clearing post feed section');
    postFeedSection.innerHTML = '';
    
    // Create a header with back button
    const header = document.createElement('div');
    header.classList.add('post-details-header');
    
    const backBtn = document.createElement('button');
    backBtn.classList.add('back-btn');
    backBtn.innerHTML = '← Back to Feed';
        console.log("state.lastvalidpath:==>", pathState.lastvalidpath  );
    
    backBtn.addEventListener('click', () => {
        
       if (pathState.lastvalidpath == "/" || pathState.lastvalidpath == "/login") {
        window.history.back();
       }else {
        router({path:"/"})
       }
    });
    header.appendChild(backBtn);
    
    const postDetailsTitle = document.createElement('h2');
    postDetailsTitle.textContent = 'Post Details';
    header.appendChild(postDetailsTitle);
    
    postFeedSection.appendChild(header);
    
    // Show loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.classList.add('loading-indicator');
    loadingIndicator.innerHTML = `
        <div class="loading-spinner"></div>
        <p>Loading post...</p>
    `;
    postFeedSection.appendChild(loadingIndicator);
    
    try {
        // Fetch post details
        console.log('postDetailsHandler.js: Fetching post details for postId:', postId);
        const postData = await fetchPostDetails(postId);
        console.log('postDetailsHandler.js: Post data fetched:', postData);
        
        // Remove loading indicator
        loadingIndicator.remove();
        
        // Render PostDetailsComponent
        console.log('postDetailsHandler.js: Creating PostDetailsComponent');
        const postDetailsComponent = PostDetailsComponent(postData);
        postFeedSection.appendChild(postDetailsComponent);
        
        // Get the comments section container
      
            // Render comments (this will replace the placeholder)
            console.log('postDetailsHandler.js: Calling renderCommentHandler');
            await renderCommentHandler(postId, 1);
            
            // Attach new comment handler
            console.log('postDetailsHandler.js: Attaching new comment handler');
            attachNewCommentHandler(postId);
     
        
        console.log('postDetailsHandler.js: Post details rendered successfully');
        
    } catch (error) {
        console.error('postDetailsHandler.js: Error loading post details:', error);
        
        // Remove loading indicator
        loadingIndicator.remove();
        
        // Show error message
        const errorDiv = document.createElement('div');
        errorDiv.classList.add('error-message');
        errorDiv.innerHTML = `
            <p>Failed to load post details. Please try again later.</p>
            <button onclick="window.history.back()">Go Back</button>
        `;
        postFeedSection.appendChild(errorDiv);
    }
}

