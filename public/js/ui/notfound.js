import { recoverfrom404 } from '../router.js';

export function create404View() {
    const container = document.createElement('div');
    container.className = 'card';

    const heading = document.createElement('h1');
    heading.textContent = '404 - Page Not Found';
    container.appendChild(heading);

    const paragraph1 = document.createElement('p');
    paragraph1.textContent = 'The page you\'re looking for doesn\'t exist.';
    container.appendChild(paragraph1);

    const paragraph2 = document.createElement('p');
    const button = document.createElement('button');
    button.textContent = 'Go back to the main page';
    button.addEventListener('click', () => {
         recoverfrom404();
    });
    paragraph2.appendChild(button);
    container.appendChild(paragraph2);

    return container;
}


