import { handleUserOnline } from './userOnline.js';
import { handleUserOffline } from './userOffline.js';
import { handlePrivateMessage } from './privateMessage.js';
//import { handleMessageDelivered, handleMessageFailed } from './messageStatusHandlers.js';
import { handleMessageFromMe } from './messageFromMe.js';

// Handle incoming messages
export function handleMessage(data) {
    // console.log('[ws.js:handleMessage] [DEBUG] Handling message:', data, data.type);
    switch (data.type) {
        case 'user_online':
            // console.log('[ws.js:handleMessage] [DEBUG] Message type: user_online');
            handleUserOnline(data);
            break;
        case 'user_offline':
            // console.log('[ws.js:handleMessage] [DEBUG] Message type: user_offline');
            handleUserOffline(data);
            break;
        case 'private_message':
            // console.log('[ws.js:handleMessage] [DEBUG] Message type: private_message');
            handlePrivateMessage(data);
            break;
        case 'message_from_me':
            // console.log('[ws.js:handleMessage] [DEBUG] Message type: message_from_me');
            handleMessageFromMe(data);
            break;

        default:
            // console.log('[ws.js:handleMessage] [DEBUG] Unknown message type:', data.type, data);
    }
}

