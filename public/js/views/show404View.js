import { transitionTo } from '../viewState.js';


export function show404View() {
    transitionTo('show404View', () => {
        console.log('view.js: show404View() called');
        const rootContainer = document.querySelector('#app');
        if (!rootContainer) {
            console.error('view.js: #app element not found');
            return;
        }
        
        rootContainer.innerHTML = '';
        
        const errorContainer = document.createElement('div');
        errorContainer.classList.add('error-container');
        errorContainer.innerHTML = `
            <h1>404</h1>
            <p>Page not found</p>
            <a href="/">Go to Home</a>
        `;
        
        rootContainer.appendChild(errorContainer);
        console.log('view.js: 404 view rendered');
    });
}

