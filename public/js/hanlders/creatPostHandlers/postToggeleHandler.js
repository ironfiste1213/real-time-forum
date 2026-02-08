import { categoriesHandler } from "./categoriesHandler.js";

export function createPostToggleHandler() {
    console.log('PostToggleHandler.js: createPostToggleHandler() called');
    
    const createPostToggle = document.querySelector('#create-post-toggle');
    const createPostSection = document.querySelector('#create-post-section');
    
    if (!createPostToggle) {
        console.log('PostToggleHandler.js: #create-post-toggle not found');
        return;
    }
    
    if (!createPostSection) {
        console.log('PostToggleHandler.js: #create-post-section not found');
        return;
    }
    
    // Track if categories have been loaded for this session
    let categoriesLoaded = false;
    
    createPostToggle.addEventListener('click', () => {
        console.log('PostToggleHandler.js: Create post toggle clicked');
        
        if (createPostSection.classList.contains('open')) {
            createPostSection.classList.remove('open');
            createPostToggle.textContent = '+ Create Post';
            console.log('PostToggleHandler.js: Create post section hidden');
        } else {
            createPostSection.classList.add('open');
            createPostToggle.textContent = '✕ Close';
            console.log('PostToggleHandler.js: Create post section shown');
            
            // Load categories when section is opened (in case form was cloned)
            if (!categoriesLoaded) {
                console.log('PostToggleHandler.js: Loading categories on first open');
                categoriesHandler();
                categoriesLoaded = true;
            }
        }
    });
    
    console.log('PostToggleHandler.js: Create post toggle handler attached');
}