# TODO: Move handleLogin to /api/login.js

- [x] Create `public/js/api/login.js` with the `handleLogin` function and necessary imports (showNotification, checkSession, getCurrentUser, initializeChatConnection, chatWS, showMainFeedView)
- [x] Update `public/js/ui/auth.js`: Add import for `handleLogin` from `../api/login.js`, remove the `handleLogin` function definition
- [x] Verify the changes: Ensure event listener in `showLoginForm` still attaches correctly and no syntax errors

# TODO: Move handleRegister to /api/resgister.js

- [ ] Update `public/js/ui/auth.js`: Add import for `handleRegister` from `../api/resgister.js`, remove the local `handleRegister` function definition
- [ ] Update `public/js/ui/auth.js`: In `showRegisterForm`, ensure the event listener attaches the imported `handleRegister`
- [ ] Verify the changes: Ensure event listener in `showRegisterForm` attaches correctly and the login form appears after successful registration
