import { handleLogin, handleRegister, showLoginForm, showRegisterForm, initDOMElements } from './ui/auth.js';

// All DOM queries and event wiring happen after DOMContentLoaded to avoid
// null references when scripts run before the elements exist.
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

    // Attach logout handler to bring user back to auth view (frontend-only)
    const logoutButton = document.getElementById('logout-button');
    logoutButton?.addEventListener('click', (e) => {
        e.preventDefault();
        // Ideally call backend /logout; for now just show auth view
        showRegisterForm();
        document.getElementById('main-container')?.classList.add('hidden');
        document.getElementById('auth-container')?.classList.remove('hidden');
    });
}

document.addEventListener('DOMContentLoaded', initializeAuthRouting);

// Also initialize DOM references in the auth module
document.addEventListener('DOMContentLoaded', initDOMElements);

// Check current session on load and keep user logged in after refresh
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const resp = await fetch('/me');
        if (resp.ok) {
            const data = await resp.json();
            if (data && data.user) {
                // Show main view with returned user
                const { showMainView } = await import('./ui/auth.js');
                showMainView(data.user);
                return;
            }
        }
    } catch (e) {
        // ignore network errors, fall back to auth view
        console.error('Error checking session:', e);
    }
    // Default to showing auth view
    document.getElementById('auth-container')?.classList.remove('hidden');

    // Wire logout button to show auth view (helps during testing)
    document.getElementById('logout-button')?.addEventListener('click', async () => {
        await fetch('/logout', { method: 'POST' }).catch(() => {});
        const { showAuthView } = await import('./ui/auth.js');
        showAuthView();
    });
});