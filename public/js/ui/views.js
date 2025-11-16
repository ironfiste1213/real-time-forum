import { loadPosts, loadCategories } from "./posts.js";
import { getCurrentUser } from "../session.js";
import { handleCreatePost } from "./posts.js";
import { handleLogout } from "../api/logout.js";
import chatWS from "../ws.js";
import { createChatPanel, setupChatEventListeners, initializeChatConnection, createFloatingChatButton } from "./chat.js";
import { createCreatePostSection } from "./creatpost.js";
// --- DOM Elements ---
const DOMElements = {
    authContainer: document.getElementById('auth-container'),
    mainContainer: document.getElementById('main-container'),
    notFoundView: document.getElementById('not-found-view'),
};

// --- Dynamic Content Creation ---
function createNav(user) {
    const nav = document.createElement('nav');

    // Left section: Welcome message
    const leftSection = document.createElement('div');
    const welcomeMessage = document.createElement('span');
    welcomeMessage.id = 'welcome-message';
    welcomeMessage.textContent = user && user.nickname ? `Welcome, ${user.nickname}!` : 'Welcome!';
    leftSection.appendChild(welcomeMessage);
    nav.appendChild(leftSection);

    // Center section: Create Post button
    const centerSection = document.createElement('div');
    const createPostToggle = document.createElement('button');
    createPostToggle.id = 'create-post-toggle';
    createPostToggle.textContent = '+ Create Post';
    createPostToggle.className = 'create-post-toggle-btn';
    centerSection.appendChild(createPostToggle);
    nav.appendChild(centerSection);

    // Right section: Logout button
    const rightSection = document.createElement('div');
    const logoutButton = document.createElement('button');
    logoutButton.id = 'logout-button';
    logoutButton.textContent = '➜]';
    rightSection.appendChild(logoutButton);
    nav.appendChild(rightSection);

    return nav;
}

function createMainFeedContent(user) {
    // Navigation
    const nav = createNav(user);

    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.maxWidth = '1200px';
    container.appendChild(nav);

    // Main feed view
    const mainFeedView = document.createElement('div');
    mainFeedView.id = 'main-feed-view';
    mainFeedView.style.width = '100%';
    mainFeedView.style.maxWidth = '1200px';

    const mainContent = document.createElement('main');
    mainContent.className = 'main-content';
    mainContent.style.width = '100%';

    // Create post section using the imported function
    const createPostSection = createCreatePostSection();
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

    // Add floating chat button using the imported function
    const floatingChatButton = createFloatingChatButton();
    container.appendChild(floatingChatButton);

    return container;
}

// --- View Management ---
export function showMainFeedView(user) {
    const currentUser = user || getCurrentUser();

    // Clear existing content
    while (DOMElements.mainContainer.firstChild) {
        DOMElements.mainContainer.removeChild(DOMElements.mainContainer.firstChild);
    }

    // Create and append main feed content
    const mainFeedContent = createMainFeedContent(currentUser);
    DOMElements.mainContainer.appendChild(mainFeedContent);

    // Show main container
    DOMElements.authContainer.classList.add('hidden');
    DOMElements.mainContainer.classList.remove('hidden');

    // Attach event handlers for dynamically created elements
    const logoutButton = document.getElementById('logout-button');
    const createPostForm = document.getElementById('create-post-form');
    const floatingChatBtn = document.getElementById('floating-chat-btn');
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

    if (floatingChatBtn) {
        floatingChatBtn.addEventListener('click', () => {
            toggleChatView();
        });
    }

    if (createPostToggle) {
        // Ensure button is visible on initial load
        createPostToggle.style.opacity = '1';
        createPostToggle.addEventListener('click', () => {
            const createPostSection = document.getElementById('create-post-section');
            const isOpen = createPostSection.classList.contains('open');

            if (isOpen) {
                createPostSection.classList.remove('open');
                createPostToggle.textContent = '+ Create Post';
                createPostToggle.classList.remove('active');
            } else {
                createPostSection.classList.add('open');
                createPostToggle.textContent = '- Hide Create Post';
                createPostToggle.classList.add('active');
            }
        });
    }

    // Load dynamic content
    loadPosts(); // Load posts when showing the main view
    loadCategories(); // Load categories for the create post form

    // Ensure chat panel exists and is properly set up
    let chatPanel = document.getElementById('chat-panel');
    if (!chatPanel) {
        createChatPanel();
    }
    setupChatEventListeners();

    // Initialize chat connection if user is logged in
    if (currentUser) {
        initializeChatConnection(currentUser);
    }
}

export function showAuthView() {
    DOMElements.authContainer.classList.remove('hidden');
    DOMElements.mainContainer.classList.add('hidden');
    // Hide chat panel when showing auth view
    const chatPanel = document.getElementById('chat-panel');
    if (chatPanel) {
        chatPanel.classList.remove('open');
    }
    // The router will handle showing login or register specifically.
}

export function show404View() {
    // Hide all other views
    DOMElements.authContainer.classList.add('hidden');
    DOMElements.mainContainer.classList.add('hidden');
    // Show the 404 view
    DOMElements.notFoundView.classList.remove('hidden');
}

// Toggle between main view and chat view
function toggleChatView() {
    const mainContainer = DOMElements.mainContainer;
    const chatPanel = document.getElementById('chat-panel');
    const floatingChatBtn = document.getElementById('floating-chat-btn');

    if (mainContainer.classList.contains('hidden')) {
        // Currently in chat view, switch back to main
        mainContainer.classList.remove('hidden');
        if (chatPanel) chatPanel.classList.remove('open');
        if (floatingChatBtn) floatingChatBtn.style.display = 'block';
    } else {
        // Currently in main view, switch to chat
        mainContainer.classList.add('hidden');
        if (chatPanel) chatPanel.classList.add('open');
        if (floatingChatBtn) floatingChatBtn.style.display = 'none';
    }
}
