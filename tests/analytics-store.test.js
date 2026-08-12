import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    browserName,
    buildStats,
    deviceName,
    exportVisitsCsv,
    getVisits,
    recordVisit,
    referrerName,
} from '../js/analytics-store.js';

describe('Analytics Store Module', () => {
    let storage = {};

    beforeEach(() => {
        storage = {};
        global.localStorage = {
            getItem: (key) => storage[key] ?? null,
            setItem: (key, value) => { storage[key] = String(value); },
            removeItem: (key) => { delete storage[key]; },
        };
        storage['mezz_consent_v1'] = 'granted';
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                success: true,
                visit: { ip: '198.51.100.25', city: 'Bordeaux', country: 'FR' },
            }),
        });
    });

    it('identifies browser, device and referrer correctly', () => {
        expect(browserName('Mozilla/5.0 ... Firefox/115.0')).toBe('Firefox');
        expect(deviceName('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)')).toBe('Mobile');
        expect(referrerName('https://twitter.com/feed')).toBe('twitter.com');
    });

    it('does not record visit if consent is denied', async () => {
        storage['mezz_consent_v1'] = 'denied';
        const visit = await recordVisit({ page: '/test' });
        expect(visit).toBeNull();
        expect(getVisits()).toHaveLength(0);
    });

    it('records visit when consent is granted and enriches with server IP and geo data', async () => {
        const visit = await recordVisit({ page: '/portfolio' });
        expect(visit).not.toBeNull();
        expect(visit.page).toBe('/portfolio');

        const visits = getVisits();
        expect(visits).toHaveLength(1);
        expect(visits[0].ip).toBe('198.51.100.25');
        expect(visits[0].city).toBe('Bordeaux');
        expect(visits[0].country).toBe('FR');
    });

    it('filters out visits older than 365 days (retention policy)', () => {
        const now = Date.now();
        const freshVisit = {
            id: 'v-1',
            visitor: 'vis-1',
            at: new Date(now - 10 * 86400 * 1000).toISOString(),
            page: '/',
            ip: '1.1.1.1',
            city: 'Paris',
            country: 'FR',
            browser: 'Chrome',
            device: 'Desktop',
            referrer: 'Direct',
        };
        const expiredVisit = {
            id: 'v-2',
            visitor: 'vis-2',
            at: new Date(now - 370 * 86400 * 1000).toISOString(),
            page: '/old',
            ip: '2.2.2.2',
            city: 'Marseille',
            country: 'FR',
            browser: 'Firefox',
            device: 'Mobile',
            referrer: 'Direct',
        };

        storage['mezz_analytics_visits_v1'] = JSON.stringify([freshVisit, expiredVisit]);

        const validVisits = getVisits();
        expect(validVisits).toHaveLength(1);
        expect(validVisits[0].id).toBe('v-1');
    });

    it('builds aggregated stats correctly for 365 days', () => {
        const now = new Date();
        const testVisits = [
            {
                id: '1',
                visitor: 'user-a',
                at: now.toISOString(),
                page: '/',
                ip: '198.51.100.1',
                city: 'Paris',
                country: 'FR',
                browser: 'Chrome',
                device: 'Desktop',
                referrer: 'Direct',
            },
            {
                id: '2',
                visitor: 'user-b',
                at: now.toISOString(),
                page: '/dashboard/',
                ip: '198.51.100.2',
                city: 'Lyon',
                country: 'FR',
                browser: 'Firefox',
                device: 'Mobile',
                referrer: 'google.com',
            },
        ];

        const stats = buildStats(365, testVisits);
        expect(stats.total).toBe(2);
        expect(stats.unique).toBe(2);
        expect(stats.recent).toHaveLength(2);
        expect(stats.recent[0]).toHaveProperty('ip');
        expect(stats.recent[0]).toHaveProperty('city');
        expect(stats.recent[0]).toHaveProperty('country');
    });

    it('exports CSV containing all required 8 visit fields', () => {
        const visits = [
            {
                id: '1',
                visitor: 'vis-123',
                at: '2026-07-29T10:00:00.000Z',
                page: '/',
                ip: '203.0.113.50',
                city: 'Toulouse',
                country: 'FR',
                browser: 'Safari',
                device: 'Mobile',
                referrer: 'instagram.com',
            },
        ];

        const csv = exportVisitsCsv(visits);
        expect(csv).toContain('"date","page","ip","ville","pays","navigateur","appareil","provenance","visiteur"');
        expect(csv).toContain('"2026-07-29T10:00:00.000Z"');
        expect(csv).toContain('"/"');
        expect(csv).toContain('"203.0.113.50"');
        expect(csv).toContain('"Toulouse"');
        expect(csv).toContain('"FR"');
        expect(csv).toContain('"Safari"');
        expect(csv).toContain('"Mobile"');
        expect(csv).toContain('"instagram.com"');
    });
});
