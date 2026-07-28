// Attendre que le DOM soit chargé
document.addEventListener("DOMContentLoaded", () => {
    
    // ==========================================
    // 1. INITIALISATION DE LENIS (SMOOTH SCROLL)
    // ==========================================
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        mouseMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
    });

    // Synchroniser Lenis avec ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0, 0);

    // ==========================================
    // 2. CURSEUR PREMIUM & EFFET MAGNÉTIQUE
    // ==========================================
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorOutline = document.querySelector('.cursor-outline');
    const magnetics = document.querySelectorAll('.magnetic, a, button, .portfolio-item');
    
    let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let outline = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        
        // Mouvement instantané du point central
        gsap.set(cursorDot, { x: mouse.x, y: mouse.y });
    });

    // Animation fluide de la traînée (Lerp)
    gsap.ticker.add(() => {
        const dt = 1.0 - Math.pow(0.8, gsap.ticker.deltaRatio());
        outline.x += (mouse.x - outline.x) * dt;
        outline.y += (mouse.y - outline.y) * dt;
        gsap.set(cursorOutline, { x: outline.x, y: outline.y });
    });

    // État Hover et Magnétisme
    magnetics.forEach(el => {
        el.addEventListener('mouseenter', () => {
            document.body.classList.add('hover-state');
        });
        
        el.addEventListener('mouseleave', () => {
            document.body.classList.remove('hover-state');
            gsap.to(el, { x: 0, y: 0, scale: 1, duration: 0.5, ease: "power2.out" });
        });

        if(el.classList.contains('magnetic')) {
            el.addEventListener('mousemove', (e) => {
                const rect = el.getBoundingClientRect();
                const relX = e.clientX - (rect.left + rect.width / 2);
                const relY = e.clientY - (rect.top + rect.height / 2);
                
                // Déplace légèrement l'élément vers la souris
                gsap.to(el, {
                    x: relX * 0.2,
                    y: relY * 0.2,
                    scale: 1.02,
                    duration: 0.3,
                    ease: "power2.out"
                });
            });
        }
    });

    // ==========================================
    // 3. LOGIQUE DISCORD (COPIER DANS LE PRESSE-PAPIER)
    // ==========================================
    const discordBtn = document.getElementById('discord-btn');
    if(discordBtn) {
        const copyStatus = discordBtn.querySelector('.copy-status');
        const discordId = "xmezzedv";

        discordBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(discordId).then(() => {
                const originalText = copyStatus.textContent;
                copyStatus.textContent = "Copié !";
                copyStatus.style.background = "#FFFFFF";
                copyStatus.style.color = "#050505";
                
                setTimeout(() => {
                    copyStatus.textContent = originalText;
                    copyStatus.style.background = "rgba(255, 255, 255, 0.1)";
                    copyStatus.style.color = "#FFFFFF";
                }, 2000);
            });
        });
    }

    // ==========================================
    // 4. ANIMATIONS GSAP (SCROLL REVEAL)
    // ==========================================
    gsap.registerPlugin(ScrollTrigger);

    // Hero Animations
    gsap.fromTo('.glitch-text', 
        { opacity: 0, y: 100, filter: "blur(10px)" },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.5, ease: "power4.out" }
    );
    gsap.fromTo('.gsap-fade-up', 
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 1, stagger: 0.2, ease: "power3.out", delay: 0.5 }
    );

    // Scroll Reveals pour les sections
    const revealElements = document.querySelectorAll('.gsap-reveal');
    revealElements.forEach(el => {
        gsap.fromTo(el, 
            { opacity: 0, y: 50, scale: 0.98, filter: "blur(5px)" },
            { 
                scrollTrigger: {
                    trigger: el,
                    start: "top 85%", // Déclenche quand le haut de l'élément atteint 85% de l'écran
                    toggleActions: "play none none reverse"
                },
                opacity: 1, 
                y: 0, 
                scale: 1,
                filter: "blur(0px)",
                duration: 1, 
                ease: "power3.out"
            }
        );
    });

    // ==========================================
    // 5. UNIVERS 3D - THREE.JS
    // ==========================================
    const canvas = document.getElementById('webgl-canvas');
    const scene = new THREE.Scene();
    
    // Brouillard pour masquer la fin du tunnel et donner de la profondeur
    scene.fog = new THREE.FogExp2(0x050505, 0.0015);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
    
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Création des particules (Étoiles / Poussière cosmique)
    const particleCount = 5000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount * 3; i+=3) {
        // Forme de tunnel / galaxie cylindrique
        const radius = 10 + Math.random() * 40;
        const theta = Math.random() * Math.PI * 2;
        
        positions[i] = Math.cos(theta) * radius; // x
        positions[i+1] = Math.sin(theta) * radius; // y
        positions[i+2] = (Math.random() - 0.5) * 1000; // z (profondeur)

        sizes[i/3] = Math.random() * 2;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Matériau avec Additive Blending pour simuler l'effet de Glow/Bloom natif
    const material = new THREE.PointsMaterial({
        size: 0.15,
        color: 0xffffff,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const particlesMesh = new THREE.Points(geometry, material);
    scene.add(particlesMesh);

    // Position initiale
    camera.position.z = 0;

    // Interaction Caméra / Scroll & Souris
    let scrollY = 0;
    let targetCameraZ = 0;
    
    // Parallaxe souris
    let targetCameraX = 0;
    let targetCameraY = 0;

    window.addEventListener('mousemove', (event) => {
        // Normaliser les coordonnées de la souris entre -1 et 1
        targetCameraX = (event.clientX / window.innerWidth) * 2 - 1;
        targetCameraY = -(event.clientY / window.innerHeight) * 2 + 1;
    });

    lenis.on('scroll', (e) => {
        scrollY = e.scroll;
        // On fait avancer la caméra dans l'axe Z négatif au scroll
        targetCameraZ = -(scrollY * 0.15); 
    });

    // Boucle d'animation (Maintenue à 60FPS)
    const clock = new THREE.Clock();
    
    function animate() {
        requestAnimationFrame(animate);
        const elapsedTime = clock.getElapsedTime();

        // Rotation lente de l'univers
        particlesMesh.rotation.z = elapsedTime * 0.05;

        // Déplacement fluide de la caméra (Lerp)
        camera.position.z += (targetCameraZ - camera.position.z) * 0.05;
        
        // Mouvement de tête (Parallaxe)
        camera.position.x += (targetCameraX * 2 - camera.position.x) * 0.05;
        camera.position.y += (targetCameraY * 2 - camera.position.y) * 0.05;
        
        // Inclinaison légère basée sur la souris
        camera.rotation.y = -(targetCameraX * 0.1);
        camera.rotation.x = targetCameraY * 0.1;

        renderer.render(scene, camera);
    }
    animate();

    // Gestion du redimensionnement
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });

});
