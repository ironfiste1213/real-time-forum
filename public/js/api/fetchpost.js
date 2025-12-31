export async function fetchPostDetails(postId) {
    const response = await fetch(`/api/posts/${postId}/`);
    if (!response.ok) {
        throw new Error(`Failed to fetch post. Status: ${response.status}`);
    }
    return await response.json();
}
