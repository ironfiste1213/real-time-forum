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
export function handlelogoutstate() {
    window.history.pushState({}, "", "/login")
    lastValidPath = "/login"
    handleLocation();
}
// 2. Core Router Logic: Handle location changes.
export async function handleLocation()  {
   const user = await checkSession();
   const path = window.location.pathname
   
   
   if (user) {
    if (path ==  "/login" || path == "/register") {
        window.history.replaceState({}, "", "/")
        lastValidPath = "/"
        
        showMainFeedView(user)
        return
    }
   }

   if (!user) {
    if (path == "/"){
        window.history.pushState({}, "", "/login")
        lastValidPath = "/login"

        showLoginForm();
        return
    }
   }
   
   const handler = routes[path]
   if (!handler) {
    show404View();
    return 
   }
   if (path == "/") {
    handler(user)
    lastValidPath = path
    return 
   }
   handler();
   lastValidPath = path

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
  


        handleLocation();
        // Chat connection will be initialized in showMainFeedView if user is logged in
        window.addEventListener("pageshow", (event) => {
            if (event.persisted) {
                handleLocation();
            }
        });
    // Handle browser back/forward button clicks.
    window.addEventListener("popstate", handleLocation);
}
