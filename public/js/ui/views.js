import { loadPosts, loadCategories } from "./posts.js";
import { getCurrentUser } from "../session.js";

// --- DOM Elements ---
const DOMElements = {
    authContainer: document.getElementById('auth-container'),
    mainContainer: document.getElementById('main-container'),
    welcomeMessage: document.getElementById('welcome-message'),
};

// --- View Management ---
export function showMainFeedView(user) {
    const currentUser = user || getCurrentUser();
    if (currentUser && currentUser.nickname) {
        DOMElements.welcomeMessage.textContent = `Welcome, ${currentUser.nickname}!`;
    }
    DOMElements.authContainer.classList.add('hidden');
    DOMElements.mainContainer.classList.remove('hidden');
    loadPosts(); // Load posts when showing the main view
    loadCategories(); // Load categories for the create post form
}

export function showAuthView() {
    DOMElements.authContainer.classList.remove('hidden');
    DOMElements.mainContainer.classList.add('hidden');
    // The router will handle showing login or register specifically.
}