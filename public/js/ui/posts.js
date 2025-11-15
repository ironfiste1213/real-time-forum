import { showSinglePostView } from './postDetail.js';
import { handleLogout } from '../ui/auth.js';
 
 function createPostElement(post) {
    const postElement = document.createElement('div');
    postElement.classList.add('post');
    postElement.dataset.postId = post.id; // Store post ID for later use (e.g., clicking to see comments)
 
    postElement.addEventListener('click', () => showSinglePostView(post.id));

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

 export async function loadPosts() {
    const postFeed = document.getElementById('post-feed');
    if (!postFeed) return; // Element might not exist yet if view not loaded

    try {
        const response = await fetch('/api/posts/');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const posts = await response.json();

        // Clear previous content
        while (postFeed.firstChild) {
            postFeed.removeChild(postFeed.firstChild);
        }

        if (posts && posts.length > 0) {
            posts.forEach(post => {
                const postElement = createPostElement(post);
                postFeed.appendChild(postElement);
            });
        } else {
            const emptyState = document.createElement('p');
            emptyState.setAttribute('data-empty-state', '');
            emptyState.textContent = 'No posts yet. Be the first to create one!';
            postFeed.appendChild(emptyState);
        }
    } catch (error) {
        console.error('Error loading posts:', error);
        const errorElement = document.createElement('p');
        errorElement.textContent = 'Error loading posts. Please try again later.';
        postFeed.appendChild(errorElement);
    }
 }

 export async function loadCategories() {
    const categoriesContainer = document.getElementById('categories-container');
    if (!categoriesContainer) return; // Element might not exist yet if view not loaded

    try {
        const response = await fetch('/api/categories');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const categories = await response.json();
        // Clear existing categories
        while (categoriesContainer.firstChild) {
            categoriesContainer.removeChild(categoriesContainer.firstChild);
        }

        if (categories && categories.length > 0) {
            categories.forEach(cat => {
                const checkboxWrapper = document.createElement('div');
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `cat-${cat.id}`;
                checkbox.name = 'categories';
                checkbox.value = cat.id;

                const label = document.createElement('label');
                label.htmlFor = `cat-${cat.id}`;
                label.textContent = cat.name;

                checkboxWrapper.appendChild(checkbox);
                checkboxWrapper.appendChild(label);
                categoriesContainer.appendChild(checkboxWrapper);
            });
        } else {
            const noCategories = document.createElement('span');
            noCategories.textContent = 'No categories available.';
            categoriesContainer.appendChild(noCategories);
        }
    } catch (error) {
        console.error('Error loading categories:', error);
        const errorSpan = document.createElement('span');
        errorSpan.textContent = 'Error loading categories.';
        categoriesContainer.appendChild(errorSpan);
    }
}

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
    console.log('Attempting to create post. Sending data:', JSON.stringify(postData, null, 2));

    try {
        const response = await fetch('/api/posts/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(postData),
        });

        const result = await response.json();

        // --- DEBUG: Log the response from server ---
        console.log('Received response from server:', {
            status: response.status,
            ok: response.ok,
            body: result
        });

        if (response.ok) {
            console.log('Post created successfully, refreshing feed.');
            createPostForm.reset();
            loadPosts(); // Refresh the post feed
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
