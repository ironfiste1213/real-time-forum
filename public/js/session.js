let currentUser = null;

/**
 * Checks the user's session status with the backend.
 * @returns {Promise<object|null>} The user object if authenticated, otherwise null.
 */
export async function checkSession() {
    try {
        const response = await fetch('/api/auth/status');

        if (response.ok) {
            const data = await response.json();
            if (data.isAuthenticated) {
                currentUser = data.user;
                return currentUser;
            }
        }
        // If response is not ok (e.g., 401) or not authenticated, clear user.
        currentUser = null;
        return null;
    } catch (error) {
        console.error('Session check failed:', error);
        currentUser = null;
        return null;
    }
}

export const getCurrentUser = () => currentUser;