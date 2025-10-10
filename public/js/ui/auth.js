/**
 * Handles the registration form submission.
 * @param {Event} e - The form submission event.
 */
export async function handleRegister(e) {
    e.preventDefault();
    console.log('Form submitted!');
    
    const registerForm = e.target;
    const formData = new FormData(registerForm);
    const userData = {
        nickname: formData.get('nickname'),
        age: parseInt(formData.get('age')),
        gender: formData.get('gender'),
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        password: formData.get('password')
    };

    console.log('Sending data:', userData);

    try {
        const response = await fetch('/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });

        const result = await response.json();
        if (response.ok) {
            alert('Registration successful!');
            registerForm.reset();
        } else {
            alert('Registration failed: ' + (result.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Registration error:', error);
        alert('Network error. Please try again.');
    }
}

/**
 * Handles the login form submission.
 * @param {Event} e - The form submission event.
 */
export async function handleLogin(e) {
    e.preventDefault();
    const loginForm = e.target;
    const formData = new FormData(loginForm);
    const loginData = Object.fromEntries(formData.entries());

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loginData)
        });
        const result = await response.json();
        alert(result.message);
        if (response.ok) loginForm.reset();
    } catch (error) {
        console.error('Login error:', error);
        alert('Network error during login. Please try again.');
    }
}