
export async function checkSession() {
    //console.log('checkSession.js: checkSession() called');
    //console.log('checkSession.js: Sending GET to /api/auth/status');
    
    try {
        const response = await fetch('/api/status', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        //console.log('checkSession.js: Response received, status:', response.status);

        const data = await response.json();
        //console.log('checkSession.js: JSON parsed, isAuthenticated:', response.ok);

        if (response.ok) {
            // Session is valid and user is authenticated
            //console.log('checkSession.js: Session valid, user:', data.user);
            return data.user 
            
        }

    } catch (error) {
        //console.log(error)
       return null;
    }
}

