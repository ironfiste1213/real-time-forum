import { initializeRouter } from './router.js';

function initializeApp() {
    console.log("[app.js:initializeApp] initializeApp after domcontentloaded");
    
    // Initialize the client-side router
    initializeRouter();

    // Event handlers will be attached dynamically when views are created
}

document.addEventListener('DOMContentLoaded', initializeApp);
