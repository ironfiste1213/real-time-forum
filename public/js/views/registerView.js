import { RegisterComponent } from '../components/authComponents/registerComponent.js';
import { registerHandler } from '../hanlders/authHandlers/registerLogic.js';
import { transitionTo } from '../viewState.js';

/**
 * Register View
 * Renders the register form inside the main app container
 * Includes form submit handling and navigation to login
 */
export function registerView() {
    transitionTo('registerView', () => {
        console.log('view.js: registerView() called');
        const rootContainer = document.querySelector('#app');
        console.log('view.js: Found #app element:', !!rootContainer);
        rootContainer.innerHTML = '';
        const registerComponent = RegisterComponent();
        console.log('view.js: Register component created');
        rootContainer.appendChild(registerComponent);
        console.log('view.js: Register component appended');

        // Handle register form submit
        registerHandler(rootContainer);
        console.log('view.js: Register handler attached');
    });
}

