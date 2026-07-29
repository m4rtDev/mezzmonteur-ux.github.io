import { beforeEach, describe, expect, it } from 'vitest';
import { getConsent, initConsentBanner, setConsent } from '../js/consent.js';

describe('Consent Module', () => {
    let storage = {};

    beforeEach(() => {
        storage = {};
        global.localStorage = {
            getItem: (key) => storage[key] ?? null,
            setItem: (key, value) => { storage[key] = String(value); },
            removeItem: (key) => { delete storage[key]; },
        };
        document.body.innerHTML = `
            <div id="consent-banner" hidden>
                <button id="consent-accept">Accepter</button>
                <button id="consent-decline">Refuser</button>
            </div>
        `;
    });

    it('returns null when no consent has been set', () => {
        expect(getConsent()).toBeNull();
    });

    it('stores and retrieves granted consent', () => {
        setConsent('granted');
        expect(getConsent()).toBe('granted');
    });

    it('stores and retrieves denied consent', () => {
        setConsent('denied');
        expect(getConsent()).toBe('denied');
    });

    it('shows consent banner when consent is not yet decided', () => {
        initConsentBanner();
        const banner = document.getElementById('consent-banner');
        expect(banner.hidden).toBe(false);
    });

    it('hides consent banner when consent is already set', () => {
        setConsent('granted');
        initConsentBanner();
        const banner = document.getElementById('consent-banner');
        expect(banner.hidden).toBe(true);
    });

    it('sets consent to granted on accept button click', () => {
        let callbackConsent = null;
        initConsentBanner((status) => { callbackConsent = status; });

        document.getElementById('consent-accept').click();
        expect(getConsent()).toBe('granted');
        expect(callbackConsent).toBe('granted');
        expect(document.getElementById('consent-banner').hidden).toBe(true);
    });

    it('sets consent to denied on decline button click', () => {
        let callbackConsent = null;
        initConsentBanner((status) => { callbackConsent = status; });

        document.getElementById('consent-decline').click();
        expect(getConsent()).toBe('denied');
        expect(callbackConsent).toBe('denied');
        expect(document.getElementById('consent-banner').hidden).toBe(true);
    });
});
