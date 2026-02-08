import { createComment } from "../../../api/postDetails/createCommentRequest.js";
import { renderCommentHandler } from "./renderCommenthander.js";

/**
 * New Comment Handler
 * Handles new comment submissions in the post details view
 * 
 * @param {number} postId - The ID of the post to add comment to
 */
export function attachNewCommentHandler(postId) {
    console.log('newCommentHandler.js: attachNewCommentHandler() called with postId:', postId);
    
    if (!postId || postId <= 0) {
        console.error('newCommentHandler.js: Invalid post ID:', postId);
        return;
    }
    
    // Get the comment textarea
    const commentTextarea = document.getElementById('comment-input-' + postId);
    if (!commentTextarea) {
        console.error('newCommentHandler.js: Comment textarea not found for postId:', postId);
        return;
    }
    
    // Get the submit button
    const submitBtn = commentTextarea.parentElement.querySelector('.submit-comment-btn');
    if (!submitBtn) {
        console.error('newCommentHandler.js: Submit button not found');
        return;
    }
    
    // Handle submit button click
    submitBtn.addEventListener('click', async () => {
        const content = commentTextarea.value.trim();
        
        if (!content) {
            console.log('newCommentHandler.js: Comment content is empty');
            alert('Please enter a comment');
            return;
        }
        
        // Disable button during submission
        submitBtn.disabled = true;
        submitBtn.textContent = 'Posting...';
        
        try {
            console.log('newCommentHandler.js: Creating comment for postId:', postId);
            const newComment = await createComment(postId, content);
            console.log('newCommentHandler.js: Comment created successfully:', newComment);
            
            // Clear the textarea
            commentTextarea.value = '';
            
            // Refresh comments to show the new comment
            // Go back to first page to see the new comment
            await renderCommentHandler(postId, 1);
            
            console.log('newCommentHandler.js: Comments refreshed');
            
        } catch (error) {
            console.error('newCommentHandler.js: Error creating comment:', error);
            alert('Failed to post comment. Please try again.');
        } finally {
            // Re-enable the button
            submitBtn.disabled = false;
            submitBtn.textContent = 'Post Comment';
        }
    });
    
    // Handle Enter key (Ctrl+Enter to submit)
    commentTextarea.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            submitBtn.click();
        }
    });
    
    console.log('newCommentHandler.js: New comment handler attached successfully');
}

