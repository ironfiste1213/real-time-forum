import { handleLocation } from '../router.js';
import { clear } from './clear.js';

export function create404View(user) {
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
          let path = window.location.pathname.split('/')[0];
          if (path == '') {
            path = '/'
          }
        if (user) {
            path = "/"
        }else {
            path = "/login"
        }
          console.log("tttttttttttttttttttttttttttt",path)
                    window.location = path

        //clear(document.getElementById('not-found-view'));
        //window.history.pushState({}, "", "/");
        //handleLocation();
    });
    paragraph2.appendChild(button);
    container.appendChild(paragraph2);

    return container;
}
