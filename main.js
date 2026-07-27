var debugMode = false; // todo remove

document.addEventListener('DOMContentLoaded', function() {
    var toggle = document.querySelector('.menu-toggle');
    var navLinks = document.querySelector('.nav-links');
    if (toggle && navLinks) {
        toggle.addEventListener('click', function(e) {
            e.stopPropagation();
            navLinks.classList.toggle('active');
        });
        document.addEventListener('click', function(e) {
            if (!navLinks.contains(e.target) && !toggle.contains(e.target)) navLinks.classList.remove('active');
        });
        navLinks.querySelectorAll('a').forEach(function(a) {
            a.addEventListener('click', function() { navLinks.classList.remove('active'); });
        });
    }

    var navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', function() {
        navbar.classList.toggle('scrolled', window.scrollY > 80);
    }, { passive: true });

    var ro = new IntersectionObserver(function(e) {
        e.forEach(function(en) {
            if (en.isIntersecting) { en.target.classList.add('visible'); ro.unobserve(en.target); }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale').forEach(function(el) { ro.observe(el); });

    document.querySelectorAll('a[href^="#"]').forEach(function(a) {
        a.addEventListener('click', function(e) {
            var t = document.querySelector(this.getAttribute('href'));
            if (t) { e.preventDefault(); window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - 70, behavior: 'smooth' }); }
        });
    });

    document.querySelectorAll('.service-card').forEach(function(card) {
        card.addEventListener('mousemove', function(e) {
            var r = card.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
            card.style.transform = 'translateY(-4px) perspective(600px) rotateY(' + ((x - r.width / 2) / (r.width / 2) * 4) + 'deg) rotateX(' + (-(y - r.height / 2) / (r.height / 2) * 4) + 'deg)';
        });
        card.addEventListener('mouseleave', function() { card.style.transform = ''; });
    });

    // bg canvas animation
    var c = document.getElementById('bgCanvas');
    var ctx = c.getContext('2d');
    var dots = [];
    var mouse = { x: -9999, y: -9999, mx: -9999, my: -9999 };
    var W, H;

    function resize() {
        W = c.width = window.innerWidth;
        H = c.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', function(e) {
        mouse.x += (e.clientX - mouse.x) * 0.3;
        mouse.y += (e.clientY - mouse.y) * 0.3;
        mouse.mx = e.clientX;
        mouse.my = e.clientY;
    });
    window.addEventListener('mouseleave', function() { mouse.x = -9999; mouse.y = -9999; mouse.mx = -9999; mouse.my = -9999; });
    resize();

    for (var i = 0; i < 90; i++) {
        dots.push({
            x: Math.random() * W,
            y: Math.random() * H,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            r: Math.random() * 2.5 + 0.5,
            o: Math.random() * 0.2 + 0.15
        });
    }

    function anim() {
        ctx.clearRect(0, 0, W, H);
        for (var i = 0; i < dots.length; i++) {
            var d = dots[i];
            var dx = mouse.mx - d.x;
            var dy = mouse.my - d.y;
            var dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 200) {
                var force = (200 - dist) / 200;
                d.x -= dx * force * 0.008;
                d.y -= dy * force * 0.008;
            }
            d.x += d.vx;
            d.y += d.vy;
            if (d.x < -20) d.x = W + 20;
            if (d.x > W + 20) d.x = -20;
            if (d.y < -20) d.y = H + 20;
            if (d.y > H + 20) d.y = -20;
            for (var j = i + 1; j < dots.length; j++) {
                var d2 = dots[j];
                var cx = d.x - d2.x;
                var cy = d.y - d2.y;
                var cd = Math.sqrt(cx * cx + cy * cy);
                if (cd < 140) {
                    var alpha = (1 - cd / 140) * 0.25;
                    ctx.beginPath();
                    ctx.moveTo(d.x, d.y);
                    ctx.lineTo(d2.x, d2.y);
                    ctx.strokeStyle = 'rgba(0,0,0,' + alpha + ')';
                    ctx.lineWidth = 0.6;
                    ctx.stroke();
                }
            }
            var grd = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.r * 2);
            grd.addColorStop(0, 'rgba(0,0,0,' + d.o + ')');
            grd.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.beginPath();
            ctx.arc(d.x, d.y, d.r * 2, 0, Math.PI * 2);
            ctx.fillStyle = grd;
            ctx.fill();
            ctx.beginPath();
            ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0,0,0,' + (d.o + 0.1) + ')';
            ctx.fill();
        }
        requestAnimationFrame(anim);
    }
    anim();
});
