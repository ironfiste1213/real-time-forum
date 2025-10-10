import { handleRegister, handleLogin } from './ui/auth.js';

// Get the registration form
const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');

// Handle registration form submission
registerForm.addEventListener('submit', handleRegister);

// Handle login form submission
loginForm.addEventListener('submit', handleLogin);