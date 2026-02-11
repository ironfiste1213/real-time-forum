/**
 * Comment Item Component
 * Single responsibility: render one comment element
 */

import { formatDate } from '../../../tools/time/formatdate.js';


export function createCommentElement(comment) {
    const commentEl = document.createElement('div');
    commentEl.classList.add('comment');

    const commentHeader = document.createElement('div');
    commentHeader.classList.add('comment-header');

    // Author/username
    const author = document.createElement('span');
    author.classList.add('comment-author');
    author.textContent = comment.author && comment.author.nickname ? comment.author.nickname : 'Anonymous';
    commentHeader.appendChild(author);

    // Creation time
    const timestamp = document.createElement('span');
    timestamp.classList.add('comment-timestamp');
    timestamp.textContent = ' • ' + formatDate(comment.createdAt);
    commentHeader.appendChild(timestamp);

    commentEl.appendChild(commentHeader);

    // Comment content
    const content = document.createElement('div');
    content.classList.add('comment-content');
    content.textContent = comment.content || '';
    commentEl.appendChild(content);

    return commentEl;
}


