import { formatDate } from '../../tools/time/formatdate.js';

export function PostComponent(post) {
    //console.log('postComponent.js: PostComponent() called with post ID:', post.id);
    
    const postElement = document.createElement('div');
    postElement.classList.add('post');
    postElement.dataset.postId = post.id;
    //console.log('postComponent.js: Post element created with ID:', post.id);

    // Post Header - Avatar, Username, Date
    const postHeader = document.createElement('div');
    postHeader.classList.add('post-header');

    // Avatar/Icon
    const avatar = document.createElement('div');
    avatar.classList.add('user-avatar');
    avatar.textContent = '🗣';
    postHeader.appendChild(avatar);

    // Username container
    const userInfo = document.createElement('div');
    
    const username = document.createElement('span');
    username.classList.add('username');
    username.textContent = post.author ? post.author.nickname : 'Unknown';
    //console.log('postComponent.js: Author:', post.author ? post.author.nickname : 'Unknown');
    userInfo.appendChild(username);

    // Date
    const postDate = formatDate(post.createdAt);
    const dateSpan = document.createElement('span');
    dateSpan.classList.add('post-date');
    dateSpan.textContent = "          📅  " +postDate + " 🕒 " ;
    userInfo.appendChild(dateSpan);

    postHeader.appendChild(userInfo);
    postElement.appendChild(postHeader);

    // Post Title
    const title = document.createElement('h3');
    title.textContent = post.title;
    postElement.appendChild(title);

    // Post Content Snippet
    const contentSnippet = document.createElement('p');
    contentSnippet.classList.add('post-content-snippet');
    const snippet = post.content.substring(0, 100);
    contentSnippet.textContent = snippet + (post.content.length > 100 ? '...' : '');
    //console.log('postComponent.js: Content snippet created, length:', snippet.length);
    postElement.appendChild(contentSnippet);

    // Categories
    const categories = document.createElement('div');
    categories.classList.add('categories');
    //console.log('postComponent.js: Categories found:', post.categories ? post.categories.length : 0);
    if (post.categories && post.categories.length > 0) {
        post.categories.forEach(cat => {
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
    postElement.appendChild(categories);

    // Post Actions - Comment only
    const actions = document.createElement('div');
    actions.classList.add('post-actions');

    // Comment button
    const commentBtn = document.createElement('button');
    commentBtn.classList.add('post-action-btn', 'comment-btn');
    commentBtn.innerHTML = '💬 Comment';
    actions.appendChild(commentBtn);

    postElement.appendChild(actions);

    //console.log('postComponent.js: Post component created successfully');
    return postElement;
}

