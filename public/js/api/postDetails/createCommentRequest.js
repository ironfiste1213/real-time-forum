/**
 * Comment API module
 * Handles creating and fetching comments for posts
 */

/**
 * Creates a new comment on a post
 * @param {number} postId - The ID of the post to comment on
 * @param {string} content - The comment content
 * @returns {Promise<Object>} The created comment data
 */
export async function createComment(postId, content) {
    console.log('createCommentRequest.js: Creating comment for post ID:', postId);
    
    try {
        const response = await fetch(`/api/posts/${postId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            console.error('createCommentRequest.js: Failed to create comment:', data.message);
            throw new Error(data.message || 'Failed to create comment');
        }
        
        console.log('createCommentRequest.js: Comment created successfully');
        return data;
    } catch (error) {
        console.error('createCommentRequest.js: Error creating comment:', error);
        throw error;
    }
}

