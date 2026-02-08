
export async function fetchPosts() {
    console.log('fetchposts.js: fetchPosts() called');
    console.log('fetchposts.js: Sending GET to /api/posts');
    
    const response = await fetch('/api/posts', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });
    console.log('fetchposts.js: Response received, status:', response.status);

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
}

