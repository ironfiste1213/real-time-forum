import { createCommentElement } from "./commentItemComponent.js";

export function CommentComponent(comments = []) {
    console.log('commentComponent.js: CommentComponent() called with', comments.length, 'comments');
    
    // Create main container
    const container = document.createElement('div');
    container.classList.add('post-details-comments-section');
    
    // Create comments section header
    const header = document.createElement('h4');
    header.classList.add('comments-header');
    header.textContent = `Comments (${comments.length})`;
    container.appendChild(header);
    
    // Create scrollable comments container
    const commentsList = document.createElement('div');
    commentsList.classList.add('comments-list');
    commentsList.setAttribute('tabindex', '0');
    container.appendChild(commentsList);
    
    // Render comments (parent passes max 5 comments)
    if (comments.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.classList.add('no-comments');
        emptyMessage.textContent = 'No comments yet. Be the first to comment!';
        commentsList.appendChild(emptyMessage);
    } else {
        comments.forEach(comment => {
            const commentEl = createCommentElement(comment);
            commentsList.appendChild(commentEl);
        });
    }
    
    console.log('commentComponent.js: Comment component created successfully');
    
    return container;
}

