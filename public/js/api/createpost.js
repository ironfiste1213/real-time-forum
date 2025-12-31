export async function handleCreatePost(e) {
    e.preventDefault();
    const createPostForm = document.getElementById('create-post-form');
    if (!createPostForm) return;

    const formData = new FormData(createPostForm);
    const title = formData.get('title');
    const content = formData.get('content');
    const selectedCategories = Array.from(formData.getAll('categories')).map(id => parseInt(id, 10));

    // Client-side validation
    const validationResult = validatePostInput(title, content);
    if (!validationResult.valid) {
        console.error('Validation failed:', validationResult.errors);
        displayFormErrors(createPostForm, validationResult.errors);
        return;
    }

    const postData = {
        title: sanitizeHTML(title),
        content: sanitizeHTML(content),
        category_ids: selectedCategories,
    };

    try {
        const response = await fetch('/api/posts/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(postData),
        });

        const result = await response.json();

        if (response.ok) {
            createPostForm.reset();
            // Import loadPosts dynamically or assume it's available
            import('../ui/posts.js').then(module => module.loadPosts());
        } else {
            console.error('Server returned an error:', result.message);
            console.error('Failed to create post: ' + (result.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('A network or parsing error occurred during post creation:', error);
        console.error('An error occurred. Please check the console for details.');
    }
}

// Configuration constants matching backend
const MAX_TITLE_LENGTH = 200;
const MAX_CONTENT_LENGTH = 5000;

// Spam patterns to detect on client side
const spamPatterns = [
    /buy now/i,
    /click here/i,
    /free money/i,
    /make money fast/i,
    /work from home/i,
    /limited time offer/i,
    /act now/i,
    /https?:\/\//i,
    /www\./i,
    /\$\d+/i,
    /winner/i,
    /you have won/i
];

// Validate post input on client side
export function validatePostInput(title, content) {
    const errors = [];
    
    // Check title
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
        errors.push('Title cannot be empty');
    } else if (trimmedTitle.length > MAX_TITLE_LENGTH) {
        errors.push(`Title exceeds maximum length of ${MAX_TITLE_LENGTH} characters`);
    }
    
    // Check content
    const trimmedContent = content.trim();
    if (!trimmedContent) {
        errors.push('Content cannot be empty');
    } else if (trimmedContent.length > MAX_CONTENT_LENGTH) {
        errors.push(`Content exceeds maximum length of ${MAX_CONTENT_LENGTH} characters`);
    }
    
    // Check for control characters
    if (/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(title) || 
        /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(content)) {
        errors.push('Content contains invalid characters');
    }
    
    // Check for spam
    if (isSpam(trimmedTitle) || isSpam(trimmedContent)) {
        errors.push('Content appears to be spam');
    }
    
    return {
        valid: errors.length === 0,
        errors: errors
    };
}

// Check if text appears to be spam
function isSpam(text) {
    if (text.length < 10) return false;
    
    // Check spam patterns
    for (const pattern of spamPatterns) {
        if (pattern.test(text)) {
            return true;
        }
    }
    
    // Check for excessive caps (more than 70% caps)
    const letters = text.replace(/[^a-zA-Z]/g, '');
    if (letters.length > 0) {
        const capsCount = (text.match(/[A-Z]/g) || []).length;
        const capsPercentage = capsCount / letters.length;
        if (capsPercentage > 0.7) {
            return true;
        }
    }
    
    return false;
}

// Sanitize HTML to prevent XSS
export function sanitizeHTML(text) {
    if (!text) return '';
    
    // Escape HTML special characters
    let sanitized = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .replace(/"/g, '"')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    
    // Remove potential JavaScript event handlers
    sanitized = sanitized.replace(/on\w+\s*=/gi, '');
    
    // Remove javascript: URLs
    sanitized = sanitized.replace(/javascript:/gi, '');
    
    return sanitized;
}

// Display validation errors in the form
function displayFormErrors(form, errors) {
    // Remove existing error messages
    const existingErrors = form.querySelectorAll('.validation-error');
    existingErrors.forEach(el => el.remove());
    
    // Remove error styling from fields
    const titleInput = form.querySelector('[name="title"]');
    const contentInput = form.querySelector('[name="content"]');
    if (titleInput) titleInput.classList.remove('error-field');
    if (contentInput) contentInput.classList.remove('error-field');
    
    // Create error container
    const errorContainer = document.createElement('div');
    errorContainer.className = 'validation-error validation-errors';
    errorContainer.style.cssText = 'background-color: #ffebee; border: 1px solid #f44336; color: #c62828; padding: 10px; margin-bottom: 15px; border-radius: 4px;';
    
    // Add error messages
    const errorList = document.createElement('ul');
    errorList.style.cssText = 'margin: 5px 0 0 0; padding-left: 20px;';
    errors.forEach(error => {
        const li = document.createElement('li');
        li.textContent = error;
        errorList.appendChild(li);
    });
    
    errorContainer.appendChild(document.createTextNode('Please fix the following errors:'));
    errorContainer.appendChild(errorList);
    
    // Insert at the top of the form
    form.insertBefore(errorContainer, form.firstChild);
    
    // Highlight fields with errors
    errors.forEach(error => {
        if (error.toLowerCase().includes('title') && titleInput) {
            titleInput.classList.add('error-field');
            titleInput.style.borderColor = '#f44336';
        }
        if (error.toLowerCase().includes('content') && contentInput) {
            contentInput.classList.add('error-field');
            contentInput.style.borderColor = '#f44336';
        }
    });
    
    // Remove error messages and styling after 5 seconds
    setTimeout(() => {
        errorContainer.remove();
        if (titleInput) {
            titleInput.classList.remove('error-field');
            titleInput.style.borderColor = '';
        }
        if (contentInput) {
            contentInput.classList.remove('error-field');
            contentInput.style.borderColor = '';
        }
    }, 5000);
}
