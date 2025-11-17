// Create post section component
export function createCreatePostComponent() {
    // Create post section (initially hidden)
    const createPostSection = document.createElement('section');
    createPostSection.id = 'create-post-section';
    createPostSection.className = 'card';

    const createPostHeading = document.createElement('h3');
    createPostHeading.textContent = 'Create a New Post';
    createPostSection.appendChild(createPostHeading);

    const createPostForm = document.createElement('form');
    createPostForm.id = 'create-post-form';

    // Title input
    const titleGroup = document.createElement('div');
    titleGroup.className = 'form-group';
    const titleLabel = document.createElement('label');
    titleLabel.setAttribute('for', 'post-title');
    titleLabel.textContent = 'Title';
    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.id = 'post-title';
    titleInput.name = 'title';
    titleInput.placeholder = 'Post Title';
    titleInput.required = true;
    titleGroup.appendChild(titleLabel);
    titleGroup.appendChild(titleInput);
    createPostForm.appendChild(titleGroup);

    // Content textarea
    const contentGroup = document.createElement('div');
    contentGroup.className = 'form-group';
    const contentLabel = document.createElement('label');
    contentLabel.setAttribute('for', 'post-content');
    contentLabel.textContent = 'Content';
    const contentTextarea = document.createElement('textarea');
    contentTextarea.id = 'post-content';
    contentTextarea.name = 'content';
    contentTextarea.placeholder = 'What\'s on your mind?';
    contentTextarea.rows = 4;
    contentTextarea.required = true;
    contentGroup.appendChild(contentLabel);
    contentGroup.appendChild(contentTextarea);
    createPostForm.appendChild(contentGroup);
                                                                                  123
                                                                                  132
                                                                                  213
                                                                                  231
                                                                                  312
                                                                                  321

    // Categories
    const categoriesGroup = document.createElement('div');
    categoriesGroup.className = 'form-group';
    const categoriesLabel = document.createElement('label');
    categoriesLabel.textContent = 'Categories:';
    categoriesGroup.appendChild(categoriesLabel);

    const categoriesContainer = document.createElement('div');
    categoriesContainer.id = 'categories-container';
    categoriesContainer.className = 'categories-checkboxes';
    categoriesGroup.appendChild(categoriesContainer);
    createPostForm.appendChild(categoriesGroup);

    // Submit button
    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.textContent = 'Create Post';
    submitButton.id = 'create-post-submit-btn';
    createPostForm.appendChild(submitButton);

    createPostSection.appendChild(createPostForm);

    return createPostSection;
}
