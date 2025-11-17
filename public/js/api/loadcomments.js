export async function fetchComments(postId) {
    const res = await fetch(`/api/posts/${postId}/comments`);

    if (!res.ok) {
        throw new Error(`Failed to fetch comments: ${res.status}`);
    }

    return await res.json();
}
