import { showNotification } from "../../components/notification/notificationComponent.js";

/**
 * Handles incoming notification messages from WebSocket.
 * @param {Object} data - The notification data from the server
 * @param {string} data.message - The notification message to display
 * @param {string} data.type - The type of notification: 'success', 'error', 'info', 'warning'
 */
export function handleNotification(data) {
    console.log('[ws.js:handleNotification] Handling notification:', data);

    const message = data.message || 'Notification';
    const type = data.type || 'info';

    showNotification(message, type);
}

/**
 * Route incoming messages to appropriate handlers.
 * Add this to the message routing switch statement.
 */
export function handleIncomingNotification(data) {
    switch (data.type) {
        case 'notification':
            handleNotification(data);
            break;
        default:
            console.log('[ws.js:handleIncomingNotification] Unknown notification type:', data.type);
    }
}

