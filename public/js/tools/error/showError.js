export function showError(form, message) {
    console.log('registerlogic.js: showError() called with message:', message);
    // Remove existing error if any
    const existingError = form.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }

    // Create error message element
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.color = '#0C2C55';
    errorDiv.style.backgroundColor = 'rgba(98, 159, 173, 0.2)';
    errorDiv.style.padding = '10px';
    errorDiv.style.borderRadius = '4px';
    errorDiv.style.marginBottom = '15px';
    errorDiv.style.fontSize = '14px';
    errorDiv.style.border = '1px solid #296374';
    errorDiv.textContent = message;

    // Insert at the top of the form
    form.insertBefore(errorDiv, form.firstChild);

    // Remove error after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.remove();
        }
    }, 5000);
}

