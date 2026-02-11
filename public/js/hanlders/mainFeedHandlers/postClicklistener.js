import { openPost } from "../../router.js";
/**
 * Attach click listeners to post elements for post details navigation
 * Uses event delegation for better performance
 */
export function attachPostClickListeners() {
    const postFeedSection = document.querySelector("#post-feed-section");
    if (!postFeedSection) {
        console.log('postClicklistener.js: #post-feed-section not found');
        return;
    }
    const postFeed = document.querySelector('#post-feed');
    if (!postFeed) {
        console.log('postClicklistener.js: #post-feed not found');
        return;
    }
    // Use event delegation for better performance
    postFeed.addEventListener('click', (event) => {
        // Find the closest post element
        const postElement = event.target.closest('.post');
        if (postElement) {
            const postId = postElement.dataset.postId;
            if (postId) {
                console.log('postClicklistener.js: Post clicked, postId:', postId);
                openPost(postId)
            } else {
                console.warn('postClicklistener.js: Post element missing data-post-id attribute');
            }
        }
    });
}

