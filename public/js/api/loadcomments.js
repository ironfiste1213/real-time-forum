export async function fetchComments(postId, page = 1) {
    const res = await fetch(`/api/posts/${postId}/comments?page=${page}&limit=5`);

    if (!res.ok) {
        throw new Error(`Failed to fetch comments: ${res.status}`);
    }

    return await res.json();
}
