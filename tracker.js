import { recordVisit } from './js/analytics-store.js';

function trackCurrentPage() {
    try {
        recordVisit();
    } catch (error) {
        // Le suivi ne doit jamais empêcher le portfolio de fonctionner.
        console.debug('Suivi local indisponible.', error);
    }
}

if (document.readyState === 'complete') {
    trackCurrentPage();
} else {
    window.addEventListener('load', trackCurrentPage, { once: true });
}
