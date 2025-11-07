import { showMainFeedView, showAuthView } from "./views.js";
import { checkSession, getCurrentUser, clearCurrentUser } from "../session.js";
import { initializeChatConnection } from "./chat.js";
import chatWS from "../ws.js";

// --- Notification System ---
function showNotification(message, type = 'error') {
    // Remove any existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    // Append to body
    document.body.appendChild(notification);

    // Trigger fade-in
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

// --- DOM Elements ---
const DOMElements = {
    authContainer: document.getElementById('auth-container'),
    logoutButton: document.getElementById('logout-button')
};

// --- Dynamic Form Creation ---
function createRegisterForm() {
    const registerDiv = document.createElement('div');
    registerDiv.id = 'register';
    registerDiv.className = 'card';

    const heading = document.createElement('h2');
    heading.textContent = 'REGISTER.';
    registerDiv.appendChild(heading);

    const form = document.createElement('form');
    form.id = 'registerForm';

    const fields = [
        { type: 'text', name: 'nickname', placeholder: 'Nickname' },
        { type: 'number', name: 'age', placeholder: 'Age' }
    ];

    fields.forEach(field => {
        const input = document.createElement('input');
        input.type = field.type;
        input.name = field.name;
        input.placeholder = field.placeholder;
        input.required = true;
        form.appendChild(input);
    });

    const select = document.createElement('select');
    select.name = 'gender';
    select.required = true;

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.disabled = true;
    defaultOption.selected = true;
    defaultOption.textContent = 'Select Gender';
    select.appendChild(defaultOption);

    const genderOptions = [
        { value: 'homme', text: 'Homme' },
        { value: 'femme', text: 'Femme' },
        { value: 'autre', text: 'Autre' }
    ];

    genderOptions.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option.value;
        opt.textContent = option.text;
        select.appendChild(opt);
    });

    form.appendChild(select);

    const moreFields = [
        { type: 'text', name: 'firstName', placeholder: 'First Name' },
        { type: 'text', name: 'lastName', placeholder: 'Last Name' },
        { type: 'email', name: 'email', placeholder: 'Email' },
        { type: 'password', name: 'password', placeholder: 'Password' }
    ];

    moreFields.forEach(field => {
        const input = document.createElement('input');
        input.type = field.type;
        input.name = field.name;
        input.placeholder = field.placeholder;
        input.required = true;
        form.appendChild(input);
    });

    const button = document.createElement('button');
    button.type = 'submit';
    button.textContent = 'REGISTER';
    form.appendChild(button);

    const paragraph = document.createElement('p');
    paragraph.className = 'subtxt';
    paragraph.textContent = 'Already have an account? ';
    const link = document.createElement('a');
    link.href = '/login';
    link.id = 'logfromreg';
    link.textContent = 'Sign in';
    paragraph.appendChild(link);
    form.appendChild(paragraph);

    registerDiv.appendChild(form);
    return registerDiv;
}

// --- View Toggling ---
// --- Dynamic Form Creation ---
function createLoginForm() {
    const loginDiv = document.createElement('div');
    loginDiv.id = 'login';
    loginDiv.className = 'card';

    const heading = document.createElement('h2');
    heading.textContent = 'LOGIN.';
    loginDiv.appendChild(heading);

    const form = document.createElement('form');
    form.id = 'loginForm';

    const fields = [
        { type: 'text', name: 'identifier', placeholder: 'Nickname or Email' },
        { type: 'password', name: 'password', placeholder: 'Password' }
    ];

    fields.forEach(field => {
        const input = document.createElement('input');
        input.type = field.type;
        input.name = field.name;
        input.placeholder = field.placeholder;
        input.required = true;
        form.appendChild(input);
    });

    const button = document.createElement('button');
    button.type = 'submit';
    button.textContent = 'LOGIN';
    form.appendChild(button);

    const paragraph = document.createElement('p');
    paragraph.className = 'subtxt';
    paragraph.textContent = 'Don\'t have an account? ';
    const link = document.createElement('a');
    link.href = '/register';
    link.id = 'regfromlog';
    link.textContent = 'Sign up';
    paragraph.appendChild(link);
    form.appendChild(paragraph);

    loginDiv.appendChild(form);
    return loginDiv;
}

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
            // Assuming showLoginForm is imported or handled elsewhere
        } else {
            // Show error notification with backend message
            showNotification(result.message || 'Registration failed. Please try again.');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showNotification('Network error. Please check your connection and try again.');
    }
}

// Handle login form submission
export async function handleLogin(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
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
           e =  await checkSession(); // Update the session state with the new user
            form.reset();
            showNotification('Login successful! Welcome back.', 'success');
            // Initialize chat connection after successful login
            initializeChatConnection(e);
            // Use router to navigate to the main feed
            window.history.pushState({}, "", "/");
            showMainFeedView(getCurrentUser());
        } else {
            // Show error notification with backend message
            showNotification(result.message || 'Login failed. Please check your credentials.');
        }
    } catch (error) {
        console.error('Login error:', error);
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
    if (mainContainer) {
        while (mainContainer.firstChild) {
            mainContainer.removeChild(mainContainer.firstChild);
        }
        mainContainer.classList.add('hidden');
    }

    // Clear single post view
    const singlePostView = document.getElementById('single-post-view');
    if (singlePostView) {
        while (singlePostView.firstChild) {
            singlePostView.removeChild(singlePostView.firstChild);
        }
        singlePostView.classList.add('hidden');
    }

    // Clear chat panel
    const chatPanel = document.getElementById('chat-panel');
    if (chatPanel) {
        chatPanel.remove();
    }

    // Close chat panel and clear messages
    chatWS.clearMessages();
    chatWS.closeChat();
}
