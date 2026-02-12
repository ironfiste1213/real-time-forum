import { handleStatusCode } from '../../tools/error/statusCodeHandler.js';
import { handleNetworkError } from '../../tools/error/networkErrorHandler.js';

/**
 * Fetches details of a single post by its ID.
 */
export async function fetchPostDetails(postId) {
    console.log('fetchPostDetails.js: fetchPostDetails() called with postId:', postId);
    console.log('fetchPostDetails.js: Sending GET to /api/posts/' + postId);
    
    try {
        const response = await fetch(`/api/posts/${postId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        
        console.log('fetchPostDetails.js: Response received, status:', response.status);

        if (!response.ok) {
            // Handle status code (will redirect to login on 401)
            handleStatusCode(response);
            const errorMessage = `HTTP error! status: ${response.status}`;
            console.error('fetchPostDetails.js: Error:', errorMessage);
            return null;
        }
        
        const postData = await response.json();
        console.log('fetchPostDetails.js: Post data fetched successfully, postId:', postId);
        
        return postData;
    } catch (error) {
        handleNetworkError(error, 'fetchPostDetails');
        return null;
    }
}

