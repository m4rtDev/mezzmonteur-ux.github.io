/* ==========================================================================
   MEZZ PORTFOLIO — SCÈNE 3D MONOCHROME, GSAP, LENIS SCROLL & INTERACTION
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

    // ==========================================================================
    // 1. LENIS SMOOTH SCROLLING
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

    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0, 0);

    // ==========================================================================
    // 2. SCÈNE 3D THREE.JS (MONOCHROME UNIVERSE)
    // ==========================================================================
    const canvas = document.getElementById('webgl-canvas');
    const scene = new THREE.Scene();
    
    // Brouillard profond
    scene.fog = new THREE.FogExp2(0x050505, 0.018);

    // Caméra 3D
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 15;

    // Renderer WebGL GPU
    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Groupe principal pour objets 3D
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // Matériau Wireframe Blanc / Argent
    const wireframeMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        wireframe: true,
        transparent: true,
        opacity: 0.2,
        roughness: 0.1,
        metalness: 0.9
    });

    // Matériau Verre Sombre Métallique
    const darkMetalMaterial = new THREE.MeshStandardMaterial({
        color: 0x222222,
        roughness: 0.2,
        metalness: 0.8,
        wireframe: false
    });

    // --- FORMES GEOMÉTRIQUES 3D ---
    // 1. Icosaèdre Wireframe (Haut Gauche)
    const icoGeo = new THREE.IcosahedronGeometry(4, 1);
    const icoMesh = new THREE.Mesh(icoGeo, wireframeMaterial);
    icoMesh.position.set(-7, 3, -2);
    mainGroup.add(icoMesh);

    // 2. Cube Métallique (Bas Droite)
    const cubeGeo = new THREE.BoxGeometry(3.5, 3.5, 3.5);
    const cubeMesh = new THREE.Mesh(cubeGeo, darkMetalMaterial);
    cubeMesh.position.set(7, -4, -4);
    mainGroup.add(cubeMesh);

    // 3. Octaèdre Wireframe (Centre Milieu)
    const octaGeo = new THREE.OctahedronGeometry(3, 0);
    const octaMesh = new THREE.Mesh(octaGeo, wireframeMaterial);
    octaMesh.position.set(-6, -14, -1);
    mainGroup.add(octaMesh);

    // 4. TorusKnot (Bas)
    const torusKnotGeo = new THREE.TorusKnotGeometry(2.5, 0.6, 100, 16);
    const torusKnotMesh = new THREE.Mesh(torusKnotGeo, wireframeMaterial);
    torusKnotMesh.position.set(6, -22, -3);
    mainGroup.add(torusKnotMesh);

    // --- CHAMP DE PARTICULES BLANCHES ---
    const particlesCount = 1500;
    const posArray = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 70;
    }

    const particlesGeo = new THREE.BufferGeometry();
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    const particlesMat = new THREE.PointsMaterial({
        size: 0.07,
        color: 0xffffff,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending
    });

    const particlesMesh = new THREE.Points(particlesGeo, particlesMat);
    scene.add(particlesMesh);

    // --- LUMIÈRES NOIR & BLANC ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight1.position.set(10, 10, 10);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight2.position.set(-10, -10, -5);
    scene.add(dirLight2);

    // --- PARALLAXE SOURIS ---
    let mouseX = 0, mouseY = 0;
    let targetX = 0, targetY = 0;

    window.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
        mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    // Loop Animation 3D
    const clock = new THREE.Clock();

    function animate3D() {
        const elapsedTime = clock.getElapsedTime();

        // Rotations des objets 3D
        icoMesh.rotation.x = elapsedTime * 0.12;
        icoMesh.rotation.y = elapsedTime * 0.18;

        cubeMesh.rotation.x = elapsedTime * 0.15;
        cubeMesh.rotation.y = elapsedTime * 0.1;

        octaMesh.rotation.z = elapsedTime * 0.1;
        octaMesh.rotation.y = elapsedTime * 0.2;

        torusKnotMesh.rotation.x = elapsedTime * 0.25;
        torusKnotMesh.rotation.y = elapsedTime * 0.15;

        particlesMesh.rotation.y = elapsedTime * 0.02;

        // Effet de parallaxe
        targetX += (mouseX - targetX) * 0.05;
        targetY += (mouseY - targetY) * 0.05;

        mainGroup.rotation.y = targetX * 0.15;
        mainGroup.rotation.x = -targetY * 0.15;

        renderer.render(scene, camera);
        requestAnimationFrame(animate3D);
    }
    animate3D();

    // Resize dynamique
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });

    // Mouvement de la caméra 3D lors du Scroll
    gsap.to(camera.position, {
        z: 22,
        y: -20,
        ease: 'none',
        scrollTrigger: {
            trigger: 'body',
            start: 'top top',
            end: 'bottom bottom',
            scrub: 1
        }
    });

    // ==========================================================================
    // 3. PRELOADER
    // ==========================================================================
    const preloader = document.getElementById('preloader');
    const loaderBar = document.getElementById('loaderBar');
    const loaderPercent = document.getElementById('loaderPercent');

    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 9) + 3;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);

            gsap.to(preloader, {
                opacity: 0,
                duration: 0.8,
                delay: 0.2,
                ease: 'power3.inOut',
                onComplete: () => {
                    preloader.classList.add('hidden');
                    initHeroAnimations();
                }
            });
        }
        loaderBar.style.width = `${progress}%`;
        loaderPercent.textContent = `${progress < 10 ? '0' : ''}${progress}%`;
    }, 35);

    // ==========================================================================
    // 4. ANIMATIONS GSAP & REVEALS
    // ==========================================================================
    function initHeroAnimations() {
        const tl = gsap.timeline();
        tl.from('.hero-label', { y: 20, opacity: 0, duration: 0.8, ease: 'power3.out' })
          .from('.hero-title', { y: 40, opacity: 0, duration: 1, ease: 'power4.out' }, '-=0.5')
          .from('.hero-status', { scale: 0.9, opacity: 0, duration: 0.6, ease: 'back.out(1.5)' }, '-=0.6')
          .from('.hero-sub', { y: 20, opacity: 0, duration: 0.8, ease: 'power3.out' }, '-=0.4')
          .from('.hero-desc', { y: 20, opacity: 0, duration: 0.8, ease: 'power3.out' }, '-=0.6')
          .from('.hero-btns .btn', { y: 20, opacity: 0, duration: 0.6, stagger: 0.15, ease: 'power3.out' }, '-=0.4')
          .from('.hero-scroll', { opacity: 0, duration: 0.8 }, '-=0.2');
    }

    gsap.utils.toArray('.reveal').forEach((el) => {
        gsap.fromTo(el, 
            { y: 40, opacity: 0 },
            {
                y: 0,
                opacity: 1,
                duration: 0.9,
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
            { scale: 0.92, opacity: 0 },
            {
                scale: 1,
                opacity: 1,
                duration: 0.8,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: el,
                    start: 'top 85%',
                    toggleActions: 'play none none none'
                }
            }
        );
    });

    // ==========================================================================
    // 5. CARTE 3D TILT PHYSICS
    // ==========================================================================
    const cards3D = document.querySelectorAll('.card-3d');

    cards3D.forEach((card) => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = ((y - centerY) / centerY) * -10;
            const rotateY = ((x - centerX) / centerX) * 10;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(8px)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
        });
    });

    // ==========================================================================
    // 6. CURSEUR MAGNÉTIQUE
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
        cursorDot.style.left = `${cursorX}px`;
        cursorDot.style.top = `${cursorY}px`;

        haloX += (cursorX - haloX) * 0.15;
        haloY += (cursorY - haloY) * 0.15;

        cursorHalo.style.left = `${haloX}px`;
        cursorHalo.style.top = `${haloY}px`;

        requestAnimationFrame(updateCursor);
    }
    updateCursor();

    magneticLinks.forEach((elem) => {
        elem.addEventListener('mouseenter', () => {
            document.body.classList.add('cursor-hover');
        });
        elem.addEventListener('mouseleave', () => {
            document.body.classList.remove('cursor-hover');
        });
    });

    // ==========================================================================
    // 7. MENU & SMOOTH SCROLL ANCHORS
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
