import { showLoginForm, showRegisterForm} from './ui/auth.js';
import { showMainFeedView } from './ui/views.js';
import { checkSession, getCurrentUser } from './session.js';

// 1. Define Routes: Map paths to view-rendering functions.
const routes = {
    '/': showMainFeedView,
    '/login': showLoginForm,
    '/register': showRegisterForm,
};

const protectedRoutes = ['/'];

// 2. Core Router Logic: Handle location changes.
export function handleLocation()  {
    const path = window.location.pathname;
    console.log(`[router.js:handleLocation] Router: Handling path ${path}`);

    // Check if user is authenticated before routing
    const user = getCurrentUser();
console.log("[router.js:handleLocation] ------------------CHECK CURENT USER", user);

    // --- Route Guarding Logic ---
    // If trying to access a protected route without being logged in
    if (protectedRoutes.includes(path) && !user) {
        console.log("[router.js:handleLocation] Router: Access to protected route denied. Redirecting to /login.", user);
        // Manually navigate to the login page
        window.history.pushState({}, "", "/login");
        showLoginForm();
        return; // Stop further execution
    }

    // If trying to access login/register while already logged in
    if ((path === '/login' || path === '/register') && user) {
        console.log("[router.js:handleLocation] Router: Already logged in. Redirecting to /.");
        window.history.pushState({}, "", "/");
        showMainFeedView(user);
        return; // Stop further execution
    }

    // Find the handler for the current path.
    const handler = routes[path] || show404View(user); // Default to 404 view if route not found
// calls the function retrieved from the routes object 
    handler();
};

// 3. Handle Navigation: Intercept link clicks.
export function navigate(e) {
    // Check if the click was on an anchor tag.
    const link = e.target.closest('a');
    if (!link) {
        return;
    }

    // Get the destination path from the link's href.
    const href = link.getAttribute('href');

    // Only handle internal links (starting with '/').
    if (href && href.startsWith('/')) {
        e.preventDefault(); // Prevent full page reload.
        // Update the URL without reloading the page.
        window.history.pushState({}, "", href);
        // Handle the new location to render the correct view.
        handleLocation();
    }
};

// 4. Listen for Browser Events.
export async function initializeRouter() {
    // Listen for clicks on the whole document to handle navigation.
    document.addEventListener("click", navigate);

    // On initial load, check the session first, then handle the location.
  
        console.log('[router.js:initializeRouter] DOMContentLoaded and we will check for session ');

      const user = await checkSession(); // Check if user is already logged in
      console.log('[router.js:initializeRouter] Router: Session check result:', user);

        handleLocation();
        // Chat connection will be initialized in showMainFeedView if user is logged in

    // Handle browser back/forward button clicks.
    window.addEventListener("popstate",() => {handleLocation;
        console.log("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$", window.path)}
        
    );

    console.log("[router.js:initializeRouter] Router initialized.");
}

window.onpopstate = handleLocation