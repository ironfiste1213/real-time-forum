export async function fetchPostDetails(postId) {
    console.log(`[api/fetchpost.js:fetchPostDetails] Fetching post with ID: ${postId}`);
    const response = await fetch(`/api/posts/${postId}/`);
    if (!response.ok) {
        throw new Error(`Failed to fetch post. Status: ${response.status}`);
    }
    return await response.json();
}
