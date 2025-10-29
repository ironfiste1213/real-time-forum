import { showSinglePostView } from './postDetail.js';
import { handleLogout } from './auth.js';
 
 function createPostElement(post) {
    const postElement = document.createElement('div');
    postElement.classList.add('post');
    postElement.dataset.postId = post.id; // Store post ID for later use (e.g., clicking to see comments)
 
    postElement.addEventListener('click', () => showSinglePostView(post.id));

    const title = document.createElement('h3');
    title.textContent = post.title;

    const meta = document.createElement('p');
    meta.classList.add('post-meta');
    // The backend query joins the user table, so we can access the author's nickname
    const authorNickname = post.author ? post.author.nickname : 'Unknown';
    const postDate = new Date(post.created_at).toLocaleString();
    meta.textContent = `by ${authorNickname} on ${postDate}`;

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

        postFeed.innerHTML = ''; // Clear previous content
        if (posts && posts.length > 0) {
            posts.forEach(post => {
                const postElement = createPostElement(post);
                postFeed.appendChild(postElement);
            });
        } else {
            postFeed.innerHTML = '<p>No posts yet. Be the first to create one!</p>';
        }
    } catch (error) {
        console.error('Error loading posts:', error);
        postFeed.innerHTML = '<p>Error loading posts. Please try again later.</p>';
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
        categoriesContainer.innerHTML = ''; // Clear existing

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
            categoriesContainer.innerHTML = '<span>No categories available.</span>';
        }
    } catch (error) {
        console.error('Error loading categories:', error);
        categoriesContainer.innerHTML = '<span>Error loading categories.</span>';
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
            alert('Failed to create post: ' + (result.message || 'Unknown error'));
        }
    } catch (error) {
        // --- DEBUG: Log any network or parsing errors ---
        console.error('A network or parsing error occurred during post creation:', error);
        alert('An error occurred. Please check the console for details.');
    }
}
