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
            var x = new XMLHttpRequest();
            x.open('POST', '/api/visit', true);
            x.setRequestHeader('Content-Type', 'application/json');
            x.send(JSON.stringify({
                page: window.location.pathname,
                browser: browser,
                device: device,
                referrer: document.referrer || 'direct'
            }));
        } catch(e) {
            if (debugTrack) console.log('track error', e)
        }
    }

    if (document.readyState === 'complete') send();
    else window.addEventListener('load', send);
})();
