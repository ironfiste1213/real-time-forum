/**
 * Hides the main feed and shows the single post view.
 */
function showMainFeedView() {
    const singlePostView = document.getElementById('single-post-view');
    const mainFeedView = document.getElementById('main-feed-view');
    singlePostView.classList.add('hidden');
    mainFeedView.classList.remove('hidden');
    singlePostView.innerHTML = ''; // Clear the single post view content
}

/**
 * Fetches and renders comments for a given post.
 * @param {number} postId The ID of the post.
 */
async function loadAndRenderComments(postId) {
    const commentsSection = document.getElementById('comments-section');
    if (!commentsSection) {
        console.error('Comments section not found in the DOM');
        return;
    }

    try {
        const response = await fetch(`/api/posts/${postId}/comments`);
        if (!response.ok) {
            throw new Error(`Failed to fetch comments. Status: ${response.status}`);
        }
        const comments = await response.json();

        const commentsList = document.createElement('div');
        commentsList.id = 'comments-list';

            comments.forEach(comment => {
                const commentDate = new Date(comment.createdAt).toLocaleString();
                const commentEl = document.createElement('div');
                commentEl.className = 'comment';
                commentEl.innerHTML = `
                    <p class="comment-meta"><strong>${comment.author.nickname}</strong> on ${commentDate}</p>
                    <p class="comment-content">${comment.content.replace(/\n/g, '<br>')}</p>
                `;
                commentsList.appendChild(commentEl);
            });

       if (comments && comments.length > 0) {
            commentsSection.innerHTML = '';
            commentsSection.appendChild(commentsList);
        } else {
            commentsSection.innerHTML = '<p>No comments yet. Be the first to comment!</p>';  
        }
    } catch (error) {
        commentsSection.innerHTML = '';
        console.error('Error loading comments:', error);
        commentsSection.innerHTML += '<p class="error-message">Could not load comments.</p>';
    }
}

/**
 * Handles the submission of the create comment form.
 * @param {Event} event The form submission event.
 * @param {number} postId The ID of the post being commented on.
 */
async function handleCreateComment(event, postId) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const content = formData.get('content');

    if (!content || !content.trim()) {
        alert('Comment cannot be empty.');
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
            loadAndRenderComments(postId); // Refresh the comments list
        } else {
            // The backend sends 401 if not authenticated
            const errorMessage = result.message || 'An unknown error occurred.';
            alert(`Failed to post comment: ${errorMessage}`);
            console.error('Server error on comment creation:', errorMessage);
        }
    } catch (error) {
        console.error('Network or parsing error during comment creation:', error);
        alert('An error occurred while submitting your comment. Please try again.');
    }
}

/**
 * Fetches a single post by its ID and renders it in the single-post-view.
 * @param {number} postId The ID of the post to display.
 */
export async function showSinglePostView(postId) {
    console.log(`Fetching post with ID: ${postId}`);
    const singlePostView = document.getElementById('single-post-view');
    const mainFeedView = document.getElementById('main-feed-view');
    try {
        const response = await fetch(`/api/posts/${postId}/`);
        if (!response.ok) {
            throw new Error(`Failed to fetch post. Status: ${response.status}`);
        }
        const post = await response.json();

        console.log('Successfully fetched post data:', post);

        // Hide main feed and show single post view
        mainFeedView.classList.add('hidden');
        singlePostView.classList.remove('hidden');

        // Render the single post
        // The date from Go is in a detailed format; new Date() handles it directly.
        const postDate = new Date(post.created_at).toLocaleString();

        singlePostView.innerHTML = `
            <div class="post-detail-container card">
                <button id="back-to-feed" class="back-button">← Back to Feed</button>
                <h2 class="post-detail-title">${post.title}</h2>
                <p class="post-meta">Posted by <strong>${post.author.nickname}</strong> on ${postDate}</p>
                
                <div class="post-detail-content">
                    <p>${post.content.replace(/\n/g, '<br>')}</p>
                </div>

                <div class="categories post-detail-categories">
                    ${post.categories && post.categories.length > 0 ? post.categories.map(cat => `<span class="category">${cat}</span>`).join('') : ''}
                </div>

                <div id="comments-section" class="comments-section">
                    <h3>Comments</h3>
                    <p>Loading comments...</p>
                </div>

                <div class="add-comment-section">
                    <h4>Add a Comment</h4>
                    <form id="create-comment-form">
                        <textarea name="content" placeholder="Write your comment here..." rows="3" required></textarea>
                        <button type="submit">Submit Comment</button>
                    </form>
                </div>
            </div>
        `;

        document.getElementById('back-to-feed').addEventListener('click', showMainFeedView);

        document.getElementById('create-comment-form').addEventListener('submit', (e) => handleCreateComment(e, postId));

        // After rendering the post, fetch and render its comments
        loadAndRenderComments(postId);
    } catch (error) {
        console.error('Error showing single post:', error);
        alert('Could not load the post. Please try again.');
    }
}