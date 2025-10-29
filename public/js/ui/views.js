import { loadPosts, loadCategories } from "./posts.js";
import { getCurrentUser } from "../session.js";
import { handleCreatePost } from "./posts.js";
import { handleLogout } from "./auth.js";
import chatWS from "../ws.js";
// --- DOM Elements ---
const DOMElements = {
    authContainer: document.getElementById('auth-container'),
    mainContainer: document.getElementById('main-container'),
    notFoundView: document.getElementById('not-found-view'),
};

// --- Dynamic Content Creation ---
function createMainFeedContent(user) {
    const container = document.createElement('div');

    // Navigation
    const nav = document.createElement('nav');
    const welcomeMessage = document.createElement('span');
    welcomeMessage.id = 'welcome-message';
    welcomeMessage.textContent = user && user.nickname ? `Welcome, ${user.nickname}!` : 'Welcome!';
    nav.appendChild(welcomeMessage);

    // Chat toggle button
    const chatToggleButton = document.createElement('button');
    chatToggleButton.id = 'chat-toggle-btn';
    chatToggleButton.textContent = 'Chat';
    chatToggleButton.className = 'chat-toggle-btn';
    nav.appendChild(chatToggleButton);

    const logoutButton = document.createElement('button');
    logoutButton.id = 'logout-button';
    logoutButton.textContent = 'Logout';
    nav.appendChild(logoutButton);
    container.appendChild(nav);

    // Main feed view
    const mainFeedView = document.createElement('div');
    mainFeedView.id = 'main-feed-view';

    const mainContent = document.createElement('main');
    mainContent.className = 'main-content';

    // Create post toggle button
    const createPostToggle = document.createElement('button');
    createPostToggle.id = 'create-post-toggle';
    createPostToggle.textContent = '+ Create Post';
    createPostToggle.className = 'create-post-toggle-btn';
    mainContent.appendChild(createPostToggle);

    // Create post section (initially hidden)
    const createPostSection = document.createElement('section');
    createPostSection.id = 'create-post-section';
    createPostSection.className = 'card hidden';

    const createPostHeading = document.createElement('h3');
    createPostHeading.textContent = 'Create a New Post';
    createPostSection.appendChild(createPostHeading);

    const createPostForm = document.createElement('form');
    createPostForm.id = 'create-post-form';

    // Title input
    const titleGroup = document.createElement('div');
    titleGroup.className = 'form-group';
    const titleLabel = document.createElement('label');
    titleLabel.setAttribute('for', 'post-title');
    titleLabel.textContent = 'Title';
    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.id = 'post-title';
    titleInput.name = 'title';
    titleInput.placeholder = 'Post Title';
    titleInput.required = true;
    titleGroup.appendChild(titleLabel);
    titleGroup.appendChild(titleInput);
    createPostForm.appendChild(titleGroup);

    // Content textarea
    const contentGroup = document.createElement('div');
    contentGroup.className = 'form-group';
    const contentLabel = document.createElement('label');
    contentLabel.setAttribute('for', 'post-content');
    contentLabel.textContent = 'Content';
    const contentTextarea = document.createElement('textarea');
    contentTextarea.id = 'post-content';
    contentTextarea.name = 'content';
    contentTextarea.placeholder = 'What\'s on your mind?';
    contentTextarea.rows = 4;
    contentTextarea.required = true;
    contentGroup.appendChild(contentLabel);
    contentGroup.appendChild(contentTextarea);
    createPostForm.appendChild(contentGroup);

    // Categories
    const categoriesGroup = document.createElement('div');
    categoriesGroup.className = 'form-group';
    const categoriesLabel = document.createElement('label');
    categoriesLabel.textContent = 'Categories:';
    categoriesGroup.appendChild(categoriesLabel);

    const categoriesContainer = document.createElement('div');
    categoriesContainer.id = 'categories-container';
    categoriesContainer.className = 'categories-checkboxes';
    categoriesGroup.appendChild(categoriesContainer);
    createPostForm.appendChild(categoriesGroup);

    // Submit button
    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.textContent = 'Create Post';
    createPostForm.appendChild(submitButton);

    createPostSection.appendChild(createPostForm);
    mainContent.appendChild(createPostSection);

    // Post feed section
    const postFeedSection = document.createElement('section');
    postFeedSection.id = 'post-feed-section';

    const feedHeading = document.createElement('h2');
    feedHeading.textContent = 'Feed';
    postFeedSection.appendChild(feedHeading);

    const postFeed = document.createElement('div');
    postFeed.id = 'post-feed';
    postFeedSection.appendChild(postFeed);

    mainContent.appendChild(postFeedSection);
    mainFeedView.appendChild(mainContent);
    container.appendChild(mainFeedView);

    return container;
}

// --- View Management ---
export function showMainFeedView(user) {
    const currentUser = user || getCurrentUser();

    // Clear existing content
    DOMElements.mainContainer.innerHTML = '';

    // Create and append main feed content
    const mainFeedContent = createMainFeedContent(currentUser);
    DOMElements.mainContainer.appendChild(mainFeedContent);

    // Show main container
    DOMElements.authContainer.classList.add('hidden');
    DOMElements.mainContainer.classList.remove('hidden');

    // Attach event handlers for dynamically created elements
    const logoutButton = document.getElementById('logout-button');
    const createPostForm = document.getElementById('create-post-form');
    const chatToggleBtn = document.getElementById('chat-toggle-btn');
    const createPostToggle = document.getElementById('create-post-toggle');

    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            handleLogout();
        });
    }

    if (createPostForm) {
        createPostForm.addEventListener('submit', handleCreatePost);
    }

    if (chatToggleBtn) {
        chatToggleBtn.addEventListener('click', () => {
            chatWS.toggleChat();
        });
    }

    if (createPostToggle) {
        createPostToggle.addEventListener('click', () => {
            const createPostSection = document.getElementById('create-post-section');
            const isHidden = createPostSection.classList.contains('hidden');

            if (isHidden) {
                createPostSection.classList.remove('hidden');
                createPostToggle.textContent = '- Hide Create Post';
                createPostToggle.classList.add('active');
            } else {
                createPostSection.classList.add('hidden');
                createPostToggle.textContent = '+ Create Post';
                createPostToggle.classList.remove('active');
            }
        });
    }

    // Load dynamic content
    loadPosts(); // Load posts when showing the main view
    loadCategories(); // Load categories for the create post form
}

export function showAuthView() {
    DOMElements.authContainer.classList.remove('hidden');
    DOMElements.mainContainer.classList.add('hidden');
    // The router will handle showing login or register specifically.
}

export function show404View() {
    // Hide all other views
    DOMElements.authContainer.classList.add('hidden');
    DOMElements.mainContainer.classList.add('hidden');
    // Show the 404 view
    DOMElements.notFoundView.classList.remove('hidden');
}
