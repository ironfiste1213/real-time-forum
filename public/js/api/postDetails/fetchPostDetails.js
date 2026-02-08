/**
 * Fetches details of a single post by its ID.
 * 
 * @param {number|string} postId - The ID of the post to fetch
 * @returns {Promise<Object>} The post data
 * @throws {Error} Network errors or non-200 HTTP responses
 */
export async function fetchPostDetails(postId) {
    console.log('fetchPostDetails.js: fetchPostDetails() called with postId:', postId);
    console.log('fetchPostDetails.js: Sending GET to /api/posts/' + postId);
    
    const response = await fetch(`/api/posts/${postId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });
    
    console.log('fetchPostDetails.js: Response received, status:', response.status);

    if (!response.ok) {
        const errorMessage = `HTTP error! status: ${response.status}`;
        console.error('fetchPostDetails.js: Error:', errorMessage);
        throw new Error(errorMessage);
    }
    
    const postData = await response.json();
    console.log('fetchPostDetails.js: Post data fetched successfully, postId:', postId);
    
    return postData;
}

