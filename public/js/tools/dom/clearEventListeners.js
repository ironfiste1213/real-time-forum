/**
 * Clear event listeners from elements by cloning them
 *
 * HOW IT WORKS:
 * 1. Finds all elements marked with the specified dataAttribute
 * 2. Clones each element (cloneNode(true)) which removes all event listeners
 * 3. Replaces original with clone
 *
 * @param {Element} container - Container to search for elements (default: document)
 * @param {string} dataAttribute - The data attribute to look for (default: 'data-has-listener')
 */
export function clearEventListeners(container = document, dataAttribute = 'data-has-listener') {
    console.log(`[clearEventListeners] Clearing event listeners for ${dataAttribute}...`);

    // Find all elements marked as having event listeners
    const elements = container.querySelectorAll(`[${dataAttribute}]`);

    console.log(`[clearEventListeners] Found ${elements.length} elements with ${dataAttribute}`);

    elements.forEach(element => {
        // Skip if element has no parent (already removed from DOM)
        if (!element.parentNode) {
            console.log(`[clearEventListeners] Skipping orphaned element: ${element.id || element.tagName}`);
            return;
        }

        // Clone the element (true = deep clone with all children)
        const clone = element.cloneNode(true);

        // Copy over any data attributes we might need
        Array.from(element.attributes).forEach(attr => {
            if (attr.name.startsWith('data-')) {
                clone.setAttribute(attr.name, attr.value);
            }
        });

        // Replace the original with the clone
        element.parentNode.replaceChild(clone, element);
        console.log(`[clearEventListeners] Cleared listeners on: ${element.id || element.tagName}`);
    });

    console.log(`[clearEventListeners] Event listener cleanup complete for ${dataAttribute}`);
}
