export function createLoadMoreButton() {
    console.log('loadmoreButtonCoponent.js: createLoadMoreButton() called');
    
    const button = document.createElement('button');
    button.id = 'load-more-button';
    button.textContent = 'Load More Posts';
    button.style.margin = '20px auto';
    button.style.display = 'block';
    button.style.padding = '10px 20px';
    button.style.fontSize = '16px';
    button.style.backgroundColor = '#296374';
    button.style.color = '#EDEDCE';
    button.style.border = 'none';
    button.style.borderRadius = '5px';
    button.style.cursor = 'pointer';
    console.log('loadmoreButtonCoponent.js: Load more button created');
        
    return button;
}

