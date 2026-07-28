document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialisation de Lenis (Smooth Scroll)
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Easing premium
        smooth: true,
        mouseMultiplier: 1,
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // 2. Curseur personnalisé & Effet magnétique
    const cursor = document.querySelector('.cursor');
    const follower = document.querySelector('.cursor-follower');
    let mouseX = 0, mouseY = 0, posX = 0, posY = 0;

    if (window.innerWidth > 768) {
        window.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            // Curseur point instantané
            gsap.to(cursor, { x: mouseX, y: mouseY, duration: 0 });
        });

        // Inertie pour le suiveur (halo)
        gsap.ticker.add(() => {
            posX += (mouseX - posX) * 0.15;
            posY += (mouseY - posY) * 0.15;
            gsap.set(follower, { x: posX, y: posY });
        });

        // État au survol des éléments interactifs
        const hoverElements = document.querySelectorAll('a, button, .hover-text');
        hoverElements.forEach(el => {
            el.addEventListener('mouseenter', () => follower.classList.add('hover'));
            el.addEventListener('mouseleave', () => follower.classList.remove('hover'));
        });

        // Effet Magnétique sur les boutons
        const magnetics = document.querySelectorAll('.magnetic');
        magnetics.forEach(btn => {
            btn.addEventListener('mousemove', (e) => {
                const rect = btn.getBoundingClientRect();
                const strength = btn.dataset.strength || 20;
                const x = ((e.clientX - rect.left) / btn.offsetWidth - 0.5) * strength;
                const y = ((e.clientY - rect.top) / btn.offsetHeight - 0.5) * strength;
                gsap.to(btn, { x: x, y: y, duration: 1, ease: "power4.out" });
            });
            btn.addEventListener('mouseleave', () => {
                gsap.to(btn, { x: 0, y: 0, duration: 1, ease: "elastic.out(1, 0.3)" });
            });
        });

        // Effet 3D sur les cartes de service (Parallaxe)
        document.querySelectorAll('.service-card').forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const r = card.getBoundingClientRect();
                const x = e.clientX - r.left;
                const y = e.clientY - r.top;
                const rotateY = ((x - r.width / 2) / (r.width / 2)) * 10;
                const rotateX = (-(y - r.height / 2) / (r.height / 2)) * 10;
                card.style.transform = `translateY(-10px) perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            });
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) perspective(1000px) rotateX(0deg) rotateY(0deg)';
            });
        });
    }

    // 3. GSAP ScrollTrigger Animations (remplace ton IntersectionObserver)
    gsap.registerPlugin(ScrollTrigger);

    const reveals = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
    reveals.forEach(el => {
        let xParams = 0;
        let yParams = 50;
        let scaleParams = 1;

        if (el.classList.contains('reveal-left')) xParams = -50;
        if (el.classList.contains('reveal-right')) xParams = 50;
        if (el.classList.contains('reveal-scale')) { yParams = 0; scaleParams = 0.8; }

        gsap.fromTo(el, 
            { opacity: 0, y: yParams, x: xParams, scale: scaleParams },
            { 
                opacity: 1, y: 0, x: 0, scale: 1,
                duration: 1.2,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: el,
                    start: "top 85%", // Déclenche quand l'élément atteint 85% de l'écran
                    toggleActions: "play none none reverse"
                }
            }
        );
    });

    // 4. Navbar logique (scrolled state)
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) navbar.classList.add('scrolled');
        else navbar.classList.remove('scrolled');
    });
});