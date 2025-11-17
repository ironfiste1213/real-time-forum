// --- UI Clearing Utility ---
export function clearUIElement(element) {
    if (!element) return;

    switch (element.id) {
        case 'main-container':
        case 'single-post-view':
            // Clear all child elements and hide the container
            while (element.firstChild) {
                element.removeChild(element.firstChild);
            }
            element.classList.add('hidden');
            break;
        case 'chat-panel':
            // Remove the chat panel entirely
            element.remove();
            break;
        default:
            // Default behavior: clear children if any
            while (element.firstChild) {
                element.removeChild(element.firstChild);
            }
            break;
    }
}



export function clear(e) {
    while(e.firstChild ) {
        console.log("eeeeeeeeeeeeeeeeeee")
        e.removeChild(e.firstChild)
    }
    e.classList.add('hidden')
}