

export async function fetchComments(postId, page = 1, limit = 5) {
    console.log('createCommentRequest.js: Fetching comments for post ID:', postId, 'page:', page);
    
    try {
        const response = await fetch(`/api/posts/${postId}/comments?page=${page}&limit=${limit}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch comments');
        }
        
        const data = await response.json();
        console.log('createCommentRequest.js: Fetched', data.comments.length, 'comments');
        return data;
    } catch (error) {
        console.error('createCommentRequest.js: Error fetching comments:', error);
        throw error;
    }
}

