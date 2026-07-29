import { describe, expect, it, vi } from 'vitest';
import worker, {
    cleanupOldVisits,
    getClientGeo,
    getClientIp,
    getCutoffDate,
    parseBrowser,
    parseDevice,
    parseReferrer,
} from '../src/worker.js';

describe('Cloudflare Worker Analytics Helper Functions', () => {
    it('parses browser correctly from User-Agent', () => {
        expect(parseBrowser('Mozilla/5.0 ... Chrome/118.0.0.0 Safari/537.36')).toBe('Chrome');
        expect(parseBrowser('Mozilla/5.0 ... Firefox/119.0')).toBe('Firefox');
        expect(parseBrowser('Mozilla/5.0 ... Edg/118.0.2088.76')).toBe('Edge');
        expect(parseBrowser('Mozilla/5.0 ... Version/17.0 Safari/605.1.15')).toBe('Safari');
        expect(parseBrowser('UnknownBot/1.0')).toBe('Autre');
    });

    it('parses device correctly from User-Agent', () => {
        expect(parseDevice('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)')).toBe('Mobile');
        expect(parseDevice('Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)')).toBe('Tablette');
        expect(parseDevice('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe('Desktop');
    });

    it('parses referrer domain correctly', () => {
        expect(parseReferrer('https://google.com/search?q=mezz', 'https://mezz.dev')).toBe('google.com');
        expect(parseReferrer('https://mezz.dev/about', 'https://mezz.dev')).toBe('Interne');
        expect(parseReferrer('', 'https://mezz.dev')).toBe('Direct');
    });

    it('extracts client IP address correctly', () => {
        const reqWithCfIp = new Request('https://mezz.dev/api/visits', {
            headers: { 'cf-connecting-ip': '203.0.113.195' },
        });
        expect(getClientIp(reqWithCfIp)).toBe('203.0.113.195');

        const reqWithXForwardedFor = new Request('https://mezz.dev/api/visits', {
            headers: { 'x-forwarded-for': '198.51.100.42, 10.0.0.1' },
        });
        expect(getClientIp(reqWithXForwardedFor)).toBe('198.51.100.42');
    });

    it('extracts client geo location (city and country)', () => {
        const req = new Request('https://mezz.dev/api/visits', {
            headers: { 'cf-ipcity': 'Paris', 'cf-ipcountry': 'FR' },
        });
        expect(getClientGeo(req)).toEqual({ city: 'Paris', country: 'FR' });
    });

    it('calculates 365-day cutoff date correctly', () => {
        const cutoff = getCutoffDate(365);
        const cutoffTime = new Date(cutoff).getTime();
        const now = Date.now();
        const diffDays = Math.round((now - cutoffTime) / (1000 * 60 * 60 * 24));
        expect(diffDays).toBe(365);
    });
});

describe('Cloudflare Worker Fetch Handler', () => {
    it('handles OPTIONS preflight CORS request', async () => {
        const req = new Request('https://mezz.dev/api/visits', { method: 'OPTIONS' });
        const res = await worker.fetch(req, {}, {});
        expect(res.status).toBe(204);
        expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });

    it('stores visit via POST /api/visits into D1', async () => {
        const prepareMock = vi.fn().mockReturnValue({
            bind: vi.fn().mockReturnValue({
                run: vi.fn().mockResolvedValue({ success: true }),
            }),
        });

        const mockEnv = { DB: { prepare: prepareMock } };
        const req = new Request('https://mezz.dev/api/visits', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'cf-connecting-ip': '198.51.100.10',
                'cf-ipcity': 'Lyon',
                'cf-ipcountry': 'FR',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/118.0.0.0',
            },
            body: JSON.stringify({
                page: '/dashboard/',
                referrer: 'https://google.com',
            }),
        });

        const res = await worker.fetch(req, mockEnv, {});
        expect(res.status).toBe(201);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.visit.ip).toBe('198.51.100.10');
        expect(data.visit.city).toBe('Lyon');
        expect(data.visit.country).toBe('FR');
        expect(data.visit.page).toBe('/dashboard/');
    });

    it('retrieves visits via GET /api/visits from D1', async () => {
        const mockVisits = [
            {
                id: '1',
                visitor: 'visitor-1',
                at: new Date().toISOString(),
                page: '/',
                ip: '198.51.100.10',
                city: 'Paris',
                country: 'FR',
                browser: 'Chrome',
                device: 'Desktop',
                referrer: 'Direct',
            },
        ];

        const mockEnv = {
            DB: {
                prepare: vi.fn().mockReturnValue({
                    bind: vi.fn().mockReturnValue({
                        all: vi.fn().mockResolvedValue({ results: mockVisits }),
                        run: vi.fn().mockResolvedValue({ meta: { changes: 0 } }),
                    }),
                }),
            },
        };

        const req = new Request('https://mezz.dev/api/visits?days=30', { method: 'GET' });
        const res = await worker.fetch(req, mockEnv, {});
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.visits).toHaveLength(1);
        expect(data.visits[0].ip).toBe('198.51.100.10');
        expect(data.visits[0].city).toBe('Paris');
    });

    it('cleans up visits older than 365 days on retention trigger', async () => {
        const runMock = vi.fn().mockResolvedValue({ meta: { changes: 12 } });
        const bindMock = vi.fn().mockReturnValue({ run: runMock });
        const prepareMock = vi.fn().mockReturnValue({ bind: bindMock });
        const mockEnv = { DB: { prepare: prepareMock } };

        const deletedCount = await cleanupOldVisits(mockEnv.DB);
        expect(deletedCount).toBe(12);
        expect(prepareMock).toHaveBeenCalledWith('DELETE FROM visits WHERE created_at < ?');
    });
});
