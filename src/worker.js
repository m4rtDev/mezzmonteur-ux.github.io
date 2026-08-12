/**
 * Cloudflare Worker for Mezzmonteur Analytics with D1 database
 * Stores visit date, page, full IP address, city, country, browser, device, and referrer.
 * Enforces a 365-day data retention policy.
 */

const RETENTION_DAYS = 365;
const MAX_PAGE_LENGTH = 160;

function safeText(value, fallback, maxLength = 120) {
    if (typeof value !== 'string') return fallback;
    const text = value.trim().replace(/[\u0000-\u001F\u007F]/g, ' ');
    return text ? text.slice(0, maxLength) : fallback;
}

export function parseBrowser(userAgent = '') {
    if (/Edg\//i.test(userAgent)) return 'Edge';
    if (/Firefox\//i.test(userAgent)) return 'Firefox';
    if (/Chrome\//i.test(userAgent) && !/Edg\//i.test(userAgent)) return 'Chrome';
    if (/Safari\//i.test(userAgent) && !/Chrome\//i.test(userAgent)) return 'Safari';
    return 'Autre';
}

export function parseDevice(userAgent = '') {
    if (/iPad|Tablet/i.test(userAgent)) return 'Tablette';
    if (/Android/i.test(userAgent) && !/Mobi/i.test(userAgent)) return 'Tablette';
    if (/Mobi|Android|iPhone/i.test(userAgent)) return 'Mobile';
    return 'Desktop';
}

export function parseReferrer(referrer = '', origin = '') {
    if (!referrer) return 'Direct';
    try {
        const url = new URL(referrer);
        if (origin && url.origin === origin) return 'Interne';
        return url.hostname.replace(/^www\./, '') || 'Direct';
    } catch {
        return 'Direct';
    }
}

export function getClientIp(request) {
    return request.headers.get('cf-connecting-ip')
        || request.headers.get('x-real-ip')
        || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || '127.0.0.1';
}

export function getClientGeo(request) {
    const city = request.cf?.city || request.headers.get('cf-ipcity') || 'Inconnu';
    const country = request.cf?.country || request.headers.get('cf-ipcountry') || 'Inconnu';
    return { city, country };
}

export function getCorsHeaders(request) {
    const origin = request?.headers?.get('Origin');
    const allowedOrigins = new Set([
        'https://mezzmonteur.com',
        'https://www.mezzmonteur.com',
        'https://mezzmonteur-ux.github.io',
        'http://localhost:8787',
    ]);
    const headers = {
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
    };
    if (!origin) headers['Access-Control-Allow-Origin'] = '*';
    else if (allowedOrigins.has(origin)) headers['Access-Control-Allow-Origin'] = origin;
    return headers;
}

export function getCutoffDate(days = RETENTION_DAYS) {
    const safeDays = Math.min(Math.max(1, Number(days) || RETENTION_DAYS), RETENTION_DAYS);
    return new Date(Date.now() - safeDays * 24 * 60 * 60 * 1000).toISOString();
}

export function getRequestedDays(value, fallback = 30) {
    const days = Number(value);
    if (!Number.isFinite(days)) return fallback;
    return Math.min(Math.max(1, Math.floor(days)), RETENTION_DAYS);
}

export async function cleanupOldVisits(db) {
    if (!db) return 0;
    const cutoff = getCutoffDate(RETENTION_DAYS);
    const result = await db.prepare('DELETE FROM visits WHERE created_at < ?').bind(cutoff).run();
    return result?.meta?.changes || 0;
}

export default {
    async fetch(request, env, ctx) {
        const corsHeaders = getCorsHeaders(request);

        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: corsHeaders });
        }

        const url = new URL(request.url);
        const path = url.pathname;

        try {
            // Track visit endpoint
            if (path === '/api/visits' && request.method === 'POST') {
                const parsedBody = await request.json().catch(() => ({}));
                const body = parsedBody && typeof parsedBody === 'object' && !Array.isArray(parsedBody)
                    ? parsedBody
                    : {};
                const userAgent = request.headers.get('user-agent') || '';
                const origin = request.headers.get('origin') || '';

                const ip = getClientIp(request);
                const { city, country } = getClientGeo(request);

                const visit = {
                    id: body.id || crypto.randomUUID(),
                    visitor_id: safeText(body.visitor || body.visitor_id, crypto.randomUUID(), 120),
                    created_at: new Date().toISOString(),
                    page: safeText(body.page, '/', MAX_PAGE_LENGTH),
                    ip: safeText(ip, '127.0.0.1', 64),
                    city: safeText(city, 'Inconnu', 120),
                    country: safeText(country, 'Inconnu', 120),
                    browser: parseBrowser(userAgent),
                    device: parseDevice(userAgent),
                    referrer: parseReferrer(body.raw_referrer || body.referrer || request.headers.get('referer'), origin),
                };

                if (env?.DB) {
                    await env.DB.prepare(`
                        INSERT INTO visits (id, visitor_id, created_at, page, ip, city, country, browser, device, referrer)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `).bind(
                        visit.id,
                        visit.visitor_id,
                        visit.created_at,
                        visit.page,
                        visit.ip,
                        visit.city,
                        visit.country,
                        visit.browser,
                        visit.device,
                        visit.referrer,
                    ).run();

                    // Asynchronously clean up records older than 365 days
                    if (ctx?.waitUntil) {
                        ctx.waitUntil(cleanupOldVisits(env.DB));
                    }
                }

                return new Response(JSON.stringify({ success: true, visit }), {
                    status: 201,
                    headers: { 'Content-Type': 'application/json', ...corsHeaders },
                });
            }

            // Get visits endpoint
            if (path === '/api/visits' && request.method === 'GET') {
                const days = getRequestedDays(url.searchParams.get('days'));
                const cutoff = getCutoffDate(days);

                let visits = [];
                if (env?.DB) {
                    // Clean up visits older than 365 days
                    await cleanupOldVisits(env.DB);

                    const { results } = await env.DB.prepare(`
                        SELECT
                            id,
                            visitor_id as visitor,
                            created_at as at,
                            page,
                            ip,
                            city,
                            country,
                            browser,
                            device,
                            referrer
                        FROM visits
                        WHERE created_at >= ?
                        ORDER BY created_at DESC
                        LIMIT 5000
                    `).bind(cutoff).all();

                    visits = results || [];
                }

                return new Response(JSON.stringify({ success: true, visits, days }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json', ...corsHeaders },
                });
            }

            // Delete / Reset visits endpoint
            if (path === '/api/visits' && request.method === 'DELETE') {
                if (env?.DB) {
                    await env.DB.prepare('DELETE FROM visits').run();
                }
                return new Response(JSON.stringify({ success: true, message: 'Statistiques réinitialisées' }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json', ...corsHeaders },
                });
            }

            return new Response(JSON.stringify({ error: 'Endpoint non trouvé' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json', ...corsHeaders },
            });
        } catch (error) {
            console.error(error);
            return new Response(JSON.stringify({ error: 'Erreur serveur' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json', ...corsHeaders },
            });
        }
    },

    // Daily Cron Trigger for 365 days retention cleanup
    async scheduled(event, env, ctx) {
        if (env?.DB) {
            const deleted = await cleanupOldVisits(env.DB);
            console.log(`[Retention Job] Cleared ${deleted} visits older than ${RETENTION_DAYS} days.`);
        }
    },
};
