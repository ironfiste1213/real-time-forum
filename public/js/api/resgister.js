import { showNotification } from "../ui/notification.js";
import { showLoginForm } from "../ui/auth.js";

export async function handleRegister(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const userData = Object.fromEntries(formData.entries());
    userData.age = parseInt(userData.age, 10);

    try {
        const response = await fetch('/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });

        const result = await response.json();
        if (response.ok) {
            form.reset();
            showNotification('Registration successful! Please log in.', 'success');
            // Use router to navigate to login page
            window.history.pushState({}, "", "/login");
            showLoginForm();
            // Assuming showLoginForm is imported or handled elsewhere
        } else {
            // Show error notification with backend message
            showNotification(result.message || 'Registration failed. Please try again.');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showNotification('Network error. Please check your connection and try again.');
    }
}

