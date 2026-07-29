import { clearSession, getSession } from './auth.js';
import {
    buildStats,
    exportVisitsCsv,
    fetchVisitsFromWorker,
    getReviews,
    resetVisits,
    saveReviews,
} from './analytics-store.js';

if (!getSession()) {
    const next = `${window.location.pathname}${window.location.search}`;
    window.location.replace(`/login/?next=${encodeURIComponent(next)}`);
} else {
    document.documentElement.classList.add('auth-ready');
    initialiseDashboard();
}

function initialiseDashboard() {
    const charts = new Map();
    const refreshDelay = 30_000;
    let refreshTimer;
    let cachedVisits = null;

    const dateElement = document.getElementById('dashboard-date');
    const periodSelect = document.getElementById('period');
    const resetButton = document.getElementById('reset-data');
    const exportButton = document.getElementById('export-data');
    const logoutButton = document.getElementById('logout');

    dateElement.textContent = new Date().toLocaleDateString('fr-FR', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });

    if (typeof window.Chart === 'function') {
        window.Chart.defaults.color = '#666';
        window.Chart.defaults.font.family = "'Inter', system-ui, sans-serif";
    }

    function scheduleRefresh() {
        window.clearTimeout(refreshTimer);
        refreshTimer = window.setTimeout(() => {
            renderStatistics();
            scheduleRefresh();
        }, refreshDelay);
    }

    function setMetric(id, value) {
        const element = document.getElementById(id);
        if (element) element.textContent = new Intl.NumberFormat('fr-FR').format(value);
    }

    function destroyChart(id) {
        const chart = charts.get(id);
        if (chart) chart.destroy();
        charts.delete(id);
    }

    function createChart(id, config) {
        destroyChart(id);
        if (typeof window.Chart !== 'function') return;

        const canvas = document.getElementById(id);
        if (!canvas) return;
        charts.set(id, new window.Chart(canvas.getContext('2d'), config));
    }

    function lineChart(labels, values) {
        const canvas = document.getElementById('visits-chart');
        if (!canvas) return;
        const context = canvas.getContext('2d');
        const gradient = context.createLinearGradient(0, 0, 0, 260);
        gradient.addColorStop(0, 'rgba(255,255,255,0.11)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');

        createChart('visits-chart', {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    data: values,
                    label: 'Visites',
                    borderColor: '#fff',
                    backgroundColor: gradient,
                    borderWidth: 1.5,
                    fill: true,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#050505',
                    pointBorderWidth: 1,
                    pointHoverRadius: 5,
                    pointRadius: values.length > 30 ? 0 : 3,
                    tension: 0.32,
                }],
            },
            options: cartesianOptions({ maxXTicks: 9 }),
        });
    }

    function pagesChart(items) {
        const topItems = items.slice(0, 6);
        createChart('pages-chart', {
            type: 'bar',
            data: {
                labels: topItems.map((item) => item.label || '/'),
                datasets: [{
                    data: topItems.map((item) => item.value),
                    label: 'Vues',
                    backgroundColor: '#f5f5f5',
                    borderRadius: 3,
                    borderSkipped: false,
                }],
            },
            options: cartesianOptions({ horizontal: true, maxXTicks: 6 }),
        });
    }

    function doughnutChart(id, items, colors = ['#fff', '#aaa', '#666', '#3d3d3d', '#222']) {
        const hasData = items.length > 0;
        const data = hasData ? items.slice(0, 5) : [{ label: 'Aucune donnée', value: 1 }];
        createChart(id, {
            type: 'doughnut',
            data: {
                labels: data.map((item) => item.label),
                datasets: [{
                    data: data.map((item) => item.value),
                    backgroundColor: hasData ? colors.slice(0, data.length) : ['#1c1c1c'],
                    borderWidth: 0,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { boxHeight: 8, boxWidth: 8, color: '#6f6f6f', font: { size: 9 }, padding: 9 },
                    },
                    tooltip: tooltipOptions(),
                },
            },
        });
    }

    function hoursChart(values) {
        createChart('hours-chart', {
            type: 'bar',
            data: {
                labels: Array.from({ length: 24 }, (_, hour) => `${hour}h`),
                datasets: [{
                    data: values,
                    label: 'Visites',
                    backgroundColor: values.map((_, hour) => (
                        hour >= 8 && hour <= 20 ? '#eee' : '#2a2a2a'
                    )),
                    borderRadius: 2,
                    borderSkipped: false,
                }],
            },
            options: {
                ...cartesianOptions({ maxXTicks: 12 }),
                plugins: { legend: { display: false }, tooltip: tooltipOptions() },
            },
        });
    }

    function tooltipOptions() {
        return {
            backgroundColor: '#fff',
            bodyColor: '#222',
            cornerRadius: 6,
            padding: 9,
            titleColor: '#000',
        };
    }

    function cartesianOptions({ horizontal = false, maxXTicks = 8 } = {}) {
        return {
            indexAxis: horizontal ? 'y' : 'x',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: tooltipOptions() },
            scales: {
                x: {
                    beginAtZero: true,
                    grid: { color: horizontal ? 'rgba(255,255,255,0.045)' : 'transparent' },
                    ticks: { color: '#5f5f5f', font: { size: 9 }, maxTicksLimit: maxXTicks, precision: 0 },
                },
                y: {
                    beginAtZero: true,
                    grid: { color: horizontal ? 'transparent' : 'rgba(255,255,255,0.045)' },
                    ticks: { color: '#5f5f5f', font: { size: 9 }, precision: 0 },
                },
            },
        };
    }

    function renderRecent(visits) {
        const tableBody = document.getElementById('recent-visits');
        const count = document.getElementById('recent-count');
        if (!tableBody) return;
        tableBody.replaceChildren();
        if (count) count.textContent = `${visits.length} entrée${visits.length > 1 ? 's' : ''}`;

        if (visits.length === 0) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.className = 'table-empty';
            cell.colSpan = 8;
            cell.textContent = 'Aucune visite enregistrée pour cette période.';
            row.append(cell);
            tableBody.append(row);
            return;
        }

        visits.forEach((visit) => {
            const row = document.createElement('tr');
            [
                visit.date,
                visit.page,
                visit.ip || '—',
                visit.city || '—',
                visit.country || '—',
                visit.browser,
                visit.device,
                visit.referrer,
            ].forEach((value) => {
                const cell = document.createElement('td');
                cell.textContent = value || '—';
                row.append(cell);
            });
            tableBody.append(row);
        });
    }

    async function renderStatistics() {
        const days = Number(periodSelect.value);
        const workerVisits = await fetchVisitsFromWorker(days);
        cachedVisits = workerVisits;

        const stats = buildStats(days, workerVisits);
        setMetric('metric-total', stats.total);
        setMetric('metric-today', stats.today);
        setMetric('metric-unique', stats.unique);
        setMetric('metric-average', stats.avg);
        setMetric('metric-active', stats.active);

        const trend = document.getElementById('metric-trend');
        if (trend) {
            trend.textContent = `${stats.trend >= 0 ? '+' : ''}${stats.trend}%`;
            trend.classList.toggle('is-negative', stats.trend < 0);
        }

        lineChart(stats.labels, stats.lineCounts);
        pagesChart(stats.pages);
        doughnutChart('browsers-chart', stats.browsers);
        doughnutChart('devices-chart', stats.devices, ['#fff', '#777', '#333']);
        doughnutChart('referrers-chart', stats.referrers);
        hoursChart(stats.hours);
        renderRecent(stats.recent);
    }

    function renderReviews() {
        const container = document.getElementById('review-list');
        if (!container) return;
        const reviews = getReviews();
        container.replaceChildren();

        if (reviews.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'empty-card';
            empty.textContent = 'Aucun avis enregistré pour le moment.';
            container.append(empty);
            return;
        }

        reviews.forEach((review) => {
            const card = document.createElement('article');
            card.className = 'review-card';

            const header = document.createElement('div');
            header.className = 'review-header';
            const identity = document.createElement('div');
            const username = document.createElement('span');
            username.className = 'review-user';
            username.textContent = review.username || 'Anonyme';
            const metadata = document.createElement('span');
            metadata.className = 'review-meta';
            metadata.textContent = ` · ${review.created_at || ''}`;
            identity.append(username, metadata);
            const stars = document.createElement('div');
            stars.className = 'review-stars';
            stars.setAttribute('aria-label', `${review.rating || 0} étoiles sur 5`);
            stars.textContent = `${'★'.repeat(review.rating || 0)}${'☆'.repeat(5 - (review.rating || 0))}`;
            header.append(identity, stars);

            const content = document.createElement('p');
            content.className = 'review-content';
            content.textContent = review.content || '';
            card.append(header, content);

            if (review.reply) {
                const reply = document.createElement('div');
                reply.className = 'review-reply';
                reply.textContent = `Mezz — ${review.reply}`;
                card.append(reply);
            }

            const actions = document.createElement('div');
            actions.className = 'review-actions';
            const input = document.createElement('input');
            input.type = 'text';
            input.value = review.reply || '';
            input.placeholder = 'Répondre…';
            input.setAttribute('aria-label', `Réponse à ${review.username || 'cet avis'}`);
            const replyButton = document.createElement('button');
            replyButton.className = 'control';
            replyButton.type = 'button';
            replyButton.textContent = 'Répondre';
            replyButton.addEventListener('click', () => {
                review.reply = input.value.trim();
                review.replied_at = new Date().toLocaleDateString('fr-FR');
                saveReviews(reviews);
                renderReviews();
            });
            const deleteButton = document.createElement('button');
            deleteButton.className = 'control danger';
            deleteButton.type = 'button';
            deleteButton.textContent = 'Supprimer';
            deleteButton.addEventListener('click', () => {
                if (!window.confirm('Supprimer cet avis ?')) return;
                saveReviews(reviews.filter((item) => item.id !== review.id));
                renderReviews();
            });
            actions.append(input, replyButton, deleteButton);
            card.append(actions);
            container.append(card);
        });
    }

    document.querySelectorAll('[data-tab]').forEach((button) => {
        button.addEventListener('click', (event) => {
            event.preventDefault();
            const selectedTab = button.dataset.tab;
            document.querySelectorAll('[data-tab]').forEach((item) => {
                const active = item.dataset.tab === selectedTab;
                item.classList.toggle('is-active', active);
                item.setAttribute('aria-selected', String(active));
            });
            document.querySelectorAll('.tab-panel').forEach((panel) => {
                panel.hidden = panel.dataset.panel !== selectedTab;
            });
            if (selectedTab === 'reviews') renderReviews();
        });
    });

    if (periodSelect) {
        periodSelect.addEventListener('change', () => {
            renderStatistics();
            scheduleRefresh();
        });
    }

    if (resetButton) {
        resetButton.addEventListener('click', () => {
            if (!window.confirm('Réinitialiser toutes les statistiques locales et distantes ?')) return;
            resetVisits();
            renderStatistics();
        });
    }

    if (exportButton) {
        exportButton.addEventListener('click', () => {
            const csv = exportVisitsCsv(cachedVisits);
            const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `mezz-visites-${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.append(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            clearSession();
            window.location.replace('/login/?logout=1');
        });
    }

    renderStatistics();
    scheduleRefresh();
}
