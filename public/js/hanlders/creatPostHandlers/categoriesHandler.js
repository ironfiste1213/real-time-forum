import { fetchCategories } from "../../api/posts/categoriesRequest.js";
import { gategoriesComponent } from "../../components/mainfeedComponent/categoryComponent.js";

export async function categoriesHandler() {
    console.log('categoriesHandler.js: categoriesHandler() called');
    const categoriesContainer = document.querySelector("#categories-container");
    if (!categoriesContainer) {
        console.log('mainFeedHandlers.js: categories-container not found');
        return;
    }
    
    const categories = await fetchCategories();
    if (categories && categories.length > 0) {
        console.log('categoriesHandler.js: Categories fetched successfully, count:', categories.length);
        // Categories rendering would be handled by the component
        gategoriesComponent(categoriesContainer, categories);
    } else {
        console.log('categoriesHandler.js: No categories available');
        const noCategories = document.createElement('span');
        noCategories.textContent = 'No categories available.';
        categoriesContainer.appendChild(noCategories);
    }
}
