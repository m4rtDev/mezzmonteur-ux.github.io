/* ================================================================
   PORTFOLIO MEZZ — SCRIPT PRINCIPAL (ES2025 Module)
   Sommaire :
   1. Imports Three.js
   2. Configuration globale & état
   3. Préchargeur
   4. Lenis (smooth scroll)
   5. GSAP ScrollTrigger — animations globales
   6. Curseur personnalisé
   7. Navigation (header, burger, menu mobile)
   8. Navigation 3D libre (clavier + D-pad tactile)
   9. Scène Three.js (univers 3D)
   10. Révélations au scroll (Intersection Observer)
   11. Effets interactifs (tilt 3D, magnétisme)
   12. Contact — Copie presse-papiers (Email + Discord)
   13. Divers (footer, back-to-top)
   14. Initialisation générale
================================================================ */

/* ================================================================
   1. IMPORTS THREE.JS
================================================================ */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { recordVisit } from './analytics.js';


/* ================================================================
   2. CONFIGURATION GLOBALE & ÉTAT PARTAGÉ
================================================================ */
const CONFIG = {
    isTouch: window.matchMedia('(pointer: coarse)').matches,
    reduceMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    isMobile: window.innerWidth < 900,

    // --- Paramètres de la navigation 3D libre ---
    navSpeed: 16,                      // Vitesse de déplacement (unités / seconde)
    navBounds: { x: 18, y: 11 },       // Limites du déplacement libre (pour ne jamais se perdre)
};

// État global partagé (scroll, souris)
const STATE = {
    scrollProgress: 0,
    mouseX: 0,
    mouseY: 0,
};

/**
 * État dédié à la navigation 3D libre (clavier / D-pad tactile).
 * `flags` indique quelles directions sont actuellement "appuyées".
 * `offset` est la position libre ajoutée par-dessus le mouvement de scroll.
 */
const NAV_STATE = {
    flags: { left: false, right: false, up: false, down: false },
    offset: { x: 0, y: 0 },
    hasMoved: false, // Devient vrai dès la première interaction (pour estomper le HUD)
};

function debounce(fn, delay = 200) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

function lerp(start, end, amount) {
    return start + (end - start) * amount;
}


/* ================================================================
   3. PRÉCHARGEUR
================================================================ */
function initPreloader(onFinish) {
    const preloader = document.getElementById('preloader');
    const counterEl = document.getElementById('preloader-counter');
    const barFill = document.getElementById('preloader-bar-fill');

    const progress = { value: 0 };

    gsap.to(progress, {
        value: 100,
        duration: CONFIG.reduceMotion ? 0.3 : 2.4,
        ease: 'power2.inOut',
        onUpdate: () => {
            const rounded = Math.floor(progress.value);
            counterEl.textContent = String(rounded).padStart(3, '0');
            barFill.style.width = `${rounded}%`;
        },
        onComplete: () => {
            gsap.to(preloader, {
                yPercent: -100,
                duration: 1,
                ease: 'power4.inOut',
                delay: 0.15,
                onComplete: () => {
                    preloader.style.display = 'none';
                    document.body.classList.remove('is-loading');
                    if (typeof onFinish === 'function') onFinish();
                }
            });
        }
    });
}


/* ================================================================
   4. LENIS — SCROLL FLUIDE
================================================================ */
function initLenis() {
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 1.5,
    });

    gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    lenis.on('scroll', (e) => {
        STATE.scrollProgress = e.progress;
        ScrollTrigger.update();
    });

    return lenis;
}


/* ================================================================
   5. GSAP SCROLLTRIGGER — ANIMATIONS GLOBALES LIÉES AU SCROLL
================================================================ */
function initScrollTrigger() {
    gsap.registerPlugin(ScrollTrigger);

    const progressBar = document.getElementById('scroll-progress');
    ScrollTrigger.create({
        trigger: document.body,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => {
            progressBar.style.width = `${self.progress * 100}%`;
        }
    });

    const header = document.getElementById('site-header');
    ScrollTrigger.create({
        trigger: document.body,
        start: '80px top',
        onEnter: () => header.classList.add('is-scrolled'),
        onLeaveBack: () => header.classList.remove('is-scrolled'),
    });

    const backToTop = document.getElementById('back-to-top');
    ScrollTrigger.create({
        trigger: document.body,
        start: '100vh top',
        onEnter: () => backToTop.classList.add('is-visible'),
        onLeaveBack: () => backToTop.classList.remove('is-visible'),
    });

    // Animation des barres de compétences (une fois visibles à l'écran)
    document.querySelectorAll('.skill-card').forEach((card) => {
        const fill = card.querySelector('.skill-bar-fill');
        const level = card.dataset.level || 0;

        ScrollTrigger.create({
            trigger: card,
            start: 'top 85%',
            once: true,
            onEnter: () => {
                gsap.to(fill, {
                    width: `${level}%`,
                    duration: 1.4,
                    ease: 'power3.out',
                });
            }
        });
    });

    // Parallaxe douce du titre du Hero pendant le scroll
    gsap.to('.hero-inner', {
        yPercent: -30,
        opacity: 0.2,
        scrollTrigger: {
            trigger: '.hero',
            start: 'top top',
            end: 'bottom top',
            scrub: 1,
        }
    });

    animateHeroTitle();
}

function animateHeroTitle() {
    const lines = document.querySelectorAll('.hero-title-line');

    lines.forEach((line) => {
        const words = line.textContent.trim().split(' ');
        line.innerHTML = words
            .map((word) => `<span class="word-wrap"><span class="word-inner">${word}</span></span>`)
            .join(' ');
    });

    document.querySelectorAll('.word-wrap').forEach((el) => {
        el.style.display = 'inline-block';
        el.style.overflow = 'hidden';
        el.style.verticalAlign = 'top';
    });
    document.querySelectorAll('.word-inner').forEach((el) => {
        el.style.display = 'inline-block';
    });

    gsap.from('.word-inner', {
        yPercent: 120,
        opacity: 0,
        duration: 1.2,
        ease: 'power4.out',
        stagger: 0.06,
        delay: 0.3,
    });
}


/* ================================================================
   6. CURSEUR PERSONNALISÉ
================================================================ */
function initCustomCursor() {
    if (CONFIG.isTouch) {
        document.body.classList.add('no-cursor');
        return;
    }

    const dot = document.getElementById('cursor-dot');
    const outline = document.getElementById('cursor-outline');

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let dotX = targetX, dotY = targetY;
    let outlineX = targetX, outlineY = targetY;

    window.addEventListener('mousemove', (e) => {
        targetX = e.clientX;
        targetY = e.clientY;

        // Sert aussi au parallax de la caméra 3D
        STATE.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
        STATE.mouseY = (e.clientY / window.innerHeight) * 2 - 1;
    });

    function updateCursor() {
        dotX = lerp(dotX, targetX, 0.35);
        dotY = lerp(dotY, targetY, 0.35);
        outlineX = lerp(outlineX, targetX, 0.12);
        outlineY = lerp(outlineY, targetY, 0.12);

        dot.style.transform = `translate(${dotX}px, ${dotY}px) translate(-50%, -50%)`;
        outline.style.transform = `translate(${outlineX}px, ${outlineY}px) translate(-50%, -50%)`;

        requestAnimationFrame(updateCursor);
    }
    updateCursor();

    document.querySelectorAll('[data-cursor="hover"]').forEach((el) => {
        el.addEventListener('mouseenter', () => outline.classList.add('is-hovering'));
        el.addEventListener('mouseleave', () => outline.classList.remove('is-hovering'));
    });

    document.body.style.cursor = 'none';
}


/* ================================================================
   7. NAVIGATION — Header, Burger, Menu mobile
================================================================ */
function initNavigation() {
    const burger = document.getElementById('burger');
    const mobileMenu = document.getElementById('mobile-menu');

    burger.addEventListener('click', () => {
        const isOpen = mobileMenu.classList.toggle('is-open');
        burger.classList.toggle('is-open');
        burger.setAttribute('aria-expanded', String(isOpen));
        document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    document.querySelectorAll('.mobile-link').forEach((link) => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('is-open');
            burger.classList.remove('is-open');
            burger.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        });
    });
}


/* ================================================================
   8. NAVIGATION 3D LIBRE — Clavier (WASD/flèches) + D-pad tactile
   L'utilisateur peut se déplacer à gauche/droite/haut/bas dans la
   scène 3D, en plus de l'avancée automatique pilotée par le scroll.
================================================================ */

/**
 * Réinitialise en douceur la position libre de la caméra (touche R
 * ou bouton compas), en revenant progressivement au centre.
 */
function resetNavOffset() {
    gsap.to(NAV_STATE.offset, {
        x: 0,
        y: 0,
        duration: 1.2,
        ease: 'power3.out',
    });
}

/**
 * Dès que l'utilisateur bouge une première fois, on estompe le HUD
 * (il devient discret mais reste visible, dans un souci de sobriété).
 */
function markNavAsActive() {
    if (NAV_STATE.hasMoved) return;
    NAV_STATE.hasMoved = true;

    const hud = document.getElementById('nav-hud');
    if (hud) {
        gsap.to(hud, { opacity: 0.35, duration: 1.5, delay: 0.4 });
    }
}

/**
 * Écoute le clavier pour piloter le déplacement libre.
 * On ignore les touches si un élément interactif (lien/bouton) a le
 * focus, afin de ne jamais perturber la navigation au clavier classique.
 */
function initKeyboardNav() {
    if (CONFIG.reduceMotion) return;

    const directionalCodes = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyW', 'KeyA', 'KeyS', 'KeyD'];

    window.addEventListener('keydown', (e) => {
        const active = document.activeElement;
        const isFocusingInteractive = active && active !== document.body && active !== document.documentElement;

        if (e.code === 'KeyR' && !isFocusingInteractive) {
            resetNavOffset();
            return;
        }

        if (!directionalCodes.includes(e.code) || isFocusingInteractive) return;

        // Empêche le comportement par défaut du navigateur (ex: scroll aux flèches)
        e.preventDefault();

        if (e.code === 'ArrowLeft' || e.code === 'KeyA') NAV_STATE.flags.left = true;
        if (e.code === 'ArrowRight' || e.code === 'KeyD') NAV_STATE.flags.right = true;
        if (e.code === 'ArrowUp' || e.code === 'KeyW') NAV_STATE.flags.up = true;
        if (e.code === 'ArrowDown' || e.code === 'KeyS') NAV_STATE.flags.down = true;

        markNavAsActive();
    });

    window.addEventListener('keyup', (e) => {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') NAV_STATE.flags.left = false;
        if (e.code === 'ArrowRight' || e.code === 'KeyD') NAV_STATE.flags.right = false;
        if (e.code === 'ArrowUp' || e.code === 'KeyW') NAV_STATE.flags.up = false;
        if (e.code === 'ArrowDown' || e.code === 'KeyS') NAV_STATE.flags.down = false;
    });
}

/**
 * Active le D-pad tactile (visible uniquement sur mobile via CSS).
 * On utilise les Pointer Events pour gérer aussi bien le tactile
 * que le clic souris (utile pour tester sur desktop).
 */
function initTouchDpad() {
    const dpad = document.getElementById('nav-dpad');
    if (!dpad) return;

    dpad.querySelectorAll('.dpad-btn[data-dir]').forEach((btn) => {
        const direction = btn.dataset.dir;

        const start = (e) => {
            e.preventDefault();
            NAV_STATE.flags[direction] = true;
            markNavAsActive();
        };
        const stop = () => {
            NAV_STATE.flags[direction] = false;
        };

        btn.addEventListener('pointerdown', start);
        btn.addEventListener('pointerup', stop);
        btn.addEventListener('pointerleave', stop);
        btn.addEventListener('pointercancel', stop);
    });

    // Bouton central du D-pad : réinitialise la vue
    const resetMobileBtn = document.getElementById('nav-reset-mobile');
    if (resetMobileBtn) {
        resetMobileBtn.addEventListener('click', resetNavOffset);
    }
}

/**
 * Bouton "compas" desktop : réinitialise la vue en un clic.
 */
function initNavResetButton() {
    const btn = document.getElementById('nav-reset-btn');
    if (!btn) return;
    btn.addEventListener('click', resetNavOffset);
}

/**
 * Met à jour la position libre (offset) en fonction des touches
 * actuellement enfoncées. Appelé à chaque frame avec le delta-temps
 * pour un déplacement fluide, indépendant du framerate.
 */
function updateFreeNavOffset(delta) {
    const speed = CONFIG.navSpeed;
    const bounds = CONFIG.navBounds;

    if (NAV_STATE.flags.left) NAV_STATE.offset.x -= speed * delta;
    if (NAV_STATE.flags.right) NAV_STATE.offset.x += speed * delta;
    if (NAV_STATE.flags.up) NAV_STATE.offset.y += speed * delta;
    if (NAV_STATE.flags.down) NAV_STATE.offset.y -= speed * delta;

    // On empêche l'utilisateur de sortir trop loin de la scène
    NAV_STATE.offset.x = THREE.MathUtils.clamp(NAV_STATE.offset.x, -bounds.x, bounds.x);
    NAV_STATE.offset.y = THREE.MathUtils.clamp(NAV_STATE.offset.y, -bounds.y, bounds.y);
}


/* ================================================================
   9. SCÈNE THREE.JS — UNIVERS 3D IMMERSIF ET NAVIGABLE
   Contient : étoiles, poussière, nébuleuses, étoiles filantes,
   tunnel spatial, grille de sol, monolithe central, objets
   flottants, brouillard, lumières et post-processing (bloom).
================================================================ */
function initThreeScene() {
    const canvas = document.getElementById('webgl-canvas');

    /* ---------- Scène, caméra, rendu ---------- */
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.FogExp2(0x000000, 0.0022);

    const camera = new THREE.PerspectiveCamera(
        65,
        window.innerWidth / window.innerHeight,
        0.1,
        2000
    );
    camera.position.z = 8;

    const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    /* ---------- Lumières ---------- */
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
    scene.add(ambientLight);

    const keyLight = new THREE.PointLight(0xffffff, 3, 80, 2);
    keyLight.position.set(0, 2, 10);
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(0xffffff, 1.5, 300, 2);
    rimLight.position.set(-30, 15, -150);
    scene.add(rimLight);

    /* ---------- Champ d'étoiles (starfield) ---------- */
    const starCount = CONFIG.isMobile ? 3000 : 7000;
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
        const i3 = i * 3;
        starPositions[i3] = (Math.random() - 0.5) * 500;
        starPositions[i3 + 1] = (Math.random() - 0.5) * 500;
        starPositions[i3 + 2] = (Math.random() - 0.5) * 1200;
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));

    const starMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 1.15,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
    });
    const starField = new THREE.Points(starGeometry, starMaterial);
    scene.add(starField);

    /* ---------- Poussière flottante proche caméra ---------- */
    const dustCount = CONFIG.isMobile ? 1000 : 2500;
    const dustGeometry = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(dustCount * 3);

    for (let i = 0; i < dustCount; i++) {
        const i3 = i * 3;
        dustPositions[i3] = (Math.random() - 0.5) * 60;
        dustPositions[i3 + 1] = (Math.random() - 0.5) * 40;
        dustPositions[i3 + 2] = (Math.random() - 0.5) * 200;
    }
    dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));

    const dustMaterial = new THREE.PointsMaterial({
        color: 0xcccccc,
        size: 0.6,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });
    const dustField = new THREE.Points(dustGeometry, dustMaterial);
    scene.add(dustField);

    /* ---------- Tunnel spatial (anneaux successifs) ---------- */
    const ringCount = 40;
    const rings = [];
    const ringGroup = new THREE.Group();

    for (let i = 0; i < ringCount; i++) {
        const radius = 6 + Math.random() * 1.8;
        const geometry = new THREE.TorusGeometry(radius, 0.025, 8, 64);
        const material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.14,
        });
        const ring = new THREE.Mesh(geometry, material);
        ring.position.z = -i * 26;
        ring.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.4;
        ring.userData.rotSpeed = (Math.random() - 0.5) * 0.002;
        rings.push(ring);
        ringGroup.add(ring);
    }
    scene.add(ringGroup);

    /* ---------- Objets flottants (géométries variées) ---------- */
    const floatingObjects = [];
    const floatGroup = new THREE.Group();
    const floatGeometries = [
        new THREE.IcosahedronGeometry(1, 0),
        new THREE.OctahedronGeometry(1, 0),
        new THREE.TorusKnotGeometry(0.7, 0.22, 100, 16),
        new THREE.DodecahedronGeometry(1, 0),
    ];
    const floatCount = CONFIG.isMobile ? 8 : 18;

    for (let i = 0; i < floatCount; i++) {
        const geo = floatGeometries[Math.floor(Math.random() * floatGeometries.length)];
        const isWireframe = Math.random() > 0.5;
        const mat = new THREE.MeshStandardMaterial({
            color: 0xe8e8e8,
            metalness: 0.85,
            roughness: 0.25,
            wireframe: isWireframe,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(
            (Math.random() - 0.5) * 22,
            (Math.random() - 0.5) * 14,
            -Math.random() * 950
        );
        mesh.scale.setScalar(0.4 + Math.random() * 0.9);
        mesh.userData = {
            speed: 0.15 + Math.random() * 0.3,
            phase: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.012,
            baseY: mesh.position.y,
        };
        floatingObjects.push(mesh);
        floatGroup.add(mesh);
    }
    scene.add(floatGroup);

    /* ---------- Nébuleuses lumineuses (sprites additifs) ----------
       Génère une texture radiale en canvas pour simuler des nuages
       de gaz cosmique lumineux, dispersés le long du tunnel. */
    function createNebulaTexture() {
        const size = 256;
        const canvas2d = document.createElement('canvas');
        canvas2d.width = size;
        canvas2d.height = size;
        const ctx = canvas2d.getContext('2d');

        const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
        gradient.addColorStop(0, 'rgba(255,255,255,0.55)');
        gradient.addColorStop(0.4, 'rgba(255,255,255,0.15)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);

        const texture = new THREE.CanvasTexture(canvas2d);
        texture.needsUpdate = true;
        return texture;
    }

    const nebulaTexture = createNebulaTexture();
    const nebulaSprites = [];
    const nebulaGroup = new THREE.Group();
    const nebulaCount = CONFIG.isMobile ? 14 : 30;

    for (let i = 0; i < nebulaCount; i++) {
        const material = new THREE.SpriteMaterial({
            map: nebulaTexture,
            color: 0xffffff,
            transparent: true,
            opacity: 0.05 + Math.random() * 0.09,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        const sprite = new THREE.Sprite(material);
        const scale = 40 + Math.random() * 90;
        sprite.scale.set(scale, scale, 1);
        sprite.position.set(
            (Math.random() - 0.5) * 140,
            (Math.random() - 0.5) * 80,
            -Math.random() * 950
        );
        sprite.userData = {
            baseY: sprite.position.y,
            speed: 0.05 + Math.random() * 0.08,
            phase: Math.random() * Math.PI * 2,
        };
        nebulaSprites.push(sprite);
        nebulaGroup.add(sprite);
    }
    scene.add(nebulaGroup);

    /* ---------- Étoiles filantes ----------
       Un petit pool d'objets réutilisés (pattern "object pooling")
       pour éviter de créer/détruire de la géométrie en boucle. */
    function resetShootingStar(star) {
        star.position.set(
            (Math.random() - 0.5) * 200,
            25 + Math.random() * 40,
            -Math.random() * 600 - 50
        );
        star.userData.velocity = new THREE.Vector3(
            -8 - Math.random() * 6,
            -6 - Math.random() * 4,
            0
        );
        star.userData.life = 0;
        star.userData.maxLife = 2 + Math.random() * 2;
        star.userData.delay = Math.random() * 9; // Apparition différée aléatoire
        star.visible = false;
    }

    function createShootingStars() {
        const count = CONFIG.isMobile ? 3 : 6;
        const starsArray = [];

        for (let i = 0; i < count; i++) {
            const segmentCount = 10;
            const points = [];
            for (let j = 0; j < segmentCount; j++) {
                points.push(new THREE.Vector3(0, 0, j * -0.6));
            }
            const geometry = new THREE.BufferGeometry().setFromPoints(points);

            // Dégradé d'opacité le long de la traînée via des couleurs par sommet
            const colors = new Float32Array(segmentCount * 3);
            for (let j = 0; j < segmentCount; j++) {
                const fade = 1 - j / segmentCount;
                colors[j * 3] = fade;
                colors[j * 3 + 1] = fade;
                colors[j * 3 + 2] = fade;
            }
            geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

            const material = new THREE.LineBasicMaterial({
                vertexColors: true,
                transparent: true,
                opacity: 0.85,
                blending: THREE.AdditiveBlending,
            });

            const line = new THREE.Line(geometry, material);
            resetShootingStar(line);
            starsArray.push(line);
            scene.add(line);
        }
        return starsArray;
    }

    function updateShootingStars(starsArray, delta) {
        starsArray.forEach((star) => {
            if (star.userData.delay > 0) {
                star.userData.delay -= delta;
                return;
            }
            star.visible = true;
            star.position.addScaledVector(star.userData.velocity, delta * 10);
            star.userData.life += delta;

            if (star.userData.life > star.userData.maxLife) {
                resetShootingStar(star);
            }
        });
    }

    const shootingStars = createShootingStars();

    /* ---------- Grille de sol ----------
       Aide l'utilisateur à percevoir son altitude lorsqu'il navigue
       librement (haut/bas) dans la scène : un repère visuel classique
       des univers spatiaux/futuristes. */
    const groundGrid = new THREE.GridHelper(2400, 120, 0x555555, 0x222222);
    groundGrid.position.y = -16;
    groundGrid.position.z = -400;
    groundGrid.material.transparent = true;
    groundGrid.material.opacity = 0.25;
    scene.add(groundGrid);

    /* ---------- Monolithe central (point de repère spectaculaire) ----------
       Une immense géométrie en fil de fer qui tourne lentement,
       rencontrée par l'utilisateur au fil de son avancée dans le tunnel. */
    const centerpieceGeometry = new THREE.TorusKnotGeometry(6, 1.6, 220, 32);
    const centerpieceMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        wireframe: true,
        metalness: 0.9,
        roughness: 0.1,
        transparent: true,
        opacity: 0.5,
    });
    const centerpiece = new THREE.Mesh(centerpieceGeometry, centerpieceMaterial);
    centerpiece.position.set(0, 0, -520);
    scene.add(centerpiece);

    /* ---------- Post-processing : Bloom (effet de lueur) ---------- */
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        CONFIG.isMobile ? 0.55 : 0.9,
        0.45,
        0.15
    );
    composer.addPass(bloomPass);
    composer.addPass(new OutputPass());

    /* ---------- Mouvement de caméra : scroll + souris + navigation libre ---------- */
    const TUNNEL_DEPTH = 950;
    let currentRotX = 0, currentRotY = 0;

    function updateCamera() {
        // --- Avancée dans le tunnel selon le scroll ---
        const targetZ = 8 - STATE.scrollProgress * TUNNEL_DEPTH;
        camera.position.z = lerp(camera.position.z, targetZ, 0.06);

        // --- Rotation de la caméra selon la position de la souris ---
        const targetRotY = STATE.mouseX * 0.15;
        const targetRotX = -STATE.mouseY * 0.1;
        currentRotX = lerp(currentRotX, targetRotX, 0.05);
        currentRotY = lerp(currentRotY, targetRotY, 0.05);
        camera.rotation.x = currentRotX;
        camera.rotation.y = currentRotY;

        // --- Position latérale : parallax souris + navigation libre (clavier/D-pad) ---
        const targetX = STATE.mouseX * 1.2 + NAV_STATE.offset.x;
        const targetY = -STATE.mouseY * 0.8 + NAV_STATE.offset.y;
        camera.position.x = lerp(camera.position.x, targetX, 0.08);
        camera.position.y = lerp(camera.position.y, targetY, 0.08);

        // La lumière clé suit la caméra pour toujours éclairer ce qui l'entoure
        keyLight.position.z = camera.position.z + 10;
        keyLight.position.x = camera.position.x;
        keyLight.position.y = camera.position.y + 2;
    }

    /* ---------- Boucle de rendu ---------- */
    let lastFrameTime = 0;

    function animate(time) {
        const t = time * 0.001;
        // Delta-temps en secondes, pour des animations indépendantes du framerate
        const delta = lastFrameTime ? Math.min((time - lastFrameTime) / 1000, 0.1) : 0.016;
        lastFrameTime = time;

        // Navigation libre (met à jour NAV_STATE.offset selon les touches actives)
        updateFreeNavOffset(delta);
        updateCamera();

        // Rotation très lente des champs de particules
        starField.rotation.z += 0.00015;
        dustField.rotation.z -= 0.0003;

        // Rotation douce de chaque anneau du tunnel
        rings.forEach((ring) => {
            ring.rotation.z += ring.userData.rotSpeed;
        });

        // Flottement organique des objets 3D
        floatingObjects.forEach((obj) => {
            obj.rotation.x += obj.userData.rotSpeed;
            obj.rotation.y += obj.userData.rotSpeed * 1.4;
            obj.position.y = obj.userData.baseY + Math.sin(t * obj.userData.speed + obj.userData.phase) * 0.6;
        });

        // Léger flottement vertical des nébuleuses (effet de "respiration")
        nebulaSprites.forEach((sprite) => {
            sprite.position.y = sprite.userData.baseY + Math.sin(t * sprite.userData.speed + sprite.userData.phase) * 3;
        });

        // Étoiles filantes
        updateShootingStars(shootingStars, delta);

        // Rotation lente et continue du monolithe central
        centerpiece.rotation.x += 0.0015;
        centerpiece.rotation.y += 0.0022;

        composer.render();
    }

    /* ---------- Redimensionnement responsive ---------- */
    function onResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        renderer.setSize(width, height);
        composer.setSize(width, height);
        bloomPass.setSize(width, height);
    }

    return { animate, onResize };
}


/* ================================================================
   10. RÉVÉLATIONS AU SCROLL (Intersection Observer)
================================================================ */
function initScrollReveal() {
    const revealElements = document.querySelectorAll('[data-reveal]');
    revealElements.forEach((el) => el.classList.add('reveal'));

    const observer = new IntersectionObserver(
        (entries, obs) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    const delay = (index % 6) * 0.08;
                    entry.target.style.transitionDelay = `${delay}s`;
                    entry.target.classList.add('is-visible');
                    obs.unobserve(entry.target);
                }
            });
        },
        {
            threshold: 0.15,
            rootMargin: '0px 0px -10% 0px',
        }
    );

    revealElements.forEach((el) => observer.observe(el));
}


/* ================================================================
   11. EFFETS INTERACTIFS — Tilt 3D & Magnétisme
================================================================ */
function initTiltEffect() {
    if (CONFIG.isTouch || CONFIG.reduceMotion) return;

    document.querySelectorAll('.tilt-card').forEach((card) => {
        const maxTilt = 8;

        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const relX = (e.clientX - rect.left) / rect.width - 0.5;
            const relY = (e.clientY - rect.top) / rect.height - 0.5;

            gsap.to(card, {
                rotateX: -relY * maxTilt,
                rotateY: relX * maxTilt,
                transformPerspective: 800,
                duration: 0.4,
                ease: 'power2.out',
            });
        });

        card.addEventListener('mouseleave', () => {
            gsap.to(card, {
                rotateX: 0,
                rotateY: 0,
                duration: 0.6,
                ease: 'elastic.out(1, 0.5)',
            });
        });
    });
}

function initMagneticEffect() {
    if (CONFIG.isTouch || CONFIG.reduceMotion) return;

    document.querySelectorAll('.magnetic').forEach((el) => {
        const strength = 0.35;

        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            const relX = e.clientX - rect.left - rect.width / 2;
            const relY = e.clientY - rect.top - rect.height / 2;

            gsap.to(el, {
                x: relX * strength,
                y: relY * strength,
                duration: 0.4,
                ease: 'power2.out',
            });
        });

        el.addEventListener('mouseleave', () => {
            gsap.to(el, {
                x: 0,
                y: 0,
                duration: 0.6,
                ease: 'elastic.out(1, 0.4)',
            });
        });
    });
}


/* ================================================================
   12. CONTACT — Copie presse-papiers (Email + Discord)
   Chaque bouton [.copy-btn] porte ses propres attributs :
   data-copy-value   -> texte à copier
   data-copy-message -> message affiché dans le toast
================================================================ */
function initCopyButtons() {
    const buttons = document.querySelectorAll('.copy-btn');
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');

    buttons.forEach((button) => {
        button.addEventListener('click', async () => {
            const valueToCopy = button.dataset.copyValue;
            const message = button.dataset.copyMessage || 'Copié !';

            try {
                await navigator.clipboard.writeText(valueToCopy);
            } catch (err) {
                // Solution de secours pour les navigateurs plus anciens
                const tempInput = document.createElement('textarea');
                tempInput.value = valueToCopy;
                document.body.appendChild(tempInput);
                tempInput.select();
                document.execCommand('copy');
                document.body.removeChild(tempInput);
            }

            toastMessage.textContent = message;
            showToast(toast);
        });
    });
}

function showToast(toastEl) {
    toastEl.classList.add('is-visible');

    clearTimeout(toastEl._hideTimeout);
    toastEl._hideTimeout = setTimeout(() => {
        toastEl.classList.remove('is-visible');
    }, 2600);
}


/* ================================================================
   13. DIVERS — Footer & Bouton retour en haut
================================================================ */
function initMisc() {
    const yearEl = document.getElementById('current-year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    const backToTop = document.getElementById('back-to-top');
    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.getElementById('mobile-menu').classList.remove('is-open');
            document.getElementById('burger').classList.remove('is-open');
        }
    });

    // Après un délai, si l'utilisateur n'a jamais utilisé la navigation
    // libre, on estompe quand même légèrement le HUD (discrétion premium).
    setTimeout(() => {
        if (!NAV_STATE.hasMoved) {
            const hud = document.getElementById('nav-hud');
            if (hud) gsap.to(hud, { opacity: 0.4, duration: 1.5 });
        }
    }, 7000);
}


/* ================================================================
   14. INITIALISATION GÉNÉRALE
================================================================ */
window.addEventListener('load', () => {

   window.addEventListener('load', async () => {

    await recordVisit();

    initPreloader(() => {

        // Curseur + navigation (léger, instantané)
        initCustomCursor();
        initNavigation();
        initMisc();

        // Navigation 3D libre (clavier + D-pad tactile)
        initKeyboardNav();
        initTouchDpad();
        initNavResetButton();

        // Scroll fluide + animations liées au scroll
        initLenis();
        initScrollTrigger();
        initScrollReveal();

        // Effets interactifs (tilt, magnétisme)
        initTiltEffect();
        initMagneticEffect();

        // Contact
        initCopyButtons();

        // --- Scène 3D Three.js ---
        const scene3D = initThreeScene();

        gsap.ticker.add((time) => {
            scene3D.animate(time * 1000);
        });

        const handleResize = debounce(() => scene3D.onResize(), 200);
        const resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(document.documentElement);
        window.addEventListener('resize', handleResize);
    });
});
