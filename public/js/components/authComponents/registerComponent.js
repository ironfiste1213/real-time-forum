/**
 * Register Component
 * Returns a DOM element containing a registration form
 * Uses vanilla JavaScript with document.createElement
 */

export function RegisterComponent() {
    console.log('registerComponent.js: RegisterComponent() called');
    
    // Create form element
    const form = document.createElement('form');
    form.className = 'register-form';
    form.setAttribute('data-has-listener', 'true'); // Mark as having event listener
    console.log('registerComponent.js: Form element created');

    // Create title
    const title = document.createElement('h2');
    title.className = 'register-title';
    title.textContent = 'Create Account';

    // Create nickname input group
    const nicknameGroup = document.createElement('div');
    nicknameGroup.className = 'form-group';

    const nicknameLabel = document.createElement('label');
    nicknameLabel.className = 'form-label';
    nicknameLabel.htmlFor = 'nickname';
    nicknameLabel.textContent = 'Nickname';

    const nicknameInput = document.createElement('input');
    nicknameInput.className = 'form-input';
    nicknameInput.type = 'text';
    nicknameInput.id = 'nickname';
    nicknameInput.name = 'nickname';
    nicknameInput.placeholder = 'Choose a nickname';
    nicknameInput.required = true;

    nicknameGroup.appendChild(nicknameLabel);
    nicknameGroup.appendChild(nicknameInput);

    // Create email input group
    const emailGroup = document.createElement('div');
    emailGroup.className = 'form-group';

    const emailLabel = document.createElement('label');
    emailLabel.className = 'form-label';
    emailLabel.htmlFor = 'email';
    emailLabel.textContent = 'Email';

    const emailInput = document.createElement('input');
    emailInput.className = 'form-input';
    emailInput.type = 'email';
    emailInput.id = 'email';
    emailInput.name = 'email';
    emailInput.placeholder = 'Enter your email';
    emailInput.required = true;

    emailGroup.appendChild(emailLabel);
    emailGroup.appendChild(emailInput);

    // Create age input group
    const ageGroup = document.createElement('div');
    ageGroup.className = 'form-group';

    const ageLabel = document.createElement('label');
    ageLabel.className = 'form-label';
    ageLabel.htmlFor = 'age';
    ageLabel.textContent = 'Age';

    const ageInput = document.createElement('input');
    ageInput.className = 'form-input';
    ageInput.type = 'number';
    ageInput.id = 'age';
    ageInput.name = 'age';
    ageInput.placeholder = 'Enter your age';
    ageInput.required = true;
    ageInput.min = '13';
    ageInput.max = '120';

    ageGroup.appendChild(ageLabel);
    ageGroup.appendChild(ageInput);

    // Create gender input group
    const genderGroup = document.createElement('div');
    genderGroup.className = 'form-group';

    const genderLabel = document.createElement('label');
    genderLabel.className = 'form-label';
    genderLabel.htmlFor = 'gender';
    genderLabel.textContent = 'Gender';

    const genderSelect = document.createElement('select');
    genderSelect.className = 'form-input';
    genderSelect.id = 'gender';
    genderSelect.name = 'gender';
    genderSelect.required = true;

    // Default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select gender';
    defaultOption.disabled = true;
    defaultOption.selected = true;
    genderSelect.appendChild(defaultOption);

    // Male option
    const maleOption = document.createElement('option');
    maleOption.value = 'male';
    maleOption.textContent = 'Male';
    genderSelect.appendChild(maleOption);

    // Female option
    const femaleOption = document.createElement('option');
    femaleOption.value = 'female';
    femaleOption.textContent = 'Female';
    genderSelect.appendChild(femaleOption);

    // Other option
    const otherOption = document.createElement('option');
    otherOption.value = 'other';
    otherOption.textContent = 'Other';
    genderSelect.appendChild(otherOption);

    // Prefer not to say option
    const preferNotToSayOption = document.createElement('option');
    preferNotToSayOption.value = 'not-specified';
    preferNotToSayOption.textContent = 'Prefer not to say';
    genderSelect.appendChild(preferNotToSayOption);

    genderGroup.appendChild(genderLabel);
    genderGroup.appendChild(genderSelect);

    // Create first name input group
    const firstNameGroup = document.createElement('div');
    firstNameGroup.className = 'form-group';

    const firstNameLabel = document.createElement('label');
    firstNameLabel.className = 'form-label';
    firstNameLabel.htmlFor = 'firstName';
    firstNameLabel.textContent = 'First Name';

    const firstNameInput = document.createElement('input');
    firstNameInput.className = 'form-input';
    firstNameInput.type = 'text';
    firstNameInput.id = 'firstName';
    firstNameInput.name = 'firstName';
    firstNameInput.placeholder = 'Enter your first name';
    firstNameInput.required = true;

    firstNameGroup.appendChild(firstNameLabel);
    firstNameGroup.appendChild(firstNameInput);

    // Create last name input group
    const lastNameGroup = document.createElement('div');
    lastNameGroup.className = 'form-group';

    const lastNameLabel = document.createElement('label');
    lastNameLabel.className = 'form-label';
    lastNameLabel.htmlFor = 'lastName';
    lastNameLabel.textContent = 'Last Name';

    const lastNameInput = document.createElement('input');
    lastNameInput.className = 'form-input';
    lastNameInput.type = 'text';
    lastNameInput.id = 'lastName';
    lastNameInput.name = 'lastName';
    lastNameInput.placeholder = 'Enter your last name';
    lastNameInput.required = true;

    lastNameGroup.appendChild(lastNameLabel);
    lastNameGroup.appendChild(lastNameInput);

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
    passwordInput.placeholder = 'Create a password';
    passwordInput.required = true;
    passwordInput.minLength = '8';

    passwordGroup.appendChild(passwordLabel);
    passwordGroup.appendChild(passwordInput);

    // Create submit button
    const submitButton = document.createElement('button');
    submitButton.className = 'btn btn-primary';
    submitButton.type = 'submit';
    submitButton.textContent = 'Create Account';

    // Create navigation link to login
    const navLink = document.createElement('a');
    navLink.className = 'form-nav-link';
    navLink.href = '#';
    navLink.textContent = 'Already have an account? Login';

    // Append all elements to form
    form.appendChild(title);
    form.appendChild(nicknameGroup);
    form.appendChild(emailGroup);
    form.appendChild(ageGroup);
    form.appendChild(genderGroup);
    form.appendChild(firstNameGroup);
    form.appendChild(lastNameGroup);
    form.appendChild(passwordGroup);
    form.appendChild(submitButton);
    form.appendChild(navLink);

    console.log('registerComponent.js: Register form component created successfully');
    return form;
}

