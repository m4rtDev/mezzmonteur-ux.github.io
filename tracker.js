import { recordVisit } from './js/analytics-store.js';
import { getConsent, initConsentBanner } from './js/consent.js';

function trackCurrentPage() {
    try {
        if (getConsent() === 'granted') {
            recordVisit();
        }
    } catch (error) {
        // Le suivi ne doit jamais empêcher le portfolio de fonctionner.
        console.debug('Suivi indisponible.', error);
    }
}

function initTracking() {
    initConsentBanner((status) => {
        if (status === 'granted') {
            trackCurrentPage();
        }
    });

    trackCurrentPage();
}

if (document.readyState === 'complete') {
    initTracking();
} else {
    window.addEventListener('load', initTracking, { once: true });
}
