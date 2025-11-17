import { showSinglePostComponent } from './postDetail.js';
import { fetchPosts } from '../api/fetchposts.js';
 
 function createPostComponent(post) {
    const postElement = document.createElement('div');
    postElement.classList.add('post');
    postElement.dataset.postId = post.id; // Store post ID for later use (e.g., clicking to see comments)
 
    postElement.addEventListener('click', () => showSinglePostComponent(post.id));

    const title = document.createElement('h3');
    title.textContent = post.title;

    const meta = document.createElement('p');
    meta.classList.add('post-meta');

    // Create a container for the meta info with rounded style
    const metaContainer = document.createElement('span');
    metaContainer.classList.add('meta-container');

    // Icon
    const icon = document.createElement('span');
    icon.classList.add('user-icon');
    icon.textContent = '👤'; // Human icon

    // Username
    const username = document.createElement('span');
    username.classList.add('username');
    username.textContent = post.author ? post.author.nickname : 'Unknown';

    // Date
    const postDate = new Date(post.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
    const dateSpan = document.createElement('span');
    dateSpan.classList.add('post-date');
    dateSpan.textContent = ` on ${postDate}`;

    metaContainer.appendChild(icon);
    metaContainer.appendChild(username);
    metaContainer.appendChild(dateSpan);
    meta.appendChild(metaContainer);

    const contentSnippet = document.createElement('p');
    contentSnippet.classList.add('post-content-snippet');
    // Create a short preview of the content
    const snippet = post.content.substring(0, 100);
    contentSnippet.textContent = snippet + (post.content.length > 100 ? '...' : '');

    const categories = document.createElement('div');
    categories.classList.add('categories');
    if (post.categories && post.categories.length > 0) {
        post.categories.forEach(cat => {
            const categorySpan = document.createElement('span');
            categorySpan.classList.add('category');
            categorySpan.textContent = cat;
            categories.appendChild(categorySpan);
        });
    } else {
        const noCategorySpan = document.createElement('span');
        noCategorySpan.classList.add('category', 'no-category');
        noCategorySpan.textContent = 'no category';
        categories.appendChild(noCategorySpan);
    }

    postElement.appendChild(title);
    postElement.appendChild(meta);
    postElement.appendChild(contentSnippet);
    postElement.appendChild(categories);

    return postElement;
}



function renderPosts(posts) {
    const postFeed = document.getElementById('post-feed');
    if (!postFeed) return; // Element might not exist yet if view not loaded

    // Clear previous content
    while (postFeed.firstChild) {
        postFeed.removeChild(postFeed.firstChild);
    }

    if (posts && posts.length > 0) {
        posts.forEach(post => {
            const postElement = createPostComponent(post);
            postFeed.appendChild(postElement);
        });
    } else {
        const emptyState = document.createElement('p');
        emptyState.setAttribute('data-empty-state', '');
        emptyState.textContent = 'No posts yet. Be the first to create one!';
        postFeed.appendChild(emptyState);
    }
}

export async function loadPosts() {
    try {
        const posts = await fetchPosts();
        renderPosts(posts);
    } catch (error) {
        console.error('Error loading posts:', error);
        const postFeed = document.getElementById('post-feed');
        if (postFeed) {
            const errorElement = document.createElement('p');
            errorElement.textContent = 'Error loading posts. Please try again later.';
            postFeed.appendChild(errorElement);
        }
    }
}




