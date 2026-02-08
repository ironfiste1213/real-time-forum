export function gategoriesComponent(categoriesContainer,categories ) {
    if (!categoriesContainer) return; // Element might not exist yet if view not loaded

    while (categoriesContainer.firstChild) {
        categoriesContainer.removeChild(categoriesContainer.firstChild);
    }

    if (categories && categories.length > 0) {
        categories.forEach(cat => {
            const checkboxWrapper = document.createElement('div');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `cat-${cat.id}`;
            checkbox.name = 'categories';
            checkbox.value = cat.id;

            const label = document.createElement('label');
            label.htmlFor = `cat-${cat.id}`;
            label.textContent = cat.name;

            checkboxWrapper.appendChild(checkbox);
            checkboxWrapper.appendChild(label);
            categoriesContainer.appendChild(checkboxWrapper);
        });
    } else {
        const noCategories = document.createElement('span');
        noCategories.textContent = 'No categories available.';
        categoriesContainer.appendChild(noCategories);
    }
}