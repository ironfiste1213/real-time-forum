
export async function fetchCategories() {
    console.log('categoriesRequest.js: fetchCategories() called');
    console.log('categoriesRequest.js: Sending GET to /api/categories');
    
    try {
        const response = await fetch('/api/categories', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        console.log('categoriesRequest.js: Response received, status:', response.status);

        if (response.ok) {
            // Parse and return the categories data
            const categories = await response.json();
            console.log('categoriesRequest.js: Categories fetched successfully, count:', categories.length);
            return categories;
        }

        // Response was not OK, return empty array
        console.log('categoriesRequest.js: Failed to fetch categories, returning empty array');
        return [];
    } catch (error) {
        console.error('categoriesRequest.js: Network error:', error.message);
        // Network error or other fetch failures, return empty array
        return [];
    }
}

