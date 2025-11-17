export async function handleCreatePost(e) {
    e.preventDefault();
    const createPostForm = document.getElementById('create-post-form');
    if (!createPostForm) return;

    const formData = new FormData(createPostForm);
    const selectedCategories = Array.from(formData.getAll('categories')).map(id => parseInt(id, 10));

    const postData = {
        title: formData.get('title'),
        content: formData.get('content'),
        category_ids: selectedCategories,
    };

    // --- DEBUG: Log the data being sent ---
    console.log('[api/createpost.js:handleCreatePost] Attempting to create post. Sending data:', JSON.stringify(postData, null, 2));

    try {
        const response = await fetch('/api/posts/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(postData),
        });

        const result = await response.json();

        // --- DEBUG: Log the response from server ---
        console.log('[api/createpost.js:handleCreatePost] Received response from server:', {
            status: response.status,
            ok: response.ok,
            body: result
        });

        if (response.ok) {
            console.log('[api/createpost.js:handleCreatePost] Post created successfully, refreshing feed.');
            createPostForm.reset();
            // Import loadPosts dynamically or assume it's available
            import('../ui/posts.js').then(module => module.loadPosts());
        } else {
            console.error('Server returned an error:', result.message);
            console.error('Failed to create post: ' + (result.message || 'Unknown error'));
        }
    } catch (error) {
        // --- DEBUG: Log any network or parsing errors ---
        console.error('A network or parsing error occurred during post creation:', error);
        console.error('An error occurred. Please check the console for details.');
    }
}
