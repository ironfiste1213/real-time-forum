import { showLoginForm, showRegisterForm} from './ui/auth.js';
import { showMainFeedView, show404View } from './ui/views.js';
import { checkSession } from './api/checksession.js';

// 1. Define Routes: Map paths to view-rendering functions.
const routes = {
    '/': showMainFeedView,
    '/login': showLoginForm,
    '/register': showRegisterForm,
};

const protectedRoutes = ['/'];
let lastValidPath = "/"
export function recoverfrom404() {
    window.history.replaceState({}, "", lastValidPath)
    handleLocation();
}
// 2. Core Router Logic: Handle location changes.
export async function handleLocation()  {
   const path = window.location.pathname
   const user = await checkSession()
   
   if (user) {
    if (path ==  "login" || path == "register") {
        window.history.replaceState({}, "", "/")
        showMainFeedView(user)
        return
    }
   }

   if (!user) {
    if (path == "/"){
        window.history.replaceState({}, "", "login")
        showLoginForm();
        return
    }
   }
   
   const handler = routes[path]
   if (!handler) {
    show404View();
    return 
   }
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

     

        handleLocation();
        // Chat connection will be initialized in showMainFeedView if user is logged in

    // Handle browser back/forward button clicks.
    window.addEventListener("popstate", handleLocation);

    console.log("[router.js:initializeRouter] Router initialized.");
}
