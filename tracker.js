(function() {
    var ua = navigator.userAgent;
    var browser = 'Autre';
    if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
    else if (ua.includes('Edg')) browser = 'Edge';

    var device = /Mobi|Android/i.test(ua) ? 'Mobile' : 'Desktop';

    var debugTrack = true;

    function send() {
        try {
            var visits = JSON.parse(localStorage.getItem('mezz_visits') || '[]');
            visits.push({
                timestamp: new Date().toISOString(),
                page: window.location.pathname,
                browser: browser,
                device: device,
                referrer: document.referrer || 'direct'
            });
            if (visits.length > 10000) visits = visits.slice(-5000);
            localStorage.setItem('mezz_visits', JSON.stringify(visits));
        } catch(e) {
            if (debugTrack) console.log('track error', e)
        }
    }

    if (document.readyState === 'complete') send();
    else window.addEventListener('load', send);
})();
