/* ==========================================================================
   MEZZ PORTFOLIO — ENGINE 3D, THREE.JS, GSAP, LENIS & INTERACTION
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

    // ==========================================================================
    // 1. SMOOTH SCROLLING (LENIS)
    // ==========================================================================
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        direction: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1.0
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Intégration Lenis + GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0, 0);

    // ==========================================================================
    // 2. SCÈNE THREE.JS 3D UNIVERSE
    // ==========================================================================
    const canvas = document.getElementById('webgl-canvas');
    const scene = new THREE.Scene();
    
    // Ajout d'un brouillard d'ambiance
    scene.fog = new THREE.FogExp2(0x070709, 0.015);

    // Caméra dynamique
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 15;

    // Renderer haute performance GPU
    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // --- OBJETS 3D EN ARRIÈRE-PLAN ---
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // Material Wireframe Néon Premium
    const wireframeMaterial = new THREE.MeshStandardMaterial({
        color: 0x00f2fe,
        wireframe: true,
        transparent: true,
        opacity: 0.25,
        roughness: 0.2,
        metalness: 0.8
    });

    // Material Solid Glass
    const glassMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x4facfe,
        metalness: 0.1,
        roughness: 0.1,
        transmission: 0.9,
        opacity: 0.3,
        transparent: true,
        wireframe: false
    });

    // Geométries 3D Variées
    const icoGeo = new THREE.IcosahedronGeometry(3.5, 1);
    const icoMesh = new THREE.Mesh(icoGeo, wireframeMaterial);
    icoMesh.position.set(-6, 2, -2);
    mainGroup.add(icoMesh);

    const cubeGeo = new THREE.BoxGeometry(3, 3, 3);
    const cubeMesh = new THREE.Mesh(cubeGeo, glassMaterial);
    cubeMesh.position.set(7, -4, -4);
    mainGroup.add(cubeMesh);

    const octaGeo = new THREE.OctahedronGeometry(2.5, 0);
    const octaMesh = new THREE.Mesh(octaGeo, wireframeMaterial);
    octaMesh.position.set(-5, -12, -1);
    mainGroup.add(octaMesh);

    const torusGeo = new THREE.TorusGeometry(3, 0.8, 16, 100);
    const torusMesh = new THREE.Mesh(torusGeo, glassMaterial);
    torusMesh.position.set(6, -20, -3);
    mainGroup.add(torusMesh);

    // --- ÉSYSTEME DE PARTICULES INTERACTIF ---
    const particlesCount = 1200;
    const posArray = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 60;
    }

    const particlesGeo = new THREE.BufferGeometry();
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    const particlesMat = new THREE.PointsMaterial({
        size: 0.08,
        color: 0x00f2fe,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
    });

    const particlesMesh = new THREE.Points(particlesGeo, particlesMat);
    scene.add(particlesMesh);

    // --- LUMIÈRES DYNAMIQUES ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x00f2fe, 3, 30);
    pointLight1.position.set(5, 5, 5);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x4facfe, 2, 30);
    pointLight2.position.set(-5, -5, 2);
    scene.add(pointLight2);

    // --- PARALLAXE SOURIS 3D ---
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    window.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
        mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    // --- ANIMATION FRAME LOOP ---
    const clock = new THREE.Clock();

    function animate3D() {
        const elapsedTime = clock.getElapsedTime();

        // Rotation continue des objets
        icoMesh.rotation.x = elapsedTime * 0.15;
        icoMesh.rotation.y = elapsedTime * 0.2;

        cubeMesh.rotation.x = elapsedTime * 0.2;
        cubeMesh.rotation.y = elapsedTime * 0.1;

        octaMesh.rotation.z = elapsedTime * 0.1;
        octaMesh.rotation.y = elapsedTime * 0.25;

        torusMesh.rotation.x = elapsedTime * 0.3;
        torusMesh.rotation.y = elapsedTime * 0.15;

        particlesMesh.rotation.y = elapsedTime * 0.03;

        // Smooth Mouse Parallax
        targetX += (mouseX - targetX) * 0.05;
        targetY += (mouseY - targetY) * 0.05;

        mainGroup.rotation.y = targetX * 0.2;
        mainGroup.rotation.x = -targetY * 0.2;

        renderer.render(scene, camera);
        requestAnimationFrame(animate3D);
    }
    animate3D();

    // --- RESIZE RESPONSIF ---
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });

    // --- CAMÉRA DYNAMIQUE LIÉE AU SCROLL (GSAP) ---
    gsap.to(camera.position, {
        z: 25,
        y: -18,
        ease: 'none',
        scrollTrigger: {
            trigger: 'body',
            start: 'top top',
            end: 'bottom bottom',
            scrub: 1
        }
    });

    // ==========================================================================
    // 3. ANIMATION DU PRELOADER
    // ==========================================================================
    const preloader = document.getElementById('preloader');
    const loaderBar = document.getElementById('loaderBar');
    const loaderPercent = document.getElementById('loaderPercent');

    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 8) + 2;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);

            // Intro cinématique
            gsap.to(preloader, {
                opacity: 0,
                duration: 1,
                delay: 0.3,
                ease: 'power4.inOut',
                onComplete: () => {
                    preloader.classList.add('hidden');
                    initHeroAnimations();
                }
            });
        }
        loaderBar.style.width = `${progress}%`;
        loaderPercent.textContent = `${progress < 10 ? '0' : ''}${progress}%`;
    }, 40);

    // ==========================================================================
    // 4. ANIMATIONS GSAP INTRO & REVEALS
    // ==========================================================================
    function initHeroAnimations() {
        const tl = gsap.timeline();
        tl.from('.hero-label', { y: 30, opacity: 0, duration: 0.8, ease: 'power3.out' })
          .from('.hero-title', { y: 50, opacity: 0, duration: 1, ease: 'power4.out' }, '-=0.5')
          .from('.hero-status', { scale: 0.8, opacity: 0, duration: 0.6, ease: 'back.out(1.7)' }, '-=0.6')
          .from('.hero-sub', { y: 30, opacity: 0, duration: 0.8, ease: 'power3.out' }, '-=0.4')
          .from('.hero-desc', { y: 30, opacity: 0, duration: 0.8, ease: 'power3.out' }, '-=0.6')
          .from('.hero-btns .btn', { y: 20, opacity: 0, duration: 0.6, stagger: 0.2, ease: 'power3.out' }, '-=0.4')
          .from('.hero-scroll', { opacity: 0, duration: 0.8 }, '-=0.2');
    }

    // GSAP ScrollTrigger Reveals sur chaque section
    gsap.utils.toArray('.reveal').forEach((el) => {
        gsap.fromTo(el, 
            { y: 50, opacity: 0 },
            {
                y: 0,
                opacity: 1,
                duration: 1,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: el,
                    start: 'top 85%',
                    toggleActions: 'play none none none'
                }
            }
        );
    });

    gsap.utils.toArray('.reveal-scale').forEach((el) => {
        gsap.fromTo(el, 
            { scale: 0.9, opacity: 0 },
            {
                scale: 1,
                opacity: 1,
                duration: 0.8,
                ease: 'back.out(1.4)',
                scrollTrigger: {
                    trigger: el,
                    start: 'top 85%',
                    toggleActions: 'play none none none'
                }
            }
        );
    });

    // ==========================================================================
    // 5. INTERACTION CARTE 3D (EFFET DE PROFONDEUR & TILT)
    // ==========================================================================
    const cards3D = document.querySelectorAll('.card-3d');

    cards3D.forEach((card) => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = ((y - centerY) / centerY) * -12;
            const rotateY = ((x - centerX) / centerX) * 12;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
        });
    });

    // ==========================================================================
    // 6. CURSEUR PERSONNALISÉ MAGNÉTIQUE
    // ==========================================================================
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorHalo = document.querySelector('.cursor-halo');
    const magneticLinks = document.querySelectorAll('.magnetic, .magnetic-link, a, button');

    let cursorX = 0, cursorY = 0;
    let haloX = 0, haloY = 0;

    window.addEventListener('mousemove', (e) => {
        cursorX = e.clientX;
        cursorY = e.clientY;
    });

    function updateCursor() {
        // Point instantané
        cursorDot.style.left = `${cursorX}px`;
        cursorDot.style.top = `${cursorY}px`;

        // Smooth Halo Lerp
        haloX += (cursorX - haloX) * 0.15;
        haloY += (cursorY - haloY) * 0.15;

        cursorHalo.style.left = `${haloX}px`;
        cursorHalo.style.top = `${haloY}px`;

        requestAnimationFrame(updateCursor);
    }
    updateCursor();

    // Effet Hover sur liens/boutons
    magneticLinks.forEach((elem) => {
        elem.addEventListener('mouseenter', () => {
            document.body.classList.add('cursor-hover');
        });
        elem.addEventListener('mouseleave', () => {
            document.body.classList.remove('cursor-hover');
        });
    });

    // ==========================================================================
    // 7. NAVBAR SCROLL & MENU MOBILE
    // ==========================================================================
    const navbar = document.querySelector('.navbar');
    const toggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 80);
    });

    if (toggle && navLinks) {
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            navLinks.classList.toggle('active');
        });
        document.addEventListener('click', (e) => {
            if (!navLinks.contains(e.target) && !toggle.contains(e.target)) {
                navLinks.classList.remove('active');
            }
        });
        navLinks.querySelectorAll('a').forEach((a) => {
            a.addEventListener('click', () => navLinks.classList.remove('active'));
        });
    }

    // Ancre Smooth Scroll avec Lenis
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const target = document.querySelector(targetId);
            if (target) {
                lenis.scrollTo(target, { offset: -70, duration: 1.2 });
            }
        });
    });
});