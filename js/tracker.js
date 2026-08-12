import { getConsent, initConsentBanner } from './js/consent.js';
import { recordVisit } from './js/analytics-store.js';

function trackVisit() {
    recordVisit().catch(() => {
        // Le suivi ne doit jamais empêcher l’affichage du site.
    });
}

function initTracking() {
    initConsentBanner((status) => {
        if (status === 'granted') trackVisit();
    });

    if (getConsent() === 'granted') trackVisit();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTracking, { once: true });
} else {
    initTracking();
}
