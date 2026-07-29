import { getConsent } from './consent.js';

const VISITS_KEY = 'mezz_analytics_visits_v1';
const VISITOR_KEY = 'mezz_analytics_visitor_v1';
const REVIEWS_KEY = 'mezz_reviews_v1';
const MAX_VISITS = 5000;
const RETENTION_MS = 365 * 24 * 60 * 60 * 1000; // 365 jours de rétention

function readJson(key, fallback) {
    try {
        const value = JSON.parse(localStorage.getItem(key) ?? 'null');
        return value ?? fallback;
    } catch {
        return fallback;
    }
}

function writeJson(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch {
        return false;
    }
}

function createId() {
    return window.crypto?.randomUUID?.()
        ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function browserName(userAgent = (typeof navigator !== 'undefined' ? navigator.userAgent : '')) {
    if (/Edg\//i.test(userAgent)) return 'Edge';
    if (/Firefox\//i.test(userAgent)) return 'Firefox';
    if (/Chrome\//i.test(userAgent) && !/Edg\//i.test(userAgent)) return 'Chrome';
    if (/Safari\//i.test(userAgent) && !/Chrome\//i.test(userAgent)) return 'Safari';
    return 'Autre';
}

export function deviceName(userAgent = (typeof navigator !== 'undefined' ? navigator.userAgent : '')) {
    if (/iPad|Tablet/i.test(userAgent)) return 'Tablette';
    return /Mobi|Android|iPhone/i.test(userAgent) ? 'Mobile' : 'Desktop';
}

export function referrerName(referrer = (typeof document !== 'undefined' ? document.referrer : '')) {
    if (!referrer) return 'Direct';

    try {
        const url = new URL(referrer);
        const currentOrigin = typeof window !== 'undefined' && window.location && window.location.origin ? window.location.origin : '';
        if (currentOrigin && url.origin === currentOrigin) return 'Interne';
        return url.hostname.replace(/^www\./, '') || 'Direct';
    } catch {
        return 'Direct';
    }
}

function visitorId() {
    let id;
    try {
        id = localStorage.getItem(VISITOR_KEY);
    } catch {
        id = null;
    }

    if (!id) {
        id = createId();
        try {
            localStorage.setItem(VISITOR_KEY, id);
        } catch {
            // Le stockage peut être bloqué en navigation privée stricte.
        }
    }
    return id;
}

export function getVisits() {
    const visits = readJson(VISITS_KEY, []);
    if (!Array.isArray(visits)) return [];

    const now = Date.now();
    const cutoff = now - RETENTION_MS;

    return visits.filter((visit) => {
        if (!visit || typeof visit.at !== 'string') return false;
        const time = new Date(visit.at).getTime();
        return !Number.isNaN(time) && time >= cutoff;
    });
}

export async function recordVisit({
    page = window.location.pathname,
    referrer = document.referrer,
    userAgent = navigator.userAgent,
    workerUrl = 'https://mezzmonteur-analytics.mezzmonteur.workers.dev/api/visits',
} = {}) {
    if (getConsent() === 'denied') return null;

    const visits = getVisits();
    const visit = {
        id: createId(),
        visitor: visitorId(),
        at: new Date().toISOString(),
        page: String(page || '/').slice(0, 160),
        ip: '127.0.0.1',
        city: 'Inconnu',
        country: 'Inconnu',
        browser: browserName(userAgent),
        device: deviceName(userAgent),
        referrer: referrerName(referrer),
    };

    visits.push(visit);
    writeJson(VISITS_KEY, visits.slice(-MAX_VISITS));

    // Synchronisation vers Cloudflare Worker + D1
    try {
        const response = await fetch(workerUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: visit.id,
                visitor: visit.visitor,
                at: visit.at,
                page: visit.page,
                browser: visit.browser,
                device: visit.device,
                referrer: visit.referrer,
                raw_referrer: referrer,
            }),
        });

        if (response.ok) {
            const data = await response.json();
            if (data?.visit) {
                visit.ip = data.visit.ip || visit.ip;
                visit.city = data.visit.city || visit.city;
                visit.country = data.visit.country || visit.country;

                // Mise à jour de la visite locale avec les données géo/IP du Worker
                const currentVisits = getVisits();
                if (currentVisits.length > 0) {
                    currentVisits[currentVisits.length - 1] = visit;
                    writeJson(VISITS_KEY, currentVisits.slice(-MAX_VISITS));
                }
            }
        }
    } catch {
        // Mode hors-ligne ou fallback local
    }

    return visit;
}

export async function fetchVisitsFromWorker(days = 30, workerUrl = 'https://mezzmonteur-analytics.mezzmonteur.workers.dev/api/visits') {
    try {
        const response = await fetch(`${workerUrl}?days=${encodeURIComponent(days)}`);
        if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data.visits)) {
                return data.visits;
            }
        }
    } catch {
        // En cas d'erreur réseau, fallback sur les données locales
    }
    return null;
}

function localDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function aggregate(items, getter) {
    const counts = new Map();
    items.forEach((item) => {
        const label = getter(item) || 'Autre';
        counts.set(label, (counts.get(label) ?? 0) + 1);
    });

    return [...counts.entries()]
        .map(([label, value]) => ({ label, value }))
        .sort((left, right) => right.value - left.value);
}

function formatVisit(visit) {
    const date = new Date(visit.at);
    return {
        ...visit,
        date: date.toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).replace(',', ''),
        ip: visit.ip || '127.0.0.1',
        city: visit.city || 'Inconnu',
        country: visit.country || 'Inconnu',
    };
}

export function buildStats(days = 30, customVisits = null) {
    const validPeriods = [7, 30, 90, 365];
    const safeDays = validPeriods.includes(Number(days)) ? Number(days) : 30;
    const visits = Array.isArray(customVisits) ? customVisits : getVisits();

    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - safeDays + 1);

    const previousStart = new Date(start);
    previousStart.setDate(previousStart.getDate() - safeDays);

    const periodVisits = visits.filter((visit) => new Date(visit.at) >= start);
    const previousVisits = visits.filter((visit) => {
        const date = new Date(visit.at);
        return date >= previousStart && date < start;
    });

    const labels = [];
    const dailyCounts = new Map();
    periodVisits.forEach((visit) => {
        const key = localDateKey(new Date(visit.at));
        dailyCounts.set(key, (dailyCounts.get(key) ?? 0) + 1);
    });

    for (let offset = 0; offset < safeDays; offset += 1) {
        const date = new Date(start);
        date.setDate(start.getDate() + offset);
        const key = localDateKey(date);
        labels.push({
            key,
            label: date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
        });
    }

    const todayKey = localDateKey(now);
    const currentCount = periodVisits.length;
    const previousCount = previousVisits.length;
    const trend = previousCount === 0
        ? (currentCount > 0 ? 100 : 0)
        : Math.round(((currentCount - previousCount) / previousCount) * 100);

    const activeSince = Date.now() - 5 * 60 * 1000;
    const activeVisitors = new Set(
        visits
            .filter((visit) => new Date(visit.at).getTime() >= activeSince)
            .map((visit) => visit.visitor),
    );

    const hours = Array.from({ length: 24 }, () => 0);
    periodVisits.forEach((visit) => {
        hours[new Date(visit.at).getHours()] += 1;
    });

    return {
        total: currentCount,
        today: visits.filter((visit) => localDateKey(new Date(visit.at)) === todayKey).length,
        unique: new Set(periodVisits.map((visit) => visit.visitor)).size,
        avg: Number((currentCount / safeDays).toFixed(1)),
        active: activeVisitors.size,
        trend,
        labels: labels.map((item) => item.label),
        lineCounts: labels.map((item) => dailyCounts.get(item.key) ?? 0),
        pages: aggregate(periodVisits, (visit) => visit.page),
        browsers: aggregate(periodVisits, (visit) => visit.browser),
        devices: aggregate(periodVisits, (visit) => visit.device),
        referrers: aggregate(periodVisits, (visit) => visit.referrer),
        hours,
        recent: [...periodVisits]
            .sort((left, right) => new Date(right.at) - new Date(left.at))
            .slice(0, 100)
            .map(formatVisit),
    };
}

export function resetVisits() {
    try {
        localStorage.removeItem(VISITS_KEY);
        fetch('fetch(
    'https://mezzmonteur-analytics.mezzmonteur.workers.dev/api/visits',
    { method: 'DELETE' }
).catch(() => {});', { method: 'DELETE' }).catch(() => {});
        return true;
    } catch {
        return false;
    }
}

export function getReviews() {
    const reviews = readJson(REVIEWS_KEY, []);
    return Array.isArray(reviews) ? reviews : [];
}

export function saveReviews(reviews) {
    return writeJson(REVIEWS_KEY, reviews);
}

export function exportVisitsCsv(customVisits = null) {
    const columns = ['date', 'page', 'ip', 'ville', 'pays', 'navigateur', 'appareil', 'provenance', 'visiteur'];
    const escape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const visits = Array.isArray(customVisits) ? customVisits : getVisits();
    const rows = visits.map((visit) => [
        visit.at,
        visit.page,
        visit.ip || '127.0.0.1',
        visit.city || 'Inconnu',
        visit.country || 'Inconnu',
        visit.browser,
        visit.device,
        visit.referrer,
        visit.visitor,
    ]);

    return [columns, ...rows].map((row) => row.map(escape).join(',')).join('\n');
}
