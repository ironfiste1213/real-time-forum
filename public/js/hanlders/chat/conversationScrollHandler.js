/**
 * Conversation Scroll Handler
 * Handles scroll-to-load-more functionality for conversation history.
 * When user scrolls to the top, loads 10 more older messages.
 */

import { chatState } from '../../ws/state.js';
import { loadConversationHistory } from '../../api/messages/conversationHistory.js';
import { storeConversationHistory, normalizeMessage, createMessageElement } from '../../ws/helperFunctions/privateMessagesHelper.js';

/**
 * Set up scroll listener on the conversation messages container.
 * Loads more messages when user scrolls to the top.
 * 
 */
export function setupConversationScrollListener(conversationEl) {
    // console.log('[conversationScrollHandler.js] Setting up scroll listener');
    
    const messagesContainer = conversationEl.querySelector('#conversation-messages');
    if (!messagesContainer) {
        console.error('[conversationScrollHandler.js] Messages container not found');
        return;
    }
    
    // Add loading indicator at the top
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'conversation-loading-more';
    loadingIndicator.id = 'conversation-loading-more';
    loadingIndicator.innerHTML = '<span class="loading-spinner"></span> Loading more messages...';
    loadingIndicator.style.cssText = 'display: none; justify-content: center; align-items: center; gap: 8px; padding: 12px; color: #65676b; font-size: 13px;';
    
    // Add spinner styles
    const spinner = loadingIndicator.querySelector('.loading-spinner');
    if (spinner) {
        spinner.style.cssText = 'width: 16px; height: 16px; border: 2px solid #e4e6eb; border-top-color: #0C2C55; border-radius: 50%; animation: spin 0.8s linear infinite;';
    }
    
    // Add spinner animation if not exists
    if (!document.getElementById('spinner-animation-style')) {
        const style = document.createElement('style');
        style.id = 'spinner-animation-style';
        style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
        document.head.appendChild(style);
    }
    
    messagesContainer.appendChild(loadingIndicator);
    
    // Scroll handler
    const handleScroll = async () => {
        // Don't trigger if already loading or no more messages
        if (chatState.conversationIsLoading || !chatState.conversationHasMore) {
            return;
        }
        
        // Check if scrolled to top (within 50px threshold)
        if (messagesContainer.scrollTop > 50) {
            return;
        }
        
        // console.log('[conversationScrollHandler.js] User scrolled to top, loading more messages');
        
        // Set loading state
        chatState.conversationIsLoading = true;
        loadingIndicator.style.display = 'flex';
        
        try {
            const userId = chatState.conversationUserId;
            const currentOffset = chatState.conversationOffset;
            const limit = 10;
            
             console.log('====*****===[conversationScrollHandler.js] Loading messages - offset:', currentOffset, 'limit:', limit);
            
            // Load more messages from API
            
            const olderMessages = await loadConversationHistory(userId, currentOffset, limit);
            
            // console.log('[conversationScrollHandler.js] Loaded', olderMessages.length, 'older messages');
            
            if (olderMessages.length === 0) {
                // No more messages
                chatState.conversationHasMore = false;
                loadingIndicator.textContent = 'No more messages';
                setTimeout(() => {
                    loadingIndicator.style.display = 'none';
                }, 2000);
                return;
            }
            
            // Normalize and prepend older messages to existing ones
            const normalizedOlderMessages = olderMessages.map(msg => normalizeMessage(msg));
            
            // Get current scroll height before adding content
            const previousScrollHeight = messagesContainer.scrollHeight;
            
            // Store the current messages count to determine where to insert
            const currentMessagesCount = chatState.currentMessages.length;
            
            // Prepend older messages to the beginning of currentMessages
            chatState.currentMessages = [...chatState.currentMessages,...normalizedOlderMessages ];
            
            // Render older messages at the top
            normalizedOlderMessages.forEach((message) => {
                const messageEl = createMessageElement(message);
                // Insert after loading indicator (at the top)
                messagesContainer.insertBefore(messageEl, loadingIndicator.nextSibling);
            });
            
            // Update offset for next load
            chatState.conversationOffset += olderMessages.length;
            
            // If we got fewer messages than requested, there are no more
            if (olderMessages.length < limit) {
                chatState.conversationHasMore = false;
            }
            
            // Maintain scroll position
            const newScrollHeight = messagesContainer.scrollHeight;
            const scrollDifference = newScrollHeight - previousScrollHeight;
            messagesContainer.scrollTop = scrollDifference;
            
            // console.log('[conversationScrollHandler.js] Prepended', olderMessages.length, 'messages. New offset:', chatState.conversationOffset);
            
        } catch (error) {
            console.error('[conversationScrollHandler.js] Error loading more messages:', error);
            loadingIndicator.textContent = 'Error loading messages';
            setTimeout(() => {
                loadingIndicator.style.display = 'none';
            }, 2000);
        } finally {
            chatState.conversationIsLoading = false;
            if (chatState.conversationHasMore) {
                loadingIndicator.style.display = 'none';
            }
        }
    };
    
    // Attach scroll listener with debounce
    let scrollTimeout;
    const debouncedScroll = () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(handleScroll, 100);
    };
    
    messagesContainer.addEventListener('scroll', debouncedScroll);
    // console.log('[conversationScrollHandler.js] Scroll listener attached successfully');
}

/**
 * Reset conversation pagination state when opening a new conversation.
 * Call this before loading a new conversation.
 */
export function resetConversationPagination() {
    chatState.conversationOffset = 0;
    chatState.conversationHasMore = true;
    chatState.conversationIsLoading = false;
    chatState.conversationHistoryLoaded = false;
    // console.log('[conversationScrollHandler.js] Pagination state reset');
}

/**
 * Initialize conversation pagination state when loading initial conversation.
 * 
 */
export function initConversationPagination(userId, initialMessageCount = 0) {
    chatState.conversationUserId = userId;
    chatState.conversationOffset = initialMessageCount;
    chatState.conversationHasMore = true;
    chatState.conversationIsLoading = false;
    chatState.conversationHistoryLoaded = true;
    // console.log('[conversationScrollHandler.js] Pagination initialized for user', userId, 'with offset', initialMessageCount);
}

