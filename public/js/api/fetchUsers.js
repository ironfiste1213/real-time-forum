
export async function fetchUsers() {
    console.log('fetchUsers.js: fetchUsers() called');
    console.log('fetchUsers.js: Sending GET to /api/users');
    
    try {
        const response = await fetch('/api/users', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        console.log('fetchUsers.js: Response received, status:', response.status);

        if (response.ok) {
            // Parse and return the users data
            const users = await response.json();
            console.log('fetchUsers.js: Users fetched successfully, count:', users.length);
            
            // Filter to ensure valid user objects
            const validUsers = users.filter(user => user && typeof user.id === 'number' && typeof user.nickname === 'string');
            console.log('fetchUsers.js: Valid users after filtering:', validUsers.length);
            return validUsers;
        }

        // Response was not OK, return empty array
        console.log('fetchUsers.js: Failed to fetch users, returning empty array');
        return [];
    } catch (error) {
        console.error('fetchUsers.js: Network error:', error.message);
        // Network error or other fetch failures, return empty array
        return [];
    }
}

