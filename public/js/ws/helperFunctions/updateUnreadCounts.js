/**
 * Update Unread Counts Helper
 * Updates the unread count from loaded conversations and adds a badge to the chat button.
 */

import { chatState } from '../state.js';

/**
 * Increment unread count for a specific conversation/user
 * Called when receiving a new private message from a user
 * 
 */
export function incrementUnreadCount(senderId) {
    console.log('updateUnreadCounts.js: incrementUnreadCount() called for user:', senderId);
    
    try {
        // Find or create conversation entry for this sender
        let conversation = chatState.conversations.find(c => c.partner_id === senderId || c.user_id === senderId);
        
        if (!conversation) {
            // Create a temporary conversation entry
            conversation = {
                partner_id: senderId,
                user_id: senderId,
                unread_count: 0,
                last_message: '',
                last_message_time: null
            };
            chatState.conversations.push(conversation);
            console.log('updateUnreadCounts.js: Created new conversation entry for user:', senderId);
        }
        
        // Increment unread count
        conversation.unread_count = (conversation.unread_count || 0) + 1;
        console.log('updateUnreadCounts.js: Unread count for user', senderId, 'is now:', conversation.unread_count);
        
        // Also update chatState.allUsers with the new unread count for immediate UI update
        const userInAllUsers = chatState.allUsers.find(u => u.id === senderId);
        if (userInAllUsers) {
            userInAllUsers.unread_count = conversation.unread_count;
            console.log('updateUnreadCounts.js: Updated unread_count in chatState.allUsers for user:', senderId);
        }
        
        // Update the total unread count UI
        updateTotalUnreadUI();
        
        console.log('updateUnreadCounts.js: incrementUnreadCount() completed');
    } catch (e) {
        console.error('updateUnreadCounts.js: Error incrementing unread count:', e);
    }
}

/**
 * Update the total unread count UI based on chatState.conversations
 * Called after incrementing unread count for a specific user
 */
export function updateTotalUnreadUI() {
    try {
        // Calculate total unread count from all conversations
        const totalUnread = Array.isArray(chatState.conversations)
            ? chatState.conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0)
            : 0;

        console.log('updateUnreadCounts.js: Total unread count:', totalUnread);
        
        // Store total unread in chatState for other modules to access
        chatState.totalUnreadCount = totalUnread;

        // Find the floating chat button
        const btn = document.getElementById('floating-chat-btn');
        if (!btn) {
            console.log('updateUnreadCounts.js: Chat button not found');
            return;
        }

        // Ensure badge element exists
        let badge = btn.querySelector('#chat-unread-badge');
        if (!badge) {
            badge = document.createElement('span');
            badge.id = 'chat-unread-badge';
            badge.className = 'chat-unread-badge';
            btn.appendChild(badge);
            console.log('updateUnreadCounts.js: Created unread badge element');
        }

        if (totalUnread > 0) {
            // Show badge with count (cap at 99+)
            badge.textContent = totalUnread > 99 ? '99+' : String(totalUnread);
            badge.style.display = 'inline-flex';
            btn.title = `Open Chat (${totalUnread} unread)`;
            console.log('updateUnreadCounts.js: Badge shown with count:', totalUnread);
        } else {
            // Hide badge if no unread messages
            badge.textContent = '';
            badge.style.display = 'none';
            btn.title = 'Open Chat';
            console.log('updateUnreadCounts.js: Badge hidden (no unread)');
        }
    } catch (e) {
        console.error('updateUnreadCounts.js: Error updating total unread UI:', e);
    }
}

/**
 * Updates the chat UI with total unread count from conversations.
 * Adds/updates a badge on the floating chat button showing unread messages.
 *  */
export function updateUnreadCounts(conversations) {
    try {
        console.log('updateUnreadCounts.js: updateUnreadCounts() called');
        
        // Update chatState.conversations with the loaded conversations
        chatState.conversations = conversations || [];
        
        // Calculate total unread count from all conversations
        const totalUnread = Array.isArray(chatState.conversations)
            ? chatState.conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0)
            : 0;

        console.log('updateUnreadCounts.js: Total unread count:', totalUnread);
        
        // Store total unread in chatState for other modules to access
        chatState.totalUnreadCount = totalUnread;

        // Find the floating chat button
        const btn = document.getElementById('floating-chat-btn');
        if (!btn) {
            console.log('updateUnreadCounts.js: Chat button not found');
            return;
        }

        // Ensure badge element exists
        let badge = btn.querySelector('#chat-unread-badge');
        if (!badge) {
            badge = document.createElement('span');
            badge.id = 'chat-unread-badge';
            badge.className = 'chat-unread-badge';
            btn.appendChild(badge);
            console.log('updateUnreadCounts.js: Created unread badge element');
        }

        if (totalUnread > 0) {
            // Show badge with count (cap at 99+)
            badge.textContent = totalUnread > 99 ? '99+' : String(totalUnread);
            badge.style.display = 'inline-flex';
            btn.title = `Open Chat (${totalUnread} unread)`;
            console.log('updateUnreadCounts.js: Badge shown with count:', totalUnread);
        } else {
            // Hide badge if no unread messages
            badge.textContent = '';
            badge.style.display = 'none';
            btn.title = 'Open Chat';
            console.log('updateUnreadCounts.js: Badge hidden (no unread)');
        }
    } catch (e) {
        console.error('updateUnreadCounts.js: Error updating unread counts:', e);
    }
}


export async function loadConversationsAndUpdateUnread() {
    try {
        console.log('updateUnreadCounts.js: loadConversationsAndUpdateUnread() called');
        
        // Dynamic import to avoid circular dependency
        const { loadConversations } = await import('../../api/messages/loadConversations.js');
        
        // Load conversations
        const conversations = await loadConversations();
        console.log('updateUnreadCounts.js: Loaded', conversations.length, 'conversations');
        
        // Update unread counts and UI
        updateUnreadCounts(conversations);
        
        return conversations;
    } catch (e) {
        console.error('updateUnreadCounts.js: Error loading conversations:', e);
        return [];
    }
}

