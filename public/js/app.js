import { handleLocation } from './router.js';

console.log('app.js: Application starting...');

// Example usage for testing views
// Uncomment the line below to test login view
document.addEventListener('DOMContentLoaded', () => {
    handleLocation();
        // Chat connection will be initialized in showMainFeedView if user is logged in
        window.addEventListener("pageshow", (event) => {
            if (event.persisted) {
                console.log("[router.js] Page restored from cache, re-initialize router");
                handleLocation();
            }
        });
    // Handle browser back/forward button clicks.
    window.addEventListener("popstate", handleLocation);

});

// Uncomment the line below to test register view
// registerView();

