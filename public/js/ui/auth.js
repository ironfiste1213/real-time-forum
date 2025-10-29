import { showMainFeedView, showAuthView } from "./views.js";
import { checkSession, getCurrentUser } from "../session.js";
 // --- DOM Elements ---
const DOMElements = {
    registerView: document.getElementById("register"),
    loginView: document.getElementById("login"),
    registerForm: document.getElementById('registerForm'),
    loginForm: document.getElementById('loginForm'),
    logoutButton: document.getElementById('logout-button')
};

// --- View Toggling ---
export function showLoginForm() {
    showAuthView();
    if (DOMElements.registerView) DOMElements.registerView.style.display = "none";
    if (DOMElements.loginView) DOMElements.loginView.style.display = "flex";
}

export function showRegisterForm() {
    showAuthView();
    if (DOMElements.registerView) DOMElements.registerView.style.display = "flex";
    if (DOMElements.loginView) DOMElements.loginView.style.display = "none";
}

// --- Event Handlers ---

// Handle registration form submission
export async function handleRegister(e) {
    e.preventDefault();
    const formData = new FormData(DOMElements.registerForm);
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
            alert('Registration successful!');
            DOMElements.registerForm.reset();
            // Use router to navigate to login page
            window.history.pushState({}, "", "/login");
            showLoginForm();
        } else {
            alert('Registration failed: ' + (result.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Registration error:', error);
        alert('Network error. Please try again.');
    }
}

// Handle login form submission
export async function handleLogin(e) {
    e.preventDefault();
    const formData = new FormData(DOMElements.loginForm);
    // Convert form data keys to lowercase to match backend struct tags
    const loginData = {};
    for (const [key, value] of formData.entries()) {
        loginData[key.toLowerCase()] = value;
    }

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loginData)
        });

        const result = await response.json();
        if (response.ok) {
            await checkSession(); // Update the session state with the new user
            alert('Login successful!');
            DOMElements.loginForm.reset();
            // Use router to navigate to the main feed
            window.history.pushState({}, "", "/");
            showMainFeedView(getCurrentUser());
        } else {
            alert('Login failed: ' + (result.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Network error during login. Please try again.');
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
        alert('You have been logged out.');
        await checkSession(); // This will clear the currentUser
        // Use router to navigate to the login page
        window.history.pushState({}, "", "/login");
        showLoginForm();
    }
}