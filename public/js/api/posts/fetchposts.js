
import { handleStatusCode } from '../../tools/error/statusCodeHandler.js';
import { handleNetworkError } from '../../tools/error/networkErrorHandler.js';

export async function fetchPosts() {
    console.log('fetchposts.js: fetchPosts() called');
    console.log('fetchposts.js: Sending GET to /api/posts');
    
    try {
        const response = await fetch('/api/posts', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        console.log('fetchposts.js: Response received, status:', response.status);

        // Handle status code (will redirect to login on 401)
        if (!response.ok) {
            handleStatusCode(response);
            return [];
        }
        
        return await response.json();
    } catch (error) {
        handleNetworkError(error, 'fetchPosts');
        return [];
    }
}

