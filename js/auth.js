const SESSION_KEY = 'mezz_admin_session_v1';
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

// GitHub Pages ne permet pas d'exécuter un serveur d'authentification.
// Ce vérificateur PBKDF2 protège l'accès normal à l'interface, sans stocker
// le mot de passe en clair. Voir le README pour les limites et la rotation.
const PASSWORD_CONFIG = Object.freeze({
    iterations: 210000,
    salt: 'p8WNoH/PinMj1hqBzc10Uw==',
    verifier: 'v5yRqc5NAOc6VGTLA/SCCcjpXoG+X/vX78puErJ02qM=',
});

function fromBase64(value) {
    return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

function toBase64(value) {
    let binary = '';
    value.forEach((byte) => {
        binary += String.fromCharCode(byte);
    });
    return btoa(binary);
}

function constantTimeEqual(left, right) {
    if (left.length !== right.length) return false;

    let difference = 0;
    for (let index = 0; index < left.length; index += 1) {
        difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
    }
    return difference === 0;
}

export async function verifyPassword(password) {
    if (!password || !window.crypto?.subtle) return false;

    const material = await window.crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(password),
        'PBKDF2',
        false,
        ['deriveBits'],
    );

    const bits = await window.crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            hash: 'SHA-256',
            salt: fromBase64(PASSWORD_CONFIG.salt),
            iterations: PASSWORD_CONFIG.iterations,
        },
        material,
        256,
    );

    return constantTimeEqual(
        toBase64(new Uint8Array(bits)),
        PASSWORD_CONFIG.verifier,
    );
}

export function createSession() {
    const now = Date.now();
    const session = {
        createdAt: now,
        expiresAt: now + SESSION_DURATION_MS,
        source: 'login',
        nonce: window.crypto?.randomUUID?.() ?? `${now}-${Math.random()}`,
    };

    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getSession() {
    try {
        const session = JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? 'null');
        const isValid = session
            && session.source === 'login'
            && Number.isFinite(session.createdAt)
            && Number.isFinite(session.expiresAt)
            && session.createdAt <= Date.now()
            && session.expiresAt > Date.now();

        if (!isValid) {
            clearSession();
            return null;
        }

        return session;
    } catch {
        clearSession();
        return null;
    }
}

export function clearSession() {
    try {
        sessionStorage.removeItem(SESSION_KEY);
    } catch {
        // La redirection de déconnexion reste possible même sans stockage.
    }
}

export function safeNextPath(value, fallback = '/dashboard/') {
    if (typeof value !== 'string') return fallback;

    try {
        const url = new URL(value, window.location.origin);
        if (url.origin !== window.location.origin || !url.pathname.startsWith('/dashboard')) {
            return fallback;
        }
        return `${url.pathname}${url.search}${url.hash}`;
    } catch {
        return fallback;
    }
}

export function loginUrl(next = window.location.pathname) {
    const url = new URL('/login/', window.location.origin);
    url.searchParams.set('next', safeNextPath(next));
    return `${url.pathname}${url.search}`;
}
