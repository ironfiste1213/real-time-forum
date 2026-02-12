import { LoginComponent } from '../components/authComponents/loginComponent.js';
import { loginHandler } from '../hanlders/authHandlers/loginLogic.js';
import { transitionTo } from '../viewState.js';
import { clearChatEventListeners } from '../hanlders/chat/chatButtonHandler.js';

/**
 * Login View
 * Renders the login form inside the main app container
 * Also cleans up chat components and listeners before rendering
 * 
 * @param {string} distination - The destination path after successful login (default: "/")
 */
export function loginView(distination = "/") {
    // Clean up any existing chat components before rendering login
    // This ensures orphaned chat buttons and panels are removed from DOM
    // and all chat-related event listeners are cleared
    clearChatEventListeners();
    
    transitionTo('loginView', () => {
        console.log('view.js: loginView() called');
        const rootContainer = document.querySelector('#app');
        console.log('view.js: Found #app element:', !!rootContainer);
        rootContainer.innerHTML = '';
        const loginComponent = LoginComponent();
        console.log('view.js: Login component created');
        rootContainer.appendChild(loginComponent);
        console.log('view.js: Login component appended');

        // Handle login form submit
        loginHandler(rootContainer, distination);
        console.log('view.js: Login handler attached');
    });
}

