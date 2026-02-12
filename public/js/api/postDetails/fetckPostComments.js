

import { handleStatusCode } from '../../tools/error/statusCodeHandler.js';
import { showNotification } from '../../components/notification/notificationComponent.js';

export async function fetchComments(postId, page = 1, limit = 5) {
    console.log('createCommentRequest.js: Fetching comments for post ID:', postId, 'page:', page);
    
    try {
        const response = await fetch(`/api/posts/${postId}/comments?page=${page}&limit=${limit}`);
        
        if (!response.ok) {
            // Handle status code (will redirect to login on 401)
            handleStatusCode(response);
            throw new Error('Failed to fetch comments');
        }
        
        const data = await response.json();
        console.log('createCommentRequest.js: Fetched', data.comments.length, 'comments');
        return data;
    } catch (error) {
        console.error('createCommentRequest.js: Error fetching comments:', error);
        // Show notification for network errors (server down, etc.)
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
            showNotification('Cannot connect to server. Please check your connection.', 'error');
        }
        throw error;
    }
}

