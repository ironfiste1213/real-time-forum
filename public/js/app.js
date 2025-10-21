import { handleLogin, handleRegister, showLoginForm, showRegisterForm, handleLogout } from './ui/auth.js';

function initializeAuthRouting() {
    const registerForm = document.getElementById('registerForm');
    const loginForm = document.getElementById('loginForm');
    const linkToLogin = document.getElementById('logfromreg');
    const linkToRegister = document.getElementById('regfromlog');
    const logoutButton = document.getElementById('logout-button');

    // Attach logout handler
    logoutButton?.addEventListener('click', (e) => {
        e.preventDefault();
        handleLogout();
    });

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