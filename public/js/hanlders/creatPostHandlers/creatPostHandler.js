import { createPostApi } from "../../api/posts/creatPostRequest.js";
import { attachPostClickListeners } from "../mainFeedHandlers/postClicklistener.js";
import { postsHandler } from "../mainFeedHandlers/postFeedHandler.js"
import { showError } from "../../tools/error/showError.js";

export async function createPostHandler(rootContainer) {
    console.log('creatPostHandler.js: createPostHandler() called');
    const createPostForm = rootContainer.querySelector('#create-post-form');
    console.log('creatPostHandler.js: Create post form found:', !!createPostForm);
    if (!createPostForm) {
        console.log('creatPostHandler.js: Create post form not found, skipping');
        return;
    }
    // Remove any existing event listeners by cloning the form
    const newForm = createPostForm.cloneNode(true);
    createPostForm.parentNode.replaceChild(newForm, createPostForm);
    newForm.addEventListener('submit', async function (e) {
        console.log('creatPostHandler.js: Form submit event triggered');
        e.preventDefault();
        const formData = new FormData(newForm);
        const selectedCategories = Array.from(formData.getAll('categories')).map(id => parseInt(id, 10));
        const postData = {
            title: formData.get('title'),
            content: formData.get('content'),
            category_ids: selectedCategories,
        };
        console.log('creatPostHandler.js: Form data collected:', postData.title);
        const result = await createPostApi(postData);
        console.log('creatPostHandler.js: API result received, success:', result.success);
        if (result.success) {
            console.log('creatPostHandler.js: Post created successfully:', result.message); 
            // Reset the form
            newForm.reset();        
            // Refresh the post feed to show the new post
            try {
                await postsHandler();
                attachPostClickListeners();
                console.log('creatPostHandler.js: Post feed refreshed successfully');
            } catch (importError) {
                console.error('creatPostHandler.js: Error refreshing post feed:', importError.message);
            }
        } else {
            console.error('creatPostHandler.js: Post creation failed:', result.error);
            showError(newForm, result.error);
            console.log('creatPostHandler.js: Error displayed to user');
        }
    });
}
