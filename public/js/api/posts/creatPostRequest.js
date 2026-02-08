
export async function createPostApi({ title, content, category_ids }) {
    console.log('creatPostRequest.js: createPostApi() called');
    console.log('creatPostRequest.js: Attempting to create post with title:', title);

    const postData = {
        title,
        content,
        category_ids
    };

    // --- DEBUG: Log the data being sent ---
    console.log('[creatPostRequest.js:createPostApi] Sending data:', JSON.stringify(postData, null, 2));

    try {
        const response = await fetch('/api/posts/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(postData),
        });

        const result = await response.json();

        // --- DEBUG: Log the response from server ---
        console.log('[creatPostRequest.js:createPostApi] Received response from server:', {
            status: response.status,
            ok: response.ok,
            body: result
        });

        if (!response.ok) {
            console.log('[creatPostRequest.js:createPostApi] Post creation failed:', result.message);
            return {
                success: false,
                error: result.message || 'Failed to create post',
                status: response.status,
            };
        }

        console.log('[creatPostRequest.js:createPostApi] Post created successfully');
        return {
            success: true,
            post: result.post || result,
            message: result.message || 'Post created successfully',
            status: response.status,
        };
    } catch (error) {
        // --- DEBUG: Log any network or parsing errors ---
        console.error('[creatPostRequest.js:createPostApi] Network or parsing error:', error);
        return {
            success: false,
            error: error.message || 'Network error occurred',
            status: null,
        };
    }
}

