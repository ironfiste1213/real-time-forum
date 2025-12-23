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

// State management for infinite scrolling
let allPosts = [];
let currentChunk = 0;
const CHUNK_SIZE = 6;

function renderPostsChunk(posts, from, to) {
    const postFeed = document.getElementById('post-feed');
    if (!postFeed) return;
    
    for (let i = from; i <= to && i < posts.length; i++) {
        const postElement = createPostComponent(posts[i]);
        postFeed.appendChild(postElement);
    }
}

function renderInitialPosts() {
    const postFeed = document.getElementById('post-feed');
    if (!postFeed) return;

    // Clear previous content
    while (postFeed.firstChild) {
        postFeed.removeChild(postFeed.firstChild);
    }

    if (allPosts.length === 0) {
        const emptyState = document.createElement('p');
        emptyState.setAttribute('data-empty-state', '');
        emptyState.textContent = 'No posts yet. Be the first to create one!';
        postFeed.appendChild(emptyState);
        return;
    }

    // Render first chunk (posts 0-5)
    currentChunk = 0;
    renderPostsChunk(allPosts, 0, CHUNK_SIZE - 1);
}

function loadMorePosts() {
    currentChunk++;
    const startIndex = currentChunk * CHUNK_SIZE;
    const endIndex = startIndex + CHUNK_SIZE - 1;
    
    // Check if we have more posts to load
    if (startIndex >= allPosts.length) {
        return; // No more posts to load
    }
    
    renderPostsChunk(allPosts, startIndex, endIndex);
    
    // Hide load more button if no more posts
    if (endIndex >= allPosts.length - 1) {
        const loadMoreButton = document.getElementById('load-more-button');
        if (loadMoreButton) {
            loadMoreButton.style.display = 'none';
        }
    }
}

function createLoadMoreButton() {
    const button = document.createElement('button');
    button.id = 'load-more-button';
    button.textContent = 'Load More Posts';
    button.style.margin = '20px auto';
    button.style.display = 'block';
    button.style.padding = '10px 20px';
    button.style.fontSize = '16px';
    button.style.backgroundColor = '#007bff';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '5px';
    button.style.cursor = 'pointer';
    
    button.addEventListener('click', loadMorePosts);
    
    return button;
}

export async function loadPosts() {
    try {
        // Load all posts once from backend
        allPosts = await fetchPosts();
        renderInitialPosts();

        // Show Load More button if there are more posts
        if (allPosts.length > CHUNK_SIZE) {
            const postFeed = document.getElementById('post-feed');
            if (postFeed) {
                // Remove existing load more button if any
                const existingButton = document.getElementById('load-more-button');
                if (existingButton) {
                    existingButton.remove();
                }
                
                // Add new load more button
                const loadMoreButton = createLoadMoreButton();
                postFeed.parentNode.insertBefore(loadMoreButton, postFeed.nextSibling);
            }
        }
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




