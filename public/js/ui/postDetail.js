import { fetchComments } from "../api/loadcomments.js";
import { handleCreateComment } from "../api/createcomment.js";
import { fetchPostDetails } from "../api/fetchpost.js";


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

export function renderCommentsComponent(data, postId) {
    const section = document.getElementById("comments-section");
    if (!section) return;

    section.innerHTML = "";

    const comments = data.comments || [];
    const total = data.total || 0;
    const page = data.page || 1;
    const limit = data.limit || 5;

    if (!comments || comments.length === 0) {
        section.textContent = "No comments yet. Be the first to comment!";
        // Reset if empty, but maybe we should show controls if page > 1?
        // If page > 1 and no comments, it's weird, but handle it by showing "Previous" if possible.
        if (page > 1) {
            const controls = document.createElement("div");
            controls.className = "pagination-controls";
            const prevBtn = document.createElement("button");
            prevBtn.textContent = "← Previous";
            prevBtn.onclick = () => loadAndRenderComments(postId, page - 1);
            controls.appendChild(prevBtn);
            section.appendChild(controls);
        }
        return;
    }

    const list = document.createElement("div");
    list.id = "comments-list";

    comments.forEach(comment => {
        const wrapper = document.createElement("div");
        wrapper.className = "comment";

        const date = new Date(comment.createdAt).toLocaleString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });

        const meta = document.createElement("p");
        meta.className = "comment-meta";
        meta.innerHTML = `<strong>${comment.author.nickname}</strong> on ${date}`;

        const content = document.createElement("p");
        content.className = "comment-content";

        comment.content.split("\n").forEach((line, i) => {
            if (i > 0) content.appendChild(document.createElement("br"));
            content.appendChild(document.createTextNode(line));
        });

        wrapper.appendChild(meta);
        wrapper.appendChild(content);
        list.appendChild(wrapper);
    });

    section.appendChild(list);

    // Pagination Controls
    const totalPages = Math.ceil(total / limit);
    if (totalPages > 1) {
        const controls = document.createElement("div");
        controls.className = "pagination-controls";
        controls.style.display = "flex";
        controls.style.justifyContent = "center";
        controls.style.gap = "10px";
        controls.style.marginTop = "10px";

        const prevBtn = document.createElement("button");
        prevBtn.textContent = "←";
        prevBtn.className = "pagination-btn"; // Add class
        prevBtn.disabled = page <= 1;
        if (!prevBtn.disabled) {
            prevBtn.onclick = () => loadAndRenderComments(postId, page - 1);
        }

        const nextBtn = document.createElement("button");
        nextBtn.textContent = "→";
        nextBtn.className = "pagination-btn"; // Add class
        nextBtn.disabled = page >= totalPages;
        if (!nextBtn.disabled) {
            nextBtn.onclick = () => loadAndRenderComments(postId, page + 1);
        }

        controls.appendChild(prevBtn);
        // Optional: Show page info
        const info = document.createElement("span");
        info.className = "pagination-info"; // Add class
        info.textContent = ` ${page} / ${totalPages} `;
        controls.appendChild(info);

        controls.appendChild(nextBtn);
        section.appendChild(controls);
    }
}

export async function loadAndRenderComments(postId, page = 1) {
    const list = document.getElementById("comments-list");
    const section = document.getElementById("comments-section");

    // If list exists, fade it out first
    if (list) {
        list.classList.add("fade-out");
        // Wait for animation
        await new Promise(resolve => setTimeout(resolve, 300));
    } else {
        // First load or empty, clear immediately
        if (section) section.innerHTML = "<p>Loading comments...</p>";
    }

    try {
        const data = await fetchComments(postId, page);
        renderCommentsComponent(data, postId);
    } catch (e) {
        console.error(e);
        if (section) section.innerHTML = `<p class="error-message">Could not load comments.</p>`;
    }
}



function renderPostDetails(post, postId) {
    const singlePostView = document.getElementById('single-post-view');
    const mainFeedView = document.getElementById('main-feed-view');

    console.log('[ui/postDetail.js:renderPostDetails] Successfully fetched post data:', post);

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
}

export async function showSinglePostComponent(postId) {
    try {
        const post = await fetchPostDetails(postId);
        renderPostDetails(post, postId);
    } catch (error) {
        console.error('Error showing single post:', error);
        console.error('Could not load the post. Please try again.');
    }
}
