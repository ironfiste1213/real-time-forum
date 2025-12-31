export async function handleCreateComment(event, postId) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const content = formData.get('content');

    // Client-side validation
    const validationResult = validateCommentInput(content);
    if (!validationResult.valid) {
        console.error('Comment validation failed:', validationResult.errors);
        displayCommentErrors(form, validationResult.errors);
        return;
    }

    if (!content || !content.trim()) {
        console.error('Comment cannot be empty.');
        return;
    }

    const commentData = {
        content: sanitizeHTML(content),
    };

    try {
        const response = await fetch(`/api/posts/${postId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(commentData),
        });

        const result = await response.json();

        if (response.ok) {
            form.reset(); // Clear the form
            // Import loadAndRenderComments dynamically to avoid circular dependency
            import('../ui/postDetail.js').then(module => module.loadAndRenderComments(postId));
        } else {
            // Handle backend validation errors
            let errorMessage = result.message || 'An unknown error occurred.';
            if (result.errors && result.errors.length > 0) {
                errorMessage = result.errors.join(', ');
            }
            console.error(`Failed to post comment: ${errorMessage}`);
            displayCommentErrors(form, [errorMessage]);
        }
    } catch (error) {
        console.error('Network or parsing error during comment creation:', error);
    }
}

// Configuration constant matching backend
const MAX_COMMENT_LENGTH = 500;

// Spam patterns to detect on client side (same as posts)
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

// Validate comment input on client side
export function validateCommentInput(content) {
    const errors = [];
    
    // Check content
    const trimmedContent = content.trim();
    if (!trimmedContent) {
        errors.push('Comment cannot be empty');
    } else if (trimmedContent.length > MAX_COMMENT_LENGTH) {
        errors.push(`Comment exceeds maximum length of ${MAX_COMMENT_LENGTH} characters`);
    }
    
    // Check for control characters
    if (/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(content)) {
        errors.push('Comment contains invalid characters');
    }
    
    // Check for spam
    if (isSpam(trimmedContent)) {
        errors.push('Comment appears to be spam');
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

// Display validation errors for comment form
function displayCommentErrors(form, errors) {
    // Remove existing error messages
    const existingErrors = form.querySelectorAll('.comment-validation-error');
    existingErrors.forEach(el => el.remove());
    
    // Remove error styling from field
    const contentInput = form.querySelector('[name="content"]');
    if (contentInput) contentInput.classList.remove('error-field');
    
    // Create error container
    const errorContainer = document.createElement('div');
    errorContainer.className = 'comment-validation-error';
    errorContainer.style.cssText = 'background-color: #ffebee; border: 1px solid #f44336; color: #c62828; padding: 10px; margin-bottom: 10px; border-radius: 4px; font-size: 14px;';
    
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
    
    // Highlight field with error
    if (contentInput) {
        contentInput.classList.add('error-field');
        contentInput.style.borderColor = '#f44336';
    }
    
    // Remove error messages and styling after 5 seconds
    setTimeout(() => {
        errorContainer.remove();
        if (contentInput) {
            contentInput.classList.remove('error-field');
            contentInput.style.borderColor = '';
        }
    }, 5000);
}
