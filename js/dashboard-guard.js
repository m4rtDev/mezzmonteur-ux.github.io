(() => {
    const sessionKey = 'mezz_admin_session_v1';

    try {
        const session = JSON.parse(sessionStorage.getItem(sessionKey) ?? 'null');
        const valid = session
            && session.source === 'login'
            && Number.isFinite(session.createdAt)
            && Number.isFinite(session.expiresAt)
            && session.createdAt <= Date.now()
            && session.expiresAt > Date.now();

        if (!valid) {
            sessionStorage.removeItem(sessionKey);
            const next = `${window.location.pathname}${window.location.search}`;
            window.location.replace(`/login/?next=${encodeURIComponent(next)}`);
            return;
        }

        document.documentElement.classList.add('auth-ready');
    } catch {
        window.location.replace('/login/?next=%2Fdashboard%2F');
    }
})();
