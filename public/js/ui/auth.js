// --- DOM Elements ---
const DOMElements = {
    registerView: document.getElementById("register"),
    loginView: document.getElementById("login"),
    registerForm: document.getElementById('registerForm'),
    loginForm: document.getElementById('loginForm'),
    authContainer: document.getElementById('auth-container'),
    mainContainer: document.getElementById('main-container'),
    welcomeMessage: document.getElementById('welcome-message'),
    logoutButton: document.getElementById('logout-button')
};

// --- View Toggling ---
export function showLoginForm() {
    if (DOMElements.registerView) DOMElements.registerView.style.display = "none";
    if (DOMElements.loginView) DOMElements.loginView.style.display = "flex";
}

export function showRegisterForm() {
    if (DOMElements.registerView) DOMElements.registerView.style.display = "flex";
    if (DOMElements.loginView) DOMElements.loginView.style.display = "none";
}

// --- View Management ---
export function showMainView(user) {
    DOMElements.welcomeMessage.textContent = `Welcome, ${user.nickname || 'User'}!`;
    DOMElements.authContainer.classList.add('hidden');
    DOMElements.mainContainer.classList.remove('hidden');
}

export function showAuthView() {
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



export function handleLogout() {
    // Clear any session data if necessary (e.g., tokens)
    // For this example, we simply switch views
    alert('You have been logged out.');
    showAuthView();    
}