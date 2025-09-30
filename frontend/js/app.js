// Get DOM elements
const authContainer = document.getElementById('auth-container');
const mainContainer = document.getElementById('main-container');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const logoutButton = document.getElementById('logout-button');
const welcomeMessage = document.getElementById('welcome-message');
const register = document.getElementById("register")
const login = document.getElementById("login")
const logfromreg = document.getElementById("logfromreg")
const regfromlog = document.getElementById("regfromlog")

login.style.display = "none"
logfromreg.onclick = showlog
regfromlog.onclick = showreg


function showlog(){
    register.style.display = "none"
    login.style.display = "flex"
}

function showreg(){
    register.style.display = "flex"
    login.style.display = "none"
}

// --- View Management ---

function showMainView(user) {
    // In a real app, you'd get the user's name from the login response
    welcomeMessage.textContent = `Welcome, ${user.nickname || 'User'}!`;
    authContainer.classList.add('hidden');
    mainContainer.classList.remove('hidden');
}

function showAuthView() {
    authContainer.classList.remove('hidden');
    mainContainer.classList.add('hidden');
    // TODO: Clear session/cookie on logout
}

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
            // For now, we'll just switch to the login form. A better UX would be to auto-login.
            // Or, we can directly show the main view if the backend returns a session.
        } else {
            alert('Registration failed: ' + (result.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Registration error:', error);
        alert('Network error. Please try again.');
    }
});

// Handle login form submission
loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    console.log('Login form submitted!');
    
    const formData = new FormData(loginForm);
    const loginData = {
        identifier: formData.get('identifier'), // can be nickname or email
        password: formData.get('password')
    };

    console.log('Sending login data:', loginData);

    try {
        // The /login endpoint doesn't exist yet, but we're preparing the frontend for it.
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(loginData)
        });

        console.log('Login response status:', response.status);
        const result = await response.json();
        console.log('Login response data:', result);

        if (response.ok) {
            alert('Login successful!');
            loginForm.reset();
            // On successful login, hide auth forms and show the main app
            // The 'result' object should contain user info from the backend
            showMainView(result.user || {});
        } else {
            alert('Login failed: ' + (result.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Network error during login. Please try again.');
    }
});

// Handle logout
logoutButton.addEventListener('click', () => {
    // TODO: Send a request to the /logout endpoint on the backend
    showAuthView();
});