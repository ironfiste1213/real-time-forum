// --- Dynamic Form Creation ---
function createRegisterForm() {
    const registerDiv = document.createElement('div');
    registerDiv.id = 'register';
    registerDiv.className = 'card';

    const heading = document.createElement('h2');
    heading.textContent = 'REGISTER.';
    registerDiv.appendChild(heading);

    const form = document.createElement('form');
    form.id = 'registerForm';
    form.autocomplete = 'off';

    const fields = [
        { type: 'text', name: 'nickname', placeholder: 'Nickname' },
        { type: 'number', name: 'age', placeholder: 'Age' }
    ];

    fields.forEach(field => {
        const input = document.createElement('input');
        input.type = field.type;
        input.name = field.name;
        input.placeholder = field.placeholder;
        input.required = true;
        input.value = '';
        form.appendChild(input);
    });

    const select = document.createElement('select');
    select.name = 'gender';
    select.required = true;

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.disabled = true;
    defaultOption.selected = true;
    defaultOption.textContent = 'Select Gender';
    select.appendChild(defaultOption);

    const genderOptions = [
        { value: 'homme', text: 'Homme' },
        { value: 'femme', text: 'Femme' },
        { value: 'autre', text: 'Autre' }
    ];

    genderOptions.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option.value;
        opt.textContent = option.text;
        select.appendChild(opt);
    });

    form.appendChild(select);

    const moreFields = [
        { type: 'text', name: 'firstName', placeholder: 'First Name' },
        { type: 'text', name: 'lastName', placeholder: 'Last Name' },
        { type: 'email', name: 'email', placeholder: 'Email' },
        { type: 'password', name: 'password', placeholder: 'Password' }
    ];

    moreFields.forEach(field => {
        const input = document.createElement('input');
        input.type = field.type;
        input.name = field.name;
        input.placeholder = field.placeholder;
        input.required = true;
        input.value = '';
        if (field.name === 'email') {
            input.autocomplete = 'off';
        } else if (field.name === 'password') {
            input.autocomplete = 'new-password';
        }
        form.appendChild(input);
    });

    const button = document.createElement('button');
    button.type = 'submit';
    button.textContent = 'REGISTER';
    form.appendChild(button);

    const paragraph = document.createElement('p');
    paragraph.className = 'subtxt';
    paragraph.textContent = 'Already have an account? ';
    const link = document.createElement('a');
    link.href = '/login';
    link.id = 'logfromreg';
    link.textContent = 'Sign in';
    paragraph.appendChild(link);
    form.appendChild(paragraph);

    registerDiv.appendChild(form);
    return registerDiv;
}

export { createRegisterForm };
