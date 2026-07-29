import {
    createSession,
    getSession,
    safeNextPath,
    verifyPassword,
} from './auth.js';

const form = document.getElementById('login-form');
const passwordInput = document.getElementById('password');
const errorMessage = document.getElementById('login-error');
const submitButton = document.getElementById('login-submit');
const nextPath = safeNextPath(new URLSearchParams(window.location.search).get('next'));

if (getSession()) {
    window.location.replace(nextPath);
} else {
    document.documentElement.classList.add('auth-ready');
    passwordInput.focus();
}

form.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorMessage.textContent = '';
    submitButton.disabled = true;
    submitButton.querySelector('span').textContent = 'Vérification…';

    try {
        const isValid = await verifyPassword(passwordInput.value);
        if (!isValid) {
            errorMessage.textContent = 'Mot de passe incorrect.';
            passwordInput.value = '';
            passwordInput.focus();
            return;
        }

        createSession();
        window.location.replace(nextPath);
    } catch (error) {
        console.error(error);
        errorMessage.textContent = 'Connexion impossible sur ce navigateur.';
    } finally {
        submitButton.disabled = false;
        submitButton.querySelector('span').textContent = 'Se connecter';
    }
});
