import { createCreatePostComponent } from "./creatPostCoponent.js";
import { createFloatingChatButton } from "./chatButtonComponent.js";
import { createNav } from "./navbarComponent.js";

export function createMainFeedContent(user) {
    console.log('mainFeedContainer.js: createMainFeedContent() called with user:', user ? user.nickname : 'null');

    // Navigation
    console.log('mainFeedContainer.js: Creating navigation');
    const nav = createNav(user);

    const container = document.createElement('div');
    container.style.width = '100%';
    container.appendChild(nav);
    console.log('mainFeedContainer.js: Navigation appended to container');

    // Main feed view
    const mainFeedView = document.createElement('div');
    mainFeedView.id = 'main-feed-view';
    mainFeedView.style.width = '100%';

    const mainContent = document.createElement('main');
    mainContent.className = 'main-content';
    mainContent.style.width = '100%';

    // Create post section using the imported function
    console.log('mainFeedContainer.js: Creating post component');
    const createPostSection = createCreatePostComponent();
    mainContent.appendChild(createPostSection);
    console.log('mainFeedContainer.js: Post component appended');
    const postFeedSection = document.createElement('section');
    postFeedSection.id = 'post-feed-section';

    console.log('mainFeedContainer.js: Post feed section created');

    mainContent.appendChild(postFeedSection);
    mainFeedView.appendChild(mainContent);
    container.appendChild(mainFeedView);
    console.log('mainFeedContainer.js: Main content appended');

    // Add floating chat button using the imported function
    console.log('mainFeedContainer.js: Creating floating chat button');
    const floatingChatButton = createFloatingChatButton();
    container.appendChild(floatingChatButton);
    console.log('mainFeedContainer.js: Floating chat button appended');

    console.log('mainFeedContainer.js: Main feed content created successfully');
    return container;
}

export function creatPostFeedSectionContent(postFeedSection) {
    // Post feed section

    if (postFeedSection) {
        postFeedSection.innerHTML = ""
        const feedHeading = document.createElement('h2');
        feedHeading.textContent = 'Feed';
        postFeedSection.appendChild(feedHeading);

        const postFeed = document.createElement('div');
        postFeed.id = 'post-feed';
        postFeedSection.appendChild(postFeed);
    }


}