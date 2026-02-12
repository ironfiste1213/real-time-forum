import { handleStatusCode } from '../../tools/error/statusCodeHandler.js';
import { handleNetworkError } from '../../tools/error/networkErrorHandler.js';

export async function fetchCategories() {
    //console.log('categoriesRequest.js: fetchCategories() called');
    //console.log('categoriesRequest.js: Sending GET to /api/categories');
    
    try {
        const response = await fetch('/api/categories', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        //console.log('categoriesRequest.js: Response received, status:', response.status);

        if (response.ok) {
            // Parse and return the categories data
            const categories = await response.json();
            //console.log('categoriesRequest.js: Categories fetched successfully, count:', categories.length);
            return categories;
        }

        // Handle status code (will redirect to login on 401)
        handleStatusCode(response);
        
        // Response was not OK, return empty array
        //console.log('categoriesRequest.js: Failed to fetch categories, returning empty array');
        return [];
    } catch (error) {
        handleNetworkError(error, 'fetchCategories');
        // Network error or other fetch failures, return empty array
        return [];
    }
}

