// Get the registration form
const registerForm = document.getElementById('registerForm');

// Handle registration form submission
registerForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    console.log('Form submitted!');
    
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
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        });

        console.log('Response status:', response.status);
        const result = await response.json();
        console.log('Response data:', result);

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
});