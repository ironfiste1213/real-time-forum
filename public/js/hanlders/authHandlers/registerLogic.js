import { registerApi } from "../../api/auth/registerRequest.js";
import { router } from "../../router.js";
import { showError } from "../../tools/error/showError.js";
export async function registerHandler(rootContainer) {
    console.log('registerlogic.js: registerHandler() called');
    const registerForm = rootContainer.querySelector('.register-form');
    console.log('registerlogic.js: Register form found:', !!registerForm);
    if (!registerForm) return;

    registerForm.addEventListener('submit', async function (e) {
        console.log('registerlogic.js: Form submit event triggered');
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        const userData = Object.fromEntries(formData.entries());
        userData.age = parseInt(userData.age, 10);

        console.log('registerlogic.js: Form data collected, nickname:', userData.nickname, 'email:', userData.email);

        const result = await registerApi(userData);
        console.log('registerlogic.js: API result received, success:', result.success);

        if (result.success) {
            console.log('Registration successful:', result.message);
            // Clear form and redirect to login
            registerForm.reset();
            console.log('registerlogic.js: Form reset');
            // Navigate to login view
            router({path:"/login"})
        } else {
            console.error('Registration failed:', result.error);
            // Show error message to user
            showError(registerForm, result.error);
            console.log('registerlogic.js: Error displayed to user');
        }
    });

    // Handle navigation to login
    const navLink = rootContainer.querySelector('.form-nav-link');
    console.log('registerlogic.js: Login link found:', !!navLink);
    if (navLink) {
        navLink.addEventListener('click', function (e) {
            console.log('registerlogic.js: Navigation to login clicked');
            e.preventDefault();
            router({path:"/login"})
        });
    }
}

