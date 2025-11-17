export async function handleCreateComment(event, postId) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const content = formData.get('content');

    if (!content || !content.trim()) {
        console.error('Comment cannot be empty.');
        return;
    }

    const commentData = {
        content: content,
    };

    try {
        const response = await fetch(`/api/posts/${postId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(commentData),
        });

        const result = await response.json();

        if (response.ok) {
            form.reset(); // Clear the form
            // Import loadAndRenderComments dynamically to avoid circular dependency
            import('../ui/postDetail.js').then(module => module.loadAndRenderComments(postId));
        } else {
            // The backend sends 401 if not authenticated
            const errorMessage = result.message || 'An unknown error occurred.';
            console.error(`Failed to post comment: ${errorMessage}`);
            console.error('Server error on comment creation:', errorMessage);
        }
    } catch (error) {
        console.error('Network or parsing error during comment creation:', error);
        console.error('An error occurred while submitting your comment. Please try again.');
    }
}
