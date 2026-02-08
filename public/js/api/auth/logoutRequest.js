
export async function logoutApi() {
    console.log('logoutRequest.js: logoutApi() called');
    console.log('logoutRequest.js: Sending POST to /logout');
    
    try {
        const response = await fetch('/api/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        console.log('logoutRequest.js: Response received, status:', response.status);

        if (response.ok) {
            // Logout successful
            console.log('logoutRequest.js: Logout successful');
            return {
                success: true,
            };
        }

        // Logout failed
        const data = await response.json();
        console.log('logoutRequest.js: Logout failed, error:', data.message);
        return {
            success: false,
            error: data.message || 'Logout failed',
            status: response.status,
        };
    } catch (error) {
        console.error('logoutRequest.js: Network error:', error.message);
        // Network error or other fetch failures
        return {
            success: false,
            error: error.message || 'Network error occurred',
            status: null,
        };
    }
}

