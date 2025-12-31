import { initializeRouter } from './router.js';

function initializeApp() {
    
    // Initialize the client-side router
    initializeRouter();

    // Event handlers will be attached dynamically when views are created
}

document.addEventListener('DOMContentLoaded', initializeApp);
