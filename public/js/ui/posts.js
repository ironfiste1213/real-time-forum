 const postFeed = document.getElementById('post-feed');


 export async function loadPosts() { 
    try {
    const response = await fetch('/api/posts', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const posts = await response.json();
    console.log(posts);
    postFeed.innerHTML = 'work!';

    } catch (error) {
        console.error('Error loading posts:', error);
        postFeed.innerHTML = '<p>Error loading posts. Please try again later.</p>';
    }
 }
  