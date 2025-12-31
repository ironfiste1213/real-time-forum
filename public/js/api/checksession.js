
export async function checkSession() {
    try {
        const response = await fetch('/api/auth/status');

        if (response.ok) {
            const data = await response.json();
            if (data.isAuthenticated) {
                return data.user;
            }
        }
        // If response is not ok (e.g., 401) or not authenticated, clear user.
        return null;
    } catch (error) {
        console.error('Session check failed:', error);
        return null;
    }
}
