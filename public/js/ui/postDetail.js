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
                    <!-- Comments will be loaded here -->
                    <p>Comments are coming soon!</p>
                </div>
            </div>
        `;

        document.getElementById('back-to-feed').addEventListener('click', showMainFeedView);
    } catch (error) {
        console.error('Error showing single post:', error);
        alert('Could not load the post. Please try again.');
    }
}