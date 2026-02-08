/**
 * Notification Component
 * Creates a notification container that displays messages to the user.
 * Supports multiple types: success, error, info, warning.
 */

/**
 * Creates a notification container with the given message and type.
 * @param {string} message - The notification message to display
 * @param {string} type - The type of notification: 'success', 'error', 'info', 'warning'
 * @returns {HTMLElement} The notification container element
 */
export function createNotification(message, type = 'info') {
    console.log('notificationComponent.js: createNotification() called with message:', message, 'type:', type);

    // Validate type
    const validTypes = ['success', 'error', 'info', 'warning'];
    if (!validTypes.includes(type)) {
        type = 'info';
    }

    // Create main notification container
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.setAttribute('data-notification-type', type);

    // Create message text
    const messageElement = document.createElement('div');
    messageElement.className = 'notification-message';
    messageElement.textContent = message;
    notification.appendChild(messageElement);

    // Create close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'notification-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.title = 'Close';
    closeBtn.setAttribute('aria-label', 'Close notification');
    notification.appendChild(closeBtn);

    // Auto-dismiss timer
    let dismissTimer = null;

    // Close button click handler
    const dismissNotification = () => {
        if (dismissTimer) {
            clearTimeout(dismissTimer);
        }
        notification.classList.add('notification-hiding');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    };

    closeBtn.addEventListener('click', dismissNotification);

    // Set auto-dismiss timer (4 seconds)
    dismissTimer = setTimeout(dismissNotification, 4000);

    console.log('notificationComponent.js: Notification created successfully');
    return notification;
}

/**
 * Creates and displays a notification by appending it to the notifications container.
 * @param {string} message - The notification message to display
 * @param {string} type - The type of notification: 'success', 'error', 'info', 'warning'
 * @returns {HTMLElement} The notification element
 */
export function showNotification(message, type = 'info') {
    console.log('notificationComponent.js: showNotification() called');

    // Get or create the notifications container
    let container = document.getElementById('notifications-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notifications-container';
        container.className = 'notifications-container';
        document.body.appendChild(container);
    }

    // Create the notification
    const notification = createNotification(message, type);
    container.appendChild(notification);

    // Trigger animation
    requestAnimationFrame(() => {
        notification.classList.add('notification-visible');
    });

    return notification;
}

/**
 * Dismisses all visible notifications.
 */
export function dismissAllNotifications() {
    const container = document.getElementById('notifications-container');
    if (container) {
        const notifications = container.querySelectorAll('.notification');
        notifications.forEach(notification => {
            notification.classList.add('notification-hiding');
        });

        setTimeout(() => {
            notifications.forEach(notification => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            });
        }, 300);
    }
}

