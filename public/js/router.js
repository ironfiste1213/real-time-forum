import { checkSession } from './api/auth/checkSession.js';
import { loginView, mainview, registerView, singlePostView, show404View } from './view.js';
import { parsePostIdFromPath } from './tools/path/postId.js';
import { pathState} from './viewState.js';
console.log("router.js loaded");

const routes = {

    '/': mainview,
    '/login': loginView,
    '/register': registerView,

};

console.log("routes defined:", routes);
  


export function router({ ispush = false, path = "/", user = null, distination = null }) {
    const handler = routes[path];

    if (!handler) { 
        show404View();
        return;
    }

    if (ispush) window.history.pushState({}, "", path);
    else window.history.replaceState({}, "", path);

    // Pass user if exists, otherwise pass distination
    handler(user ?? distination);
    pathState.lastvalidpath = path
}

export async function openPost(postId) {
    const path = `/post/${postId}`;
    history.pushState({}, '', path); // update URL
    
    // Fetch user session to pass to singlePostView
    const user = await checkSession();
    singlePostView(postId, user);    // render post details with user
}


export async function handleLocation() {
    console.log("handleLocation called");
    const user = await checkSession();
    console.log("checkSession result:", user);
    const path = window.location.pathname;
    console.log("current path:", path);

    console.log("__________________for user:", user, "for path", path);

    // Check if it's a post details route
    const postId = parsePostIdFromPath(path);
   console.log(postId, user);
   if (postId && user) console.log("fffffffffff");
   
    switch (true) {
        
        case !!postId && !!user: 
             console.log("eeeee");
             pathState.lastvalidpath = path
            singlePostView(postId, user)
            return;

        case postId && !user:
            router({ispush:false, path:"/login", distination:`/post/${postId}`})
            return;

        //  Logged user trying to access auth pages
        case !!user && (path === "/login" || path === "/register"):
            console.log("case: logged user on auth page, redirecting to /");
            router({ispush:false, path:"/", user:user});
            console.log("router called for redirect");
            return;

        //  Not logged user trying to access home
        case !user && path === "/":
            console.log("case: not logged user on home, redirecting to /login");
            router({ispush:false, path:"/login", distination:"/"})
            console.log("router called for login redirect");
            return;

        //  Route not found
        case !routes[path]:
            console.log("case: route not found for path:", path);
            show404View();
            console.log("show404View called");
            return;

        //  Home page
        case path === "/":
            console.log("case: home page, calling routes[path] with user", user);
            routes[path](user);
            console.log("routes[path] executed for home");
            return;

        //  Normal routing
        default:
            console.log("case: normal routing for path:", path);
            routes[path]();
            console.log("routes[path] executed for normal");
            console.log("________________he goes normal to:", path);
    }
}

