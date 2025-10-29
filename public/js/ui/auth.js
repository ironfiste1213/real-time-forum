import { showMainFeedView, showAuthView } from "./views.js";
import { checkSession, getCurrentUser } from "../session.js";

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
    heading.textContent = 'Create your account.';
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
    heading.textContent = 'Login';
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
    button.textContent = 'Login';
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
    DOMElements.authContainer.innerHTML = '';
    // Create and append login form
    const loginForm = createLoginForm();
    DOMElements.authContainer.appendChild(loginForm);

    // Re-attach event listeners
    const form = document.getElementById('loginForm');
    if (form) {
        form.addEventListener('submit', handleLogin);
    }
}

export function showRegisterForm() {
    showAuthView();
    // Clear existing auth forms
    DOMElements.authContainer.innerHTML = '';
    // Create and append register form
    const registerForm = createRegisterForm();
    DOMElements.authContainer.appendChild(registerForm);

    // Re-attach event listeners
    const regForm = document.getElementById('registerForm');
    if (regForm) {
        regForm.addEventListener('submit', handleRegister);
    }
}

// --- Event Handlers ---

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
            alert('Registration successful!');
            form.reset();
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
            await checkSession(); // Update the session state with the new user
            alert('Login successful!');
            form.reset();
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