
export async function loginApi({ identifier, password }) {
    console.log('loginRequest.js: loginApi() called');
    console.log('loginRequest.js: Sending POST to /login with identifier:', identifier);
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ identifier, password }),
        });
        console.log('loginRequest.js: Response received, status:', response.status);

        const data = await response.json();
        console.log('loginRequest.js: JSON parsed, success:', data.success || !response.ok);

        if (!response.ok) {
            console.log('loginRequest.js: Login failed, error:', data.message);
            return {
                success: false,
                error: data.message || 'Login failed',
                status: response.status,
            };
        }

        console.log('loginRequest.js: Login successful, message:', data.message);
        return {
            success: true,
            user: data.user,
            message: data.message,
        };
    } catch (error) {
        console.error('loginRequest.js: Network error:', error.message);
        return {
            success: false,
            error: error.message || 'Network error occurred',
            status: null,
        };
    }
}

