import { handleLogin, handleRegister, handleLogout } from './ui/auth.js';
import { handleCreatePost } from './ui/posts.js';
import { initializeRouter } from './router.js';

function initializeApp() {
    const registerForm = document.getElementById('registerForm');
    const loginForm = document.getElementById('loginForm');
    const logoutButton = document.getElementById('logout-button');
    const createPostForm = document.getElementById('create-post-form');

    // Initialize the client-side router
    initializeRouter();

    // Attach event handlers that don't involve navigation
    logoutButton?.addEventListener('click', (e) => {
        e.preventDefault();
        handleLogout();
    });
    registerForm?.addEventListener('submit', handleRegister);
    loginForm?.addEventListener('submit', handleLogin);
    createPostForm?.addEventListener('submit', handleCreatePost);
}

document.addEventListener('DOMContentLoaded', initializeApp);