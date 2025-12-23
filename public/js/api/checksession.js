
export async function checkSession() {
    try {
        const response = await fetch('/api/auth/status');

        if (response.ok) {
            const data = await response.json();
            if (data.isAuthenticated) {
               console.log('[api/checksession.js:checkSession] DEBUG: Session check successful, currentUser set:', data.user);
                return data.user;
            }
        }
        // If response is not ok (e.g., 401) or not authenticated, clear user.
        console.log('[api/checksession.js:checkSession] DEBUG: Session check failed or not authenticated');
        return null;
    } catch (error) {
        console.error('Session check failed:', error);
        return null;
    }
}
