export async function registerApi(userData) {
    console.log('registerRequest.js: registerApi() called');
    console.log('registerRequest.js: Sending POST to /register with nickname:', userData.nickname, 'email:', userData.email);
    
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });
        console.log('registerRequest.js: Response received, status:', response.status);

        const data = await response.json();
        console.log('registerRequest.js: JSON parsed, success:', data.success || !response.ok);

        if (!response.ok) {
            console.log('registerRequest.js: Registration failed, error:', data.message);
            return {
                success: false,
                error: data.message || 'Registration failed',
                status: response.status,
            };
        }

        console.log('registerRequest.js: Registration successful, message:', data.message);
        return {
            success: true,
            message: data.message,
        };
    } catch (error) {
        console.error('registerRequest.js: Network error:', error.message);
        return {
            success: false,
            error: error.message || 'Network error occurred',
            status: null,
        };
    }
}

