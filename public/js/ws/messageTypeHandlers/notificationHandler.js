import { showNotification } from "../../components/notification/notificationComponent.js";

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

