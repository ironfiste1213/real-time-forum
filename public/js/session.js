import { checkSession as apiCheckSession } from './api/checksession.js';

let currentUser = null;

export async function checkSession() {
    const user = await apiCheckSession();
    if (user) {
        currentUser = user;
        return currentUser;
    } else {
        currentUser = null;
        return null;
    }
}

export const getCurrentUser = () => currentUser;

export const clearCurrentUser = () => {
    currentUser = null;
};
