export async function fetchPosts() {
    const response = await fetch('/api/posts/');
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
}
