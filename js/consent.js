const CONSENT_KEY = 'mezz_consent_v1';

export function getConsent() {
    try {
        return localStorage.getItem(CONSENT_KEY);
    } catch {
        return null;
    }
}

export function setConsent(value) {
    try {
        if (value === 'granted' || value === 'denied') {
            localStorage.setItem(CONSENT_KEY, value);
        } else {
            localStorage.removeItem(CONSENT_KEY);
        }
        return true;
    } catch {
        return false;
    }
}

export function initConsentBanner(onConsentChange) {
    const banner = document.getElementById('consent-banner');
    if (!banner) return;

    const currentConsent = getConsent();

    if (currentConsent === 'granted' || currentConsent === 'denied') {
        banner.hidden = true;
        return;
    }

    banner.hidden = false;

    const acceptBtn = document.getElementById('consent-accept');
    const declineBtn = document.getElementById('consent-decline');

    if (acceptBtn) {
        acceptBtn.addEventListener('click', () => {
            setConsent('granted');
            banner.hidden = true;
            if (typeof onConsentChange === 'function') {
                onConsentChange('granted');
            }
        });
    }

    if (declineBtn) {
        declineBtn.addEventListener('click', () => {
            setConsent('denied');
            banner.hidden = true;
            if (typeof onConsentChange === 'function') {
                onConsentChange('denied');
            }
        });
    }
}
