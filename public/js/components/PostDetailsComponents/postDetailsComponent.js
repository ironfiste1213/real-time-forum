import { formatDate } from '../../tools/time/formatdate.js';

/**
 * Creates the comment input section with textarea and submit button
 * Inlined directly in PostDetailsComponent
 * @param {number} postId - The ID of the post being commented on
 * @returns {Object} Object containing all created elements
 */
function createCommentInput(postId) {
    // Input section container
    const inputSection = document.createElement('div');
    inputSection.classList.add('comment-input-section');

    // Label for textarea
    const inputLabel = document.createElement('label');
    inputLabel.setAttribute('for', 'comment-input-' + postId);
    inputLabel.textContent = 'Add a comment:';
    inputSection.appendChild(inputLabel);

    // Textarea for comment input
    const commentTextarea = document.createElement('textarea');
    commentTextarea.id = 'comment-input-' + postId;
    commentTextarea.classList.add('comment-textarea');
    commentTextarea.placeholder = 'Write your comment here...';
    commentTextarea.rows = 3;
    inputSection.appendChild(commentTextarea);

    // Submit button
    const submitBtn = document.createElement('button');
    submitBtn.type = 'button';
    submitBtn.classList.add('submit-comment-btn');
    submitBtn.textContent = 'Post Comment';
    inputSection.appendChild(submitBtn);

    // Return object with all elements for handler attachment
    return {
        container: inputSection,
        textarea: commentTextarea,
        button: submitBtn,
        label: inputLabel
    };
}

export function PostDetailsComponent(data, onNewComment = null) {
    console.log('postDetailsComponent.js: PostDetailsComponent() called with post ID:', data.id);
    
    // Validate input
    if (!data || typeof data !== 'object') {
        console.error('postDetailsComponent.js: Invalid data provided');
        const errorContainer = document.createElement('div');
        errorContainer.classList.add('post-details-error');
        errorContainer.textContent = 'Error: Invalid post data';
        return errorContainer;
    }
    
    // Create main container - matches .post class structure
    const container = document.createElement('div');
    container.classList.add('post-details');
    container.dataset.postId = data.id;
    
    // Post header with author info - matches main feed .post-header
    const postHeader = document.createElement('div');
    postHeader.classList.add('post-header');
    
    // Avatar
    const avatar = document.createElement('div');
    avatar.classList.add('user-avatar');
    avatar.textContent = '🗣';
    postHeader.appendChild(avatar);
    
    // Username container
    const userInfo = document.createElement('div');
    
    const username = document.createElement('span');
    username.classList.add('username');
    username.textContent = data.author && data.author.nickname ? data.author.nickname : 'Unknown';
    console.log('postDetailsComponent.js: Author:', data.author ? data.author.nickname : 'Unknown');
    userInfo.appendChild(username);
    
    // Date
    const postDate = formatDate(data.createdAt);
    const dateSpan = document.createElement('span');
    dateSpan.classList.add('post-date');
    dateSpan.textContent = "          📅  " + postDate + " 🕒 ";
    userInfo.appendChild(dateSpan);
    
    postHeader.appendChild(userInfo);
    container.appendChild(postHeader);
    
    // Post title - matches main feed h3 styling
    const title = document.createElement('h3');
    title.textContent = data.title || 'Untitled';
    container.appendChild(title);
    
    // Categories - matches main feed .categories
    const categories = document.createElement('div');
    categories.classList.add('categories');
    console.log('postDetailsComponent.js: Categories found:', data.categories ? data.categories.length : 0);
    if (data.categories && data.categories.length > 0) {
        data.categories.forEach(cat => {
            const categorySpan = document.createElement('span');
            categorySpan.classList.add('category');
            categorySpan.textContent = cat;
            categories.appendChild(categorySpan);
        });
    } else {
        const noCategorySpan = document.createElement('span');
        noCategorySpan.classList.add('category', 'no-category');
        noCategorySpan.textContent = 'no category';
        categories.appendChild(noCategorySpan);
    }
    container.appendChild(categories);
    
    // Post content full - styled like main feed content-snippet but larger
    const content = document.createElement('div');
    content.classList.add('post-content');
    content.textContent = data.content || '';
    container.appendChild(content);
    
    // Comment input section - inlined directly in PostDetailsComponent
    const commentInput = createCommentInput(data.id);
    container.appendChild(commentInput.container);
    
    // Comments placeholder - empty container for comments list
    const commentsSection = document.createElement('div');
    commentsSection.classList.add('post-details-comments-section');
    commentsSection.id = 'comments-placeholder';
    
    // Placeholder message (optional - can be removed or styled differently)
    // Note: Using existing .no-comments class for styling, or can be removed entirely
    const placeholderMessage = document.createElement('div');
    placeholderMessage.classList.add('no-comments');
    placeholderMessage.textContent = 'Comments section - ready for integration';
    commentsSection.appendChild(placeholderMessage);
    
    container.appendChild(commentsSection);
    
    console.log('postDetailsComponent.js: Post details component created successfully');
    return container;
}

