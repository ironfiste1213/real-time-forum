import { loginApi } from "../../api/auth/loginRequest.js";
import { handleLocation, router } from "../../router.js";
import { showError } from "../../tools/error/showError.js";


export async function loginHandler(rootContainer, distination) {
    console.log('loginlogic.js: loginHandler() called');
    const loginForm = rootContainer.querySelector('.login-form');
    console.log('loginlogic.js: Login form found:', !!loginForm);
    if (!loginForm) return;

    loginForm.addEventListener('submit', async function (e) {
        console.log('loginlogic.js: Form submit event triggered');
        e.preventDefault();
        const identifierInput = loginForm.querySelector('#identifier');
        const passwordInput = loginForm.querySelector('#password');
        const formData = {
            identifier: identifierInput.value,
            password: passwordInput.value
        };
        console.log('loginlogic.js: Form data collected, identifier:', formData.identifier);

        const result = await loginApi(formData);
        console.log('loginlogic.js: API result received, success:', result.success);

        if (result.success) {
            console.log('Login successful:', result.message);
            // Clear form and redirect to main view
            loginForm.reset();
            window.history.pushState({}, "", distination);
            handleLocation();
            console.log('loginlogic.js: Form reset and redirect initiated');
        } else {
            console.error('Login failed:', result.error);
            // Show error message to user
            showError(loginForm, result.error);
            console.log('loginlogic.js: Error displayed to user');
        }
    });

    // Handle navigation to register
    const navLink = rootContainer.querySelector('.form-nav-link');
    console.log('loginlogic.js: Register link found:', !!navLink);
    if (navLink) {
        navLink.addEventListener('click', function (e) {
            console.log('loginlogic.js: Navigation to register clicked');
            e.preventDefault();
            router({path:"/register"})
        });
    }
}
