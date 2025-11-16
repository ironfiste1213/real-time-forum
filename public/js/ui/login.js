// --- Dynamic Form Creation ---
function createLoginForm() {
    const loginDiv = document.createElement('div');
    loginDiv.id = 'login';
    loginDiv.className = 'card';

    const heading = document.createElement('h2');
    heading.textContent = 'LOGIN.';
    loginDiv.appendChild(heading);

    const form = document.createElement('form');
    form.id = 'loginForm';

    const fields = [
        { type: 'text', name: 'identifier', placeholder: 'Nickname or Email' },
        { type: 'password', name: 'password', placeholder: 'Password' }
    ];

    fields.forEach(field => {
        const input = document.createElement('input');
        input.type = field.type;
        input.name = field.name;
        input.placeholder = field.placeholder;
        input.required = true;
        form.appendChild(input);
    });

    const button = document.createElement('button');
    button.type = 'submit';
    button.textContent = 'LOGIN';
    form.appendChild(button);

    const paragraph = document.createElement('p');
    paragraph.className = 'subtxt';
    paragraph.textContent = 'Don\'t have an account? ';
    const link = document.createElement('a');
    link.href = '/register';
    link.id = 'regfromlog';
    link.textContent = 'Sign up';
    paragraph.appendChild(link);
    form.appendChild(paragraph);

    loginDiv.appendChild(form);
    return loginDiv;
}

export { createLoginForm };
