/**
 * Hides the main feed and shows the single post view.
 */
function showMainFeedView() {
    const singlePostView = document.getElementById('single-post-view');
    const mainFeedView = document.getElementById('main-feed-view');
    singlePostView.classList.add('hidden');
    mainFeedView.classList.remove('hidden');
    // Fade in the main feed view
    mainFeedView.style.opacity = '0';
    setTimeout(() => {
        mainFeedView.style.opacity = '1';
    }, 10);
    // Clear the single post view content
    while (singlePostView.firstChild) {
        singlePostView.removeChild(singlePostView.firstChild);
    }

    // Show the create post button with fade in
    const createPostToggle = document.getElementById('create-post-toggle');
    if (createPostToggle) {
        createPostToggle.style.display = 'block';
        createPostToggle.style.opacity = '0';
        setTimeout(() => {
            createPostToggle.style.opacity = '1';
        }, 10);
    }
}

/**
 * Fetchfes and renders comments for a given post.
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

           

       if (comments && comments.length > 0) {
        comments.forEach(comment => {
            const commentDate = new Date(comment.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
            const commentEl = document.createElement('div');
            commentEl.className = 'comment';

            const metaP = document.createElement('p');
            metaP.className = 'comment-meta';
            const strong = document.createElement('strong');
            strong.textContent = comment.author.nickname;
            metaP.appendChild(strong);
            metaP.appendChild(document.createTextNode(` on ${commentDate}`));
            commentEl.appendChild(metaP);

            const contentP = document.createElement('p');
            contentP.className = 'comment-content';
            // Handle line breaks by splitting content and creating separate elements
            const contentLines = comment.content.split('\n');
            contentLines.forEach((line, index) => {
                if (index > 0) {
                    contentP.appendChild(document.createElement('br'));
                }
                contentP.appendChild(document.createTextNode(line));
            });
            commentEl.appendChild(contentP);

            commentsList.appendChild(commentEl);
        });
            // Clear existing content
            while (commentsSection.firstChild) {
                commentsSection.removeChild(commentsSection.firstChild);
            }
            commentsSection.appendChild(commentsList);
        } else {
            // Clear existing content
            while (commentsSection.firstChild) {
                commentsSection.removeChild(commentsSection.firstChild);
            }
            const noCommentsP = document.createElement('p');
            noCommentsP.textContent = 'No comments yet. Be the first to comment!';
            commentsSection.appendChild(noCommentsP);
        }
    } catch (error) {
        // Clear existing content
        while (commentsSection.firstChild) {
            commentsSection.removeChild(commentsSection.firstChild);
        }
        console.error('Error loading comments:', error);
        const errorP = document.createElement('p');
        errorP.className = 'error-message';
        errorP.textContent = 'Could not load comments.';
        commentsSection.appendChild(errorP);
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
            loadAndRenderComments(postId); // Refresh the comments list
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

        // Hide the create post button
        const createPostToggle = document.getElementById('create-post-toggle');
        if (createPostToggle) {
            createPostToggle.style.display = 'none';
        }

        // Render the single post
        // The date from Go is in a detailed format; new Date() handles it directly.
        const postDate = new Date(post.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });

        // Create post detail container
        const postDetailContainer = document.createElement('div');
        postDetailContainer.className = 'post-detail-container card';

        // Header with back button and title
        const header = document.createElement('div');
        header.className = 'post-detail-header';

        // Back button
        const backButton = document.createElement('button');
        backButton.id = 'back-to-feed';
        backButton.className = 'back-button';
        backButton.textContent = '←';
        header.appendChild(backButton);

        // Post title
        const postTitle = document.createElement('h2');
        postTitle.className = 'post-detail-title';
        postTitle.textContent = post.title;
        header.appendChild(postTitle);

        postDetailContainer.appendChild(header);

        // Post meta
        const postMeta = document.createElement('p');
        postMeta.className = 'post-meta';
        postMeta.appendChild(document.createTextNode('Posted by '));
        const strong = document.createElement('strong');
        strong.textContent = post.author.nickname;
        postMeta.appendChild(strong);
        postMeta.appendChild(document.createTextNode(` on ${postDate}`));
        postDetailContainer.appendChild(postMeta);

        // Post content
        const postContentDiv = document.createElement('div');
        postContentDiv.className = 'post-detail-content';
        const contentP = document.createElement('p');
        // Handle line breaks by splitting content and creating separate elements
        const contentLines = post.content.split('\n');
        contentLines.forEach((line, index) => {
            if (index > 0) {
                contentP.appendChild(document.createElement('br'));
            }
            contentP.appendChild(document.createTextNode(line));
        });
        postContentDiv.appendChild(contentP);
        postDetailContainer.appendChild(postContentDiv);

        // Categories
        const categoriesDiv = document.createElement('div');
        categoriesDiv.className = 'categories post-detail-categories';
        if (post.categories && post.categories.length > 0) {
            post.categories.forEach(cat => {
                const categorySpan = document.createElement('span');
                categorySpan.className = 'category';
                categorySpan.textContent = cat;
                categoriesDiv.appendChild(categorySpan);
            });
        } else {
            const noCategorySpan = document.createElement('span');
            noCategorySpan.className = 'category no-category';
            noCategorySpan.textContent = 'no category';
            categoriesDiv.appendChild(noCategorySpan);
        }
        postDetailContainer.appendChild(categoriesDiv);

        // Comments section
        const commentsSection = document.createElement('div');
        commentsSection.id = 'comments-section';
        commentsSection.className = 'comments-section';

        const commentsHeading = document.createElement('h3');
        commentsHeading.textContent = 'Comments';
        commentsSection.appendChild(commentsHeading);

        const loadingP = document.createElement('p');
        loadingP.textContent = 'Loading comments...';
        commentsSection.appendChild(loadingP);

        postDetailContainer.appendChild(commentsSection);

        // Add comment section
        const addCommentSection = document.createElement('div');
        addCommentSection.className = 'add-comment-section';

        const commentForm = document.createElement('form');
        commentForm.id = 'create-comment-form';

        const commentTextarea = document.createElement('textarea');
        commentTextarea.name = 'content';
        commentTextarea.placeholder = 'Write your comment here...';
        commentTextarea.rows = 3;
        commentTextarea.required = true;
        commentForm.appendChild(commentTextarea);

        const submitButton = document.createElement('button');
        submitButton.type = 'submit';
        submitButton.textContent = 'Submit Comment';
        commentForm.appendChild(submitButton);

        addCommentSection.appendChild(commentForm);
        postDetailContainer.appendChild(addCommentSection);

        singlePostView.appendChild(postDetailContainer);

        document.getElementById('back-to-feed').addEventListener('click', showMainFeedView);

        document.getElementById('create-comment-form').addEventListener('submit', (e) => handleCreateComment(e, postId));

        // After rendering the post, fetch and render its comments
        loadAndRenderComments(postId);
    } catch (error) {
        console.error('Error showing single post:', error);
        console.error('Could not load the post. Please try again.');
    }
}