// --- DOM Elements (populated after DOMContentLoaded) ---
const DOMElements = {
    registerView: null,
    loginView: null,
    registerForm: null,
    loginForm: null,
    authContainer: null,
    mainContainer: null,
    welcomeMessage: null,
};

// Populate DOMElements once the DOM is ready. Call this from the entrypoint.
export function initDOMElements() {
    DOMElements.registerView = document.getElementById("register");
    DOMElements.loginView = document.getElementById("login");
    DOMElements.registerForm = document.getElementById('registerForm');
    DOMElements.loginForm = document.getElementById('loginForm');
    DOMElements.authContainer = document.getElementById('auth-container');
    DOMElements.mainContainer = document.getElementById('main-container');
    DOMElements.welcomeMessage = document.getElementById('welcome-message');
}

// --- View Toggling ---
export function showLoginForm() {
    // Query again as a safety, in case init wasn't called
    if (!DOMElements.registerView) DOMElements.registerView = document.getElementById("register");
    if (!DOMElements.loginView) DOMElements.loginView = document.getElementById("login");
    if (DOMElements.registerView) DOMElements.registerView.classList.add('hidden');
    if (DOMElements.loginView) DOMElements.loginView.classList.remove('hidden');
}

export function showRegisterForm() {
    if (!DOMElements.registerView) DOMElements.registerView = document.getElementById("register");
    if (!DOMElements.loginView) DOMElements.loginView = document.getElementById("login");
    if (DOMElements.registerView) DOMElements.registerView.classList.remove('hidden');
    if (DOMElements.loginView) DOMElements.loginView.classList.add('hidden');
}

// --- View Management ---
export function showMainView(user) {
    if (!DOMElements.welcomeMessage) DOMElements.welcomeMessage = document.getElementById('welcome-message');
    if (!DOMElements.authContainer) DOMElements.authContainer = document.getElementById('auth-container');
    if (!DOMElements.mainContainer) DOMElements.mainContainer = document.getElementById('main-container');
    DOMElements.welcomeMessage.textContent = `Welcome, ${user.nickname || 'User'}!`;
    DOMElements.authContainer.classList.add('hidden');
    DOMElements.mainContainer.classList.remove('hidden');
}

export function showAuthView() {
    if (!DOMElements.authContainer) DOMElements.authContainer = document.getElementById('auth-container');
    if (!DOMElements.mainContainer) DOMElements.mainContainer = document.getElementById('main-container');
    DOMElements.authContainer.classList.remove('hidden');
    DOMElements.mainContainer.classList.add('hidden');
    showRegisterForm(); // Default to register view on logout
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
            if (!DOMElements.registerForm) DOMElements.registerForm = document.getElementById('registerForm');
            DOMElements.registerForm.reset();
            showLoginForm(); // Switch to login form after successful registration
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
    if (!DOMElements.loginForm) DOMElements.loginForm = document.getElementById('loginForm');
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
            alert('Login successful!');
            DOMElements.loginForm.reset();
            showMainView(result.user || {});
        } else {
            alert('Login failed: ' + (result.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Network error during login. Please try again.');
    }
}