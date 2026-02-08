/**
 * Time Utilities
 * Shared date and time formatting functions
 */

/**
 * Formats a date string into a human-readable format
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date string
 */
export function formatDate(dateString) {
    if (!dateString) {
        return 'Unknown date';
    }

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        return 'Invalid date';
    }

    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

