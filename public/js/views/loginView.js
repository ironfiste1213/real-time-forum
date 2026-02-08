import { LoginComponent } from '../components/authComponents/loginComponent.js';
import { loginHandler } from '../hanlders/authHandlers/loginLogic.js';
import { transitionTo } from '../viewState.js';

/**
 * Login View
 * Renders the login form inside the main app container
 * 
 * @param {string} distination - The destination path after successful login (default: "/")
 */
export function loginView(distination = "/") {
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

