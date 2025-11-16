import { showAuthView } from "./views.js";
import { createRegisterForm } from "./register.js";
import { createLoginForm } from "./login.js";
import { handleLogin } from "../api/login.js";
import { handleRegister } from "../api/resgister.js";

// --- DOM Elements ---
const DOMElements = {
  authContainer: document.getElementById("auth-container"),
  logoutButton: document.getElementById("logout-button"),
};

export function showLoginForm() {
  showAuthView();
  // Clear existing auth forms
  while (DOMElements.authContainer.firstChild) {
    DOMElements.authContainer.removeChild(DOMElements.authContainer.firstChild);
  }
  // Add title
  const title = document.createElement("h1");
  title.textContent = "REAL TIME FORUM";
  DOMElements.authContainer.appendChild(title);
  // Create and append login form
  const loginForm = createLoginForm();
  DOMElements.authContainer.appendChild(loginForm);

  // Re-attach event listeners
  const form = document.getElementById("loginForm");
  if (form) {
    form.addEventListener("submit", handleLogin);
  }

  // Trigger fade-in animation
  setTimeout(() => {
    loginForm.classList.add("fade-in");
  }, 10);
}

export function showRegisterForm() {
  showAuthView();
  // Clear existing auth forms
  while (DOMElements.authContainer.firstChild) {
    DOMElements.authContainer.removeChild(DOMElements.authContainer.firstChild);
  }
  // Add title
  const title = document.createElement("h1");
  title.textContent = "REAL TIME FORUM";
  DOMElements.authContainer.appendChild(title);
  // Create and append register form
  const registerForm = createRegisterForm();
  DOMElements.authContainer.appendChild(registerForm);

  // Re-attach event listeners
  const regForm = document.getElementById("registerForm");
  if (regForm) {
    regForm.addEventListener("submit", handleRegister);
  }

  // Trigger fade-in animation
  setTimeout(() => {
    registerForm.classList.add("fade-in");
  }, 10);
}

// Handle registration form submission
