import { handleLogin, handleRegister, showLoginForm, showRegisterForm } from './ui/auth.js';

function initializeAuthRouting() {
    const registerForm = document.getElementById('registerForm');
    const loginForm = document.getElementById('loginForm');
    const linkToLogin = document.getElementById('logfromreg');
    const linkToRegister = document.getElementById('regfromlog');

    // Attach form submission handlers
    registerForm?.addEventListener('submit', handleRegister);
    loginForm?.addEventListener('submit', handleLogin);

    // Attach view-switching handlers
    linkToLogin?.addEventListener('click', (e) => {
        e.preventDefault();
        showLoginForm();
    });
    linkToRegister?.addEventListener('click', (e) => {
        e.preventDefault();
        showRegisterForm();
    });
}

document.addEventListener('DOMContentLoaded', initializeAuthRouting);