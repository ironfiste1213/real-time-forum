/**
 * Search Component for Chat Panel
 * Creates a search input for filtering users in the chat users list.
 * Uses event delegation pattern with data attribute for cleanup tracking.
 */

import { chatState } from '../../ws/state.js';

/**
 * Creates a search input component for filtering users.
 * 
 * @param {HTMLElement} containerElement - The parent container element
 * @returns {HTMLInputElement} The search input element
 */
export function createSearchComponent(containerElement) {
    console.log('searchComponent.js: createSearchComponent() called');
    
    // Create search input container
    const searchContainer = document.createElement('div');
    searchContainer.className = 'chat-panel-search';
    
    // Create search input element
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search users...';
    searchInput.className = 'chat-search-input';
    
    // Mark container for cleanup tracking (same attribute as user list)
    // This allows clearEventListeners to find and clone/remove listeners
    searchContainer.setAttribute('data-has-users-listener', 'true');
    
    searchContainer.appendChild(searchInput);
    
    // Append search container to parent
    containerElement.appendChild(searchContainer);
    
    console.log('searchComponent.js: Search component created');
    
    return searchInput;
}

/**
 * Filters users based on search term.
 * @param {string} searchTerm - The search term to filter by
 */
async function filterUsers(searchTerm) {
    const container = chatState.usersListContainer;
    if (!container || !chatState.usersWithStatus) {
        return;
    }
    
    console.log('searchComponent.js: Filtering users with term:', searchTerm);
    
    // Clear current content
    container.innerHTML = '';
    
    // Filter users
    const filteredUsers = chatState.usersWithStatus.filter(user => {
        const name = (user.name || '').toLowerCase();
        const nickname = (user.nickname || '').toLowerCase();
        const username = (user.username || '').toLowerCase();
        const searchLower = searchTerm.toLowerCase();
        
        return name.includes(searchLower) || 
               nickname.includes(searchLower) || 
               username.includes(searchLower);
    });
    
    console.log('searchComponent.js: Filtered to', filteredUsers.length, 'users');
    
    // Re-render with filtered users
    // Import dynamically to avoid circular dependency
    const { UsersListComponent } = await import('../components/chat/userslistcomponent.js');
    const usersListComponent = UsersListComponent(filteredUsers);
    container.appendChild(usersListComponent);
}

/**
 * Sets up search event listener on the search input.
 * 
 * @param {HTMLInputElement} searchInput - The search input element
 * @returns {Function} Cleanup function to remove the event listener
 */
export function setupSearchListener(searchInput) {
    console.log('searchComponent.js: setupSearchListener() called');
    
    if (!searchInput) {
        console.error('searchComponent.js: Search input is null or undefined');
        return null;
    }
    
    const handleSearch = (event) => {
        const searchTerm = event.target.value.toLowerCase().trim();
        filterUsers(searchTerm);
    };
    
    searchInput.addEventListener('input', handleSearch);
    
    console.log('searchComponent.js: Search listener set up');
    
    // Return cleanup function
    return () => {
        searchInput.removeEventListener('input', handleSearch);
        console.log('searchComponent.js: Search listener removed');
    };
}

