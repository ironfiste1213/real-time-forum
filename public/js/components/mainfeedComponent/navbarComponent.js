export function createNav(user) {
    //console.log('navbarComponent.js: createNav() called with user:', user ? user.nickname : 'null');
    
    const nav = document.createElement('nav');
    //console.log('navbarComponent.js: Nav element created');

    // Left section: Welcome message
    const leftSection = document.createElement('div');
    leftSection.className = 'nav-left';
    const welcomeMessage = document.createElement('span');
    welcomeMessage.id = 'welcome-message';
    //console.log("eeeeeeeeeeeeeeeeeeeeee", user);
    
    welcomeMessage.textContent = user && user.nickname ? `Welcome, ${user.nickname}! to the REAL-TIME-FORUM` : 'Welcome! to the REAL-TIME-FORUM';
    //console.log('navbarComponent.js: Welcome message set:', welcomeMessage.textContent);
    leftSection.appendChild(welcomeMessage);
    nav.appendChild(leftSection);

    // Center section: Create Post button
    const centerSection = document.createElement('div');
    centerSection.className = 'nav-center';
    const createPostToggle = document.createElement('button');
    createPostToggle.id = 'create-post-toggle';
    createPostToggle.textContent = '+ Create Post';
    createPostToggle.className = 'create-post-toggle-btn';
    createPostToggle.setAttribute('data-has-listener', 'true'); // Mark as having event listener
    //console.log('navbarComponent.js: Create post toggle button created');
    centerSection.appendChild(createPostToggle);
    nav.appendChild(centerSection);

    // Logout button
    const rightSection = document.createElement('div');
    rightSection.className = 'nav-right';

    const logoutButton = document.createElement('button');
    logoutButton.id = 'logout-button';
    logoutButton.textContent = '➜]';
    logoutButton.setAttribute('data-has-listener', 'true'); // Mark as having event listener
    //console.log('navbarComponent.js: Logout button created');
    rightSection.appendChild(logoutButton);

    nav.appendChild(rightSection);

    //console.log('navbarComponent.js: Nav created successfully');
    return nav;
}

