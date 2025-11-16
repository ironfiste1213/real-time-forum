import { showMainFeedView, showAuthView } from "./views.js";
import { checkSession, getCurrentUser, clearCurrentUser } from "../session.js";
import { initializeChatConnection } from "./chat.js";
import chatWS from "../ws.js";
import { createRegisterForm } from "./register.js";
import { createLoginForm } from "./login.js";
import { showNotification } from "./notification.js";
import { clearUIElement } from "./clear.js";
import { handleLogin } from "../api/login.js";



// --- DOM Elements ---
const DOMElements = {
    authContainer: document.getElementById('auth-container'),
    logoutButton: document.getElementById('logout-button')
};





export function showLoginForm() {
    showAuthView();
    // Clear existing auth forms
    while (DOMElements.authContainer.firstChild) {
        DOMElements.authContainer.removeChild(DOMElements.authContainer.firstChild);
    }
    // Add title
    const title = document.createElement('h1');
    title.textContent = 'REAL TIME FORUM';
    DOMElements.authContainer.appendChild(title);
    // Create and append login form
    const loginForm = createLoginForm();
    DOMElements.authContainer.appendChild(loginForm);

    // Re-attach event listeners
    const form = document.getElementById('loginForm');
    if (form) {
        form.addEventListener('submit', handleLogin);
    }

    // Trigger fade-in animation
    setTimeout(() => {
        loginForm.classList.add('fade-in');
    }, 10);
}

export function showRegisterForm() {
    showAuthView();
    // Clear existing auth forms
    while (DOMElements.authContainer.firstChild) {
        DOMElements.authContainer.removeChild(DOMElements.authContainer.firstChild);
    }
    // Add title
    const title = document.createElement('h1');
    title.textContent = 'REAL TIME FORUM';
    DOMElements.authContainer.appendChild(title);
    // Create and append register form
    const registerForm = createRegisterForm();
    DOMElements.authContainer.appendChild(registerForm);

    // Re-attach event listeners
    const regForm = document.getElementById('registerForm');
    if (regForm) {
        regForm.addEventListener('submit', handleRegister);
    }

    // Trigger fade-in animation
    setTimeout(() => {
        registerForm.classList.add('fade-in');
    }, 10);
}

// Handle registration form submission
export async function handleRegister(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const userData = Object.fromEntries(formData.entries());
    userData.age = parseInt(userData.age, 10);

    try {
        const response = await fetch('/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });

        const result = await response.json();
        if (response.ok) {
            form.reset();
            showNotification('Registration successful! Please log in.', 'success');
            // Use router to navigate to login page
            window.history.pushState({}, "", "/login");
            showLoginForm();
        } else {
            // Show error notification with backend message
            showNotification(result.message || 'Registration failed. Please try again.');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showNotification('Network error. Please check your connection and try again.');
    }
}



export async function handleLogout() {
    try {
        const response = await fetch('/logout', {
            method: 'POST', // Or GET, depending on your server route's expectation
        });

        if (!response.ok) {
            const result = await response.json();
            console.error('Logout failed on server:', result.message);
        }
    } catch (error) {
        console.error('Network error during logout:', error);
    } finally {
        // Always switch the view, even if the server call fails, to ensure the user is logged out on the frontend.
        // Manually clear the session state without making another API call
        clearCurrentUser();
        // Clear all UI elements except auth
        clearAllUIElements();
        // Disconnect WebSocket before clearing
        chatWS.disconnect();
        // Use router to navigate to the login page
        window.history.pushState({}, "", "/login");
        showLoginForm();
    }
}

// Clear all UI elements except auth container
function clearAllUIElements() {
    // Clear main container
    const mainContainer = document.getElementById('main-container');
    clearUIElement(mainContainer);

    // Clear single post view
    const singlePostView = document.getElementById('single-post-view');
    clearUIElement(singlePostView);

    // Clear chat panel
    const chatPanel = document.getElementById('chat-panel');
    clearUIElement(chatPanel);

    // Close chat panel and clear messages
    chatWS.clearMessages();
    chatWS.closeChat();
}
