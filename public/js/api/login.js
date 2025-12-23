import { showNotification } from "../ui/notification.js";
import { initializeChatConnection } from "../ui/chat.js";
import { showMainFeedView } from "../ui/views.js";

// Handle login form submission
export async function handleLogin(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    // Convert form data keys to lowercase to match backend struct tags
    const loginData = {};
    for (const [key, value] of formData.entries()) {
        loginData[key.toLowerCase()] = value;
    }

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loginData)
        });

        const result = await response.json();
        if (response.ok) {
           const user = result.user
            form.reset();
            showNotification('Login successful! Welcome back.', 'success');
            // Initialize chat connection after successful login
            initializeChatConnection(user);
            // Use router to navigate to the main feed
            window.history.pushState({}, "", "/");
            showMainFeedView(user);
        } else {
            // Show error notification with backend message
            showNotification(result.message || 'Login failed. Please check your credentials.');
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Network error. Please check your connection and try again.');
    }
}
