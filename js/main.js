document.addEventListener("DOMContentLoaded", () => {
    const loader = document.getElementById("loader");
    const progress = document.getElementById("loader-progress");
    const percentText = document.getElementById("loader-percent");

    if (!loader || !progress || !percentText) return;

    let progressValue = 0;

    function setProgress(value) {
        progressValue = value;
        progress.style.width = value + "%";
        percentText.textContent = value + "%";
    }

    // Monte progressivement jusqu'à 90%
    const loadingAnimation = setInterval(() => {
        if (progressValue < 90) {
            setProgress(progressValue + 1);
        }
    }, 25);

    // Quand toute la page est réellement chargée
    window.addEventListener("load", () => {
        clearInterval(loadingAnimation);

        setProgress(100);

        setTimeout(() => {
            loader.classList.add("hidden");
        }, 400);
    });
});

var selectedRating = 0;
var debugMode = false; 

document.addEventListener('DOMContentLoaded', function() {

    var currentYear = document.getElementById('currentYear');
    if (currentYear) currentYear.textContent = new Date().getFullYear();

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
    if (navbar) {
        window.addEventListener('scroll', function() {
            navbar.classList.toggle('scrolled', window.scrollY > 80);
        }, { passive: true });
    }

    var revealSelector = '.reveal, .reveal-left, .reveal-right, .reveal-scale';
    if ('IntersectionObserver' in window) {
        var ro = new IntersectionObserver(function(e) {
            e.forEach(function(en) {
                if (en.isIntersecting) { en.target.classList.add('visible'); ro.unobserve(en.target); }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
        document.querySelectorAll(revealSelector).forEach(function(el) { ro.observe(el); });
    } else {
        document.querySelectorAll(revealSelector).forEach(function(el) { el.classList.add('visible'); });
    }

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

    var stars = document.getElementById('rvStars');
    if (stars) {
        stars.querySelectorAll('span').forEach(function(s) {
            s.addEventListener('click', function() {
                selectedRating = parseInt(this.dataset.s);
                stars.querySelectorAll('span').forEach(function(sp, i) { sp.textContent = i < selectedRating ? '★' : '☆'; sp.style.color = i < selectedRating ? '#000' : ''; });
            });
            s.addEventListener('mouseenter', function() {
                var v = parseInt(this.dataset.s);
                stars.querySelectorAll('span').forEach(function(sp, i) { sp.textContent = i < v ? '★' : '☆'; });
            });
            s.addEventListener('mouseleave', function() {
                stars.querySelectorAll('span').forEach(function(sp, i) { sp.textContent = i < selectedRating ? '★' : '☆'; });
            });
        });
    }

    loadReviews();
    checkAuth();
});

function showAuthModal() { document.getElementById('authModal').style.display = 'flex'; }
function hideAuthModal() { document.getElementById('authModal').style.display = 'none'; document.querySelectorAll('.modal-err').forEach(function(e) { e.textContent = ''; }); }

function switchTab(t) {
    document.querySelectorAll('.mtab').forEach(function(b) { b.classList.toggle('ac', b.dataset.t === t); });
    document.getElementById('loginForm').style.display = t === 'login' ? 'flex' : 'none';
    document.getElementById('registerForm').style.display = t === 'register' ? 'flex' : 'none';
}

function authSubmit(mode) {
    var form = mode === 'login' ? document.getElementById('loginForm') : document.getElementById('registerForm');
    var inputs = form.querySelectorAll('input');
    var err = form.querySelector('.modal-err');
    var data = { username: inputs[0].value.trim(), password: inputs[1].value };
    err.textContent = '';
    fetch('/api/' + mode, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    .then(function(r) { return r.json(); })
    .then(function(d) {
        if (d.ok) { hideAuthModal(); checkAuth(); }
        else { err.textContent = d.error || 'Erreur'; }
    })
    .catch(function() { err.textContent = 'Erreur réseau'; });
    return false;
}

async function logout() {
    try {
        await fetch('/api/logout', { method: 'POST' });
        checkAuth();
    } catch(e) {
        console.log('logout error lol')
    }
}

function checkAuth() {
    fetch('/api/me').then(function(r) {
        if (!r.ok) throw new Error('Session indisponible');
        return r.json();
    }).then(function(d) {
        let lo = document.getElementById('rvLoggedOut');
        let li = document.getElementById('rvLoggedIn');
        if (!lo || !li) return;
        if (d.ok) {
            lo.style.display = 'none';
            li.style.display = "block";
            document.getElementById('rvUser').textContent = d.username;
        } else {
            lo.style.display = 'block';
            li.style.display = 'none';
        }
    }).catch(function() {
        var lo = document.getElementById('rvLoggedOut');
        var li = document.getElementById('rvLoggedIn');
        if (lo) lo.style.display = 'block';
        if (li) li.style.display = 'none';
    });
}

function loadReviews() {
    fetch('/api/reviews').then(function(r) {
        if (!r.ok) throw new Error('Avis indisponibles');
        return r.json();
    }).then(function(reviews) {
        var el = document.getElementById('rvList');
        if (!el || !Array.isArray(reviews)) throw new Error('Réponse invalide');
        if (reviews.length === 0) {
            el.innerHTML = '<p class="rv-empty">Aucun avis pour le moment. Sois le premier !</p>';
            return;
        }
        el.innerHTML = reviews.map(function(r) {
            var stars = '';
            var rating = Math.max(0, Math.min(5, Number(r.rating) || 0));
            for (var i = 0; i < 5; i++) stars += i < rating ? '★' : '☆';
            var replyHtml = r.reply ? '<div class="rv-reply"><strong>Mezz</strong> &mdash; ' + escapeHtml(r.replied_at) + '<br>' + escapeHtml(r.reply) + '</div>' : '';
            return '<div class="rv-card reveal"><div class="rv-head"><span class="rv-name">' + escapeHtml(r.username) + '</span><span class="rv-date">' + escapeHtml(r.created_at) + '</span></div><div class="rv-stars" style="cursor:default;margin-bottom:6px">' + stars + '</div><div class="rv-text">' + escapeHtml(r.content) + '</div>' + replyHtml + '</div>';
        }).join('');
        if (!('IntersectionObserver' in window)) {
            el.querySelectorAll('.reveal').forEach(function(el2) { el2.classList.add('visible'); });
            return;
        }
        var reviewObserver = new IntersectionObserver(function(e) {
            e.forEach(function(en) { if (en.isIntersecting) { en.target.classList.add('visible'); reviewObserver.unobserve(en.target); } });
        }, { threshold: 0.1 });
        el.querySelectorAll('.reveal').forEach(function(el2) { reviewObserver.observe(el2); });
    }).catch(function() {
        var el = document.getElementById('rvList');
        if (el) el.innerHTML = '<p class="rv-empty">Les avis sont momentanément indisponibles.</p>';
    });
}

function escapeHtml(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function submitReview() {
    var content = document.getElementById('rvContent').value.trim();
    var msg = document.getElementById('rvMsg');
    var btn = document.getElementById('rvSubmitBtn');
    if (!content || content.length < 5) { msg.textContent = 'Message trop court (5+ caractères)'; msg.style.color = '#cc0000'; return; }
    if (!selectedRating) { msg.textContent = 'Choisis une note'; msg.style.color = '#cc0000'; return; }
    btn.disabled = true;
    btn.textContent = 'Envoi...';
    fetch('/api/review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: content, rating: selectedRating }) })
    .then(function(res) { return res.json(); })
    .then(function(d) {
        if (d.ok) {
            msg.textContent = 'Avis publié ! Merci :)';
            msg.style.color = '#22a67e';
            document.getElementById('rvContent').value = '';
            selectedRating = 0;
            document.querySelectorAll('#rvStars span').forEach(function(s) { s.textContent = '☆'; s.style.color = ''; });
            loadReviews();
        } else {
            msg.textContent = d.error || 'Erreur';
            msg.style.color = '#cc0000';
        }
    })
    .catch(function() { msg.textContent = 'Erreur réseau'; msg.style.color = '#cc0000'; })
    .then(function() { btn.disabled = false; btn.textContent = "Publier l'avis"; });
}
const text = "Mezz";
let index = 0;
let deleting = false;

function typeTitle() {
    // ...
}

typeTitle();
