import { showNotification } from '../../components/notification/notificationComponent.js';

/**
 * Handle network errors (server down, connection refused, etc.)
 * Shows a notification to the user
 * @param {Error} error - The error object
 * @param {string} context - Optional context message for logging
 */
export function handleNetworkError(error, context = 'API call') {
    console.error(`[NetworkError] ${context}:`, error);
    
    // Check if it's a network error (server down, etc.)
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
        showNotification('Cannot connect to server. Please check your connection.', 'error');
        return {
            isNetworkError: true,
            message: 'Cannot connect to server. Please check your connection.'
        };
    }
    
    return {
        isNetworkError: false,
        message: error.message || 'An error occurred'
    };
}

/**
 * Wrapper for fetch that handles both HTTP status codes and network errors
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} - { ok, status, data, isNetworkError }
 */
export async function safeFetch(url, options = {}) {
    try {
        const response = await fetch(url, options);
        
        if (!response.ok) {
            return {
                ok: false,
                status: response.status,
                data: null,
                isNetworkError: false
            };
        }
        
        const data = await response.json();
        return {
            ok: true,
            status: response.status,
            data,
            isNetworkError: false
        };
    } catch (error) {
        // Network error (server down, etc.)
        handleNetworkError(error, `safeFetch: ${url}`);
        return {
            ok: false,
            status: null,
            data: null,
            isNetworkError: true
        };
    }
}

