/**
 * Login Component
 * Returns a DOM element containing a login form
 * Uses vanilla JavaScript with document.createElement
 */

export function LoginComponent() {
    console.log('loginComponent.js: LoginComponent() called');
    
    // Create form element
    const form = document.createElement('form');
    form.className = 'login-form';
    form.setAttribute('data-has-listener', 'true'); // Mark as having event listener
    console.log('loginComponent.js: Form element created');

    // Create title
    const title = document.createElement('h2');
    title.className = 'login-title';
    title.textContent = 'Login';

    // Create identifier input group
    const identifierGroup = document.createElement('div');
    identifierGroup.className = 'form-group';

    const identifierLabel = document.createElement('label');
    identifierLabel.className = 'form-label';
    identifierLabel.htmlFor = 'identifier';
    identifierLabel.textContent = 'Nickname or Email';

    const identifierInput = document.createElement('input');
    identifierInput.className = 'form-input';
    identifierInput.type = 'text';
    identifierInput.id = 'identifier';
    identifierInput.name = 'identifier';
    identifierInput.placeholder = 'Enter your nickname or email';
    identifierInput.required = true;

    identifierGroup.appendChild(identifierLabel);
    identifierGroup.appendChild(identifierInput);

    // Create password input group
    const passwordGroup = document.createElement('div');
    passwordGroup.className = 'form-group';

    const passwordLabel = document.createElement('label');
    passwordLabel.className = 'form-label';
    passwordLabel.htmlFor = 'password';
    passwordLabel.textContent = 'Password';

    const passwordInput = document.createElement('input');
    passwordInput.className = 'form-input';
    passwordInput.type = 'password';
    passwordInput.id = 'password';
    passwordInput.name = 'password';
    passwordInput.placeholder = 'Enter your password';
    passwordInput.required = true;

    passwordGroup.appendChild(passwordLabel);
    passwordGroup.appendChild(passwordInput);

    // Create submit button
    const submitButton = document.createElement('button');
    submitButton.className = 'btn btn-primary';
    submitButton.type = 'submit';
    submitButton.textContent = 'Login';

    // Create navigation link to register
    const navLink = document.createElement('a');
    navLink.className = 'form-nav-link';
    navLink.href = '#';
    navLink.textContent = "Don't have an account? Register";

    // Append all elements to form
    form.appendChild(title);
    form.appendChild(identifierGroup);
    form.appendChild(passwordGroup);
    form.appendChild(submitButton);
    form.appendChild(navLink);

    console.log('loginComponent.js: Login form component created successfully');
    return form;
}

