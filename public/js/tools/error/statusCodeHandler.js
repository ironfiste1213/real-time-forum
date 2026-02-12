import { showError } from './showError.js';
import { handleUnauthorized } from '../../hanlders/authHandlers/logoutLogic.js';
import { showNotification } from '../../components/notification/notificationComponent.js';

/**
 * Centralized HTTP status code handler
 * @param {Response} response - Fetch API response object
 * @param {string} customMessage - Optional custom message
 * @param {HTMLElement} formElement - Form element for error display
 * @returns {Object} - { shouldRetry: boolean, userMessage: string, redirectPath: string }
 */
export function handleStatusCode(response, customMessage = '', formElement = null) {
    const status = response.status;
    
    switch (status) {
        case 401:
            // Unauthorized - perform full cleanup and redirect to login
            console.log('401 Unauthorized - performing full cleanup and redirecting to login');
            handleUnauthorized(window.location.pathname);
            return {
                shouldRetry: false,
                userMessage: 'Your session has expired. Please log in again.',
                redirectPath: '/login'
            };
            
        case 429:
            // Too Many Requests - rate limited
            const retryAfter = response.headers.get('Retry-After');
            const rateLimitMessage = retryAfter 
                ? `Too many requests. Please wait ${retryAfter} seconds before trying again.`
                : 'Too many requests. Please slow down and try again later.';
            
            if (formElement) {
                showError(formElement, rateLimitMessage);
            } else {
                showNotification(rateLimitMessage, 'warning');
            }
            return {
                shouldRetry: false,
                userMessage: rateLimitMessage,
                redirectPath: null
            };
            
        case 500:
            // Internal Server Error
            console.log('*****Server error occurred. Please try again later*****');
            
            const serverMessage = 'Server error occurred. Please try again later.';
            if (formElement) {
                showError(formElement, serverMessage);
            } else {
                showNotification(serverMessage, 'error');
            }
            return {
                shouldRetry: true,
                userMessage: serverMessage,
                redirectPath: null
            };
            
        case 404:
            // Not Found
            const notFoundMessage = customMessage || 'The requested resource was not found.';
            if (formElement) {
                showError(formElement, notFoundMessage);
            } else {
                showNotification(notFoundMessage, 'warning');
            }
            return {
                shouldRetry: false,
                userMessage: notFoundMessage,
                redirectPath: null
            };
            
        case 405:
            // Method Not Allowed
            const methodMessage = 'This action is not allowed.';
            if (formElement) {
                showError(formElement, methodMessage);
            } else {
                showNotification(methodMessage, 'error');
            }
            return {
                shouldRetry: false,
                userMessage: methodMessage,
                redirectPath: null
            };
            
        case 400:
            // Bad Request - try to get server message
            return response.json().then(data => {
                const message = data.message || customMessage || 'Invalid request.';
                if (formElement) {
                    showError(formElement, message);
                } else {
                    showNotification(message, 'warning');
                }
                return {
                    shouldRetry: false,
                    userMessage: message,
                    redirectPath: null
                };
            }).catch(() => {
                const message = customMessage || 'Invalid request.';
                if (formElement) {
                    showError(formElement, message);
                } else {
                    showNotification(message, 'warning');
                }
                return {
                    shouldRetry: false,
                    userMessage: message,
                    redirectPath: null
                };
            });
            
        default:
            // For other status codes, return generic handling
            const defaultMessage = customMessage || `Request failed with status ${status}`;
            if (formElement) {
                showError(formElement, defaultMessage);
            } else if (status >= 500) {
                showNotification(defaultMessage, 'error');
            } else if (status >= 400) {
                showNotification(defaultMessage, 'warning');
            }
            return {
                shouldRetry: status >= 500,
                userMessage: defaultMessage,
                redirectPath: null
            };
    }
}
