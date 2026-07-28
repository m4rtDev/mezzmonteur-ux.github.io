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
   8. Scène Three.js (univers 3D)
   9. Révélations au scroll (Intersection Observer)
   10. Effets interactifs (tilt 3D, magnétisme)
   11. Section contact (copie e-mail)
   12. Divers (footer, back-to-top)
   13. Initialisation générale
================================================================ */

/* ================================================================
   1. IMPORTS THREE.JS
   Les chemins "three" et "three/addons/" sont résolus grâce à
   l'import map défini dans le <head> du fichier index.html.
================================================================ */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';


/* ================================================================
   2. CONFIGURATION GLOBALE & ÉTAT PARTAGÉ
================================================================ */
const CONFIG = {
    // Détection tactile : sert à désactiver le curseur personnalisé
    isTouch: window.matchMedia('(pointer: coarse)').matches,
    // Respect de la préférence utilisateur "réduire les animations"
    reduceMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    // Écran considéré comme "petit" (réduit la charge du rendu 3D)
    isMobile: window.innerWidth < 900,
};

// État global partagé entre les modules (scroll, souris)
const STATE = {
    scrollProgress: 0,   // 0 -> 1 : avancement du scroll sur toute la page
    mouseX: 0,           // Position souris normalisée entre -1 et 1
    mouseY: 0,
};

/**
 * Petite fonction utilitaire : limite l'exécution d'une fonction
 * (évite de recalculer à chaque pixel lors d'un resize par exemple).
 */
function debounce(fn, delay = 200) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

/**
 * Fonction d'interpolation linéaire (lerp).
 * Permet de créer des mouvements doux et progressifs (easing manuel).
 * ex: lerp(0, 10, 0.1) rapproche progressivement 0 de 10.
 */
function lerp(start, end, amount) {
    return start + (end - start) * amount;
}


/* ================================================================
   3. PRÉCHARGEUR
   Anime un compteur de 0 à 100%, puis fait disparaître l'écran
   de chargement avec une transition élégante.
================================================================ */
function initPreloader(onFinish) {
    const preloader = document.getElementById('preloader');
    const counterEl = document.getElementById('preloader-counter');
    const barFill = document.getElementById('preloader-bar-fill');

    // Objet "proxy" animé par GSAP (on anime un nombre, pas un élément DOM)
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
   Lenis intercepte le scroll natif et l'interpole pour donner
   une sensation "premium", sans à-coups.
================================================================ */
function initLenis() {
    const lenis = new Lenis({
        duration: 1.2,                          // Durée de l'interpolation
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Easing "expo out"
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 1.5,
    });

    // On synchronise Lenis avec la boucle d'animation de GSAP (gsap.ticker)
    // plutôt que d'utiliser un requestAnimationFrame séparé : cela évite
    // les doubles boucles et garde tout parfaitement synchronisé.
    gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    // À chaque scroll, on met à jour ScrollTrigger et notre état global
    lenis.on('scroll', (e) => {
        STATE.scrollProgress = e.progress; // valeur de 0 à 1
        ScrollTrigger.update();
    });

    return lenis;
}


/* ================================================================
   5. GSAP SCROLLTRIGGER — ANIMATIONS GLOBALES LIÉES AU SCROLL
================================================================ */
function initScrollTrigger() {
    gsap.registerPlugin(ScrollTrigger);

    // --- Barre de progression de scroll en haut de page ---
    const progressBar = document.getElementById('scroll-progress');
    ScrollTrigger.create({
        trigger: document.body,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => {
            progressBar.style.width = `${self.progress * 100}%`;
        }
    });

    // --- Header qui rétrécit + glassmorphism au scroll ---
    const header = document.getElementById('site-header');
    ScrollTrigger.create({
        trigger: document.body,
        start: '80px top',
        onEnter: () => header.classList.add('is-scrolled'),
        onLeaveBack: () => header.classList.remove('is-scrolled'),
    });

    // --- Bouton "retour en haut" apparaît après 1 écran de scroll ---
    const backToTop = document.getElementById('back-to-top');
    ScrollTrigger.create({
        trigger: document.body,
        start: '100vh top',
        onEnter: () => backToTop.classList.add('is-visible'),
        onLeaveBack: () => backToTop.classList.remove('is-visible'),
    });

    // --- Animation des barres de compétences (scrub sur leur propre section) ---
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

    // --- Parallaxe douce du titre du Hero pendant le scroll ---
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

    // --- Animation d'entrée du titre principal (lettres/mots en cascade) ---
    animateHeroTitle();
}

/**
 * Découpe le titre du Hero en "mots" enveloppés dans des spans,
 * puis les fait apparaître en cascade avec GSAP.
 * (Alternative "maison" au plugin payant SplitText de GSAP)
 */
function animateHeroTitle() {
    const lines = document.querySelectorAll('.hero-title-line');

    lines.forEach((line) => {
        const words = line.textContent.trim().split(' ');
        line.innerHTML = words
            .map((word) => `<span class="word-wrap"><span class="word-inner">${word}</span></span>`)
            .join(' ');
    });

    // Styles nécessaires injectés en JS pour ne pas alourdir le CSS statique
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
   Composé d'un point central (rapide) et d'un cercle externe (lent),
   ce qui crée un effet de "traînée" fluide. Désactivé sur tactile.
================================================================ */
function initCustomCursor() {
    if (CONFIG.isTouch) {
        document.body.classList.add('no-cursor');
        return; // On arrête ici : pas de curseur custom sur mobile/tablette
    }

    const dot = document.getElementById('cursor-dot');
    const outline = document.getElementById('cursor-outline');

    // Positions cibles (souris) et positions actuelles (interpolées)
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let dotX = targetX, dotY = targetY;
    let outlineX = targetX, outlineY = targetY;

    window.addEventListener('mousemove', (e) => {
        targetX = e.clientX;
        targetY = e.clientY;

        // Met à jour l'état global (utilisé aussi par la scène 3D pour le parallax)
        STATE.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
        STATE.mouseY = (e.clientY / window.innerHeight) * 2 - 1;
    });

    // Boucle d'animation du curseur : le point suit vite, le cercle suit lentement
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

    // Agrandissement du curseur au survol des éléments interactifs
    document.querySelectorAll('[data-cursor="hover"]').forEach((el) => {
        el.addEventListener('mouseenter', () => outline.classList.add('is-hovering'));
        el.addEventListener('mouseleave', () => outline.classList.remove('is-hovering'));
    });

    // On masque le curseur natif partout (géré en CSS via cursor:none idéalement,
    // mais on le fait aussi ici par sécurité sur le body)
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

    // Ferme le menu mobile quand on clique sur un lien
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
   8. SCÈNE THREE.JS — UNIVERS 3D IMMERSIF
   Contient : étoiles, poussière, tunnel spatial, objets flottants,
   brouillard, lumières et post-processing (bloom).
   La caméra avance dans la scène en fonction du scroll et réagit
   légèrement à la position de la souris (effet de vol/parallax).
================================================================ */
function initThreeScene() {
    const canvas = document.getElementById('webgl-canvas');

    /* ---------- Scène, caméra, rendu ---------- */
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    // Le brouillard exponentiel donne une vraie sensation de profondeur :
    // les objets lointains se fondent progressivement dans le noir.
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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap à 2 pour la perf
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

    /* ---------- Champ d'étoiles (starfield) ----------
       Des milliers de points répartis dans un grand volume,
       principalement devant la caméra (z négatif). */
    const starCount = CONFIG.isMobile ? 3000 : 7000;
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
        const i3 = i * 3;
        starPositions[i3] = (Math.random() - 0.5) * 500;       // x
        starPositions[i3 + 1] = (Math.random() - 0.5) * 500;   // y
        starPositions[i3 + 2] = (Math.random() - 0.5) * 1200;  // z (sur tout le tunnel)
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

    /* ---------- Poussière flottante proche caméra ----------
       Particules plus petites et plus rapprochées, avec fondu additif
       pour créer un effet lumineux (glow) au passage. */
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
        blending: THREE.AdditiveBlending, // Additive = superposition lumineuse
        depthWrite: false,
    });
    const dustField = new THREE.Points(dustGeometry, dustMaterial);
    scene.add(dustField);

    /* ---------- Tunnel spatial (anneaux successifs) ----------
       Des anneaux (torus) fins placés le long de l'axe Z, que la
       caméra traverse un par un en avançant : sensation de "voyage". */
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

    /* ---------- Objets flottants (géométries variées) ----------
       Quelques formes low-poly qui flottent lentement, avec un
       léger effet de "respiration" (mouvement sinusoïdal). */
    const floatingObjects = [];
    const floatGroup = new THREE.Group();
    const floatGeometries = [
        new THREE.IcosahedronGeometry(1, 0),
        new THREE.OctahedronGeometry(1, 0),
        new THREE.TorusKnotGeometry(0.7, 0.22, 100, 16),
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

    /* ---------- Post-processing : Bloom (effet de lueur) ---------- */
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        CONFIG.isMobile ? 0.55 : 0.9,  // strength (intensité)
        0.45,                          // radius
        0.15                           // threshold (seuil de luminosité)
    );
    composer.addPass(bloomPass);
    composer.addPass(new OutputPass());

    /* ---------- Mouvement de caméra piloté par le scroll et la souris ---------- */
    const TUNNEL_DEPTH = 950; // Distance totale parcourue à travers le tunnel
    let currentRotX = 0, currentRotY = 0;

    function updateCamera() {
        // --- Avancée dans le tunnel selon le scroll (lerp pour la fluidité) ---
        const targetZ = 8 - STATE.scrollProgress * TUNNEL_DEPTH;
        camera.position.z = lerp(camera.position.z, targetZ, 0.06);

        // --- Légère rotation de la caméra selon la position de la souris ---
        const targetRotY = STATE.mouseX * 0.15;
        const targetRotX = -STATE.mouseY * 0.1;
        currentRotX = lerp(currentRotX, targetRotX, 0.05);
        currentRotY = lerp(currentRotY, targetRotY, 0.05);
        camera.rotation.x = currentRotX;
        camera.rotation.y = currentRotY;

        // --- Légère translation latérale (parallax supplémentaire) ---
        camera.position.x = lerp(camera.position.x, STATE.mouseX * 1.2, 0.04);
        camera.position.y = lerp(camera.position.y, -STATE.mouseY * 0.8, 0.04);

        // La lumière clé suit la caméra pour toujours éclairer ce qui l'entoure
        keyLight.position.z = camera.position.z + 10;
        keyLight.position.x = camera.position.x;
    }

    /* ---------- Boucle de rendu ---------- */
    function animate(time) {
        const t = time * 0.001;

        updateCamera();

        // Rotation très lente des champs de particules (vivant, jamais statique)
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
   9. RÉVÉLATIONS AU SCROLL (Intersection Observer)
   Toutes les cartes/textes possédant l'attribut [data-reveal]
   apparaissent en fondu + translation dès qu'ils entrent à l'écran.
================================================================ */
function initScrollReveal() {
    const revealElements = document.querySelectorAll('[data-reveal]');

    // Ajoute la classe .reveal (styles de départ définis en CSS)
    revealElements.forEach((el) => el.classList.add('reveal'));

    const observer = new IntersectionObserver(
        (entries, obs) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    // Léger décalage (stagger) pour les éléments groupés
                    const delay = (index % 6) * 0.08;
                    entry.target.style.transitionDelay = `${delay}s`;
                    entry.target.classList.add('is-visible');
                    obs.unobserve(entry.target); // On ne joue l'animation qu'une fois
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
   10. EFFETS INTERACTIFS — Tilt 3D & Magnétisme
================================================================ */

/**
 * Effet "tilt" : les cartes s'inclinent légèrement en suivant
 * la position du curseur, comme si elles avaient du relief.
 */
function initTiltEffect() {
    if (CONFIG.isTouch || CONFIG.reduceMotion) return; // Désactivé sur mobile / accessibilité

    document.querySelectorAll('.tilt-card').forEach((card) => {
        const maxTilt = 8; // degrés maximum d'inclinaison

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

/**
 * Effet "magnétique" : certains boutons se déplacent légèrement
 * vers le curseur lorsqu'on les survole, puis reviennent au repos.
 */
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
   11. SECTION CONTACT — Copier l'adresse e-mail
================================================================ */
function initContactCopy() {
    const button = document.getElementById('copy-email-btn');
    const emailText = document.getElementById('contact-email').textContent.trim();
    const toast = document.getElementById('toast');

    button.addEventListener('click', async () => {
        try {
            // API moderne du presse-papiers (nécessite HTTPS, GitHub Pages OK)
            await navigator.clipboard.writeText(emailText);
        } catch (err) {
            // Solution de secours pour les navigateurs plus anciens
            const tempInput = document.createElement('textarea');
            tempInput.value = emailText;
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
        }

        showToast(toast);
    });
}

/**
 * Affiche une notification temporaire ("Adresse copiée !") avec GSAP.
 */
function showToast(toastEl) {
    toastEl.classList.add('is-visible');

    // On annule un éventuel timer précédent pour éviter les conflits
    clearTimeout(toastEl._hideTimeout);
    toastEl._hideTimeout = setTimeout(() => {
        toastEl.classList.remove('is-visible');
    }, 2600);
}


/* ================================================================
   12. DIVERS — Footer & Bouton retour en haut
================================================================ */
function initMisc() {
    // Année dynamique dans le footer
    const yearEl = document.getElementById('current-year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // Clic sur "retour en haut" : scroll fluide vers le haut de page
    const backToTop = document.getElementById('back-to-top');
    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Fermeture douce du menu mobile si on clique en dehors (accessibilité)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.getElementById('mobile-menu').classList.remove('is-open');
            document.getElementById('burger').classList.remove('is-open');
        }
    });
}


/* ================================================================
   13. INITIALISATION GÉNÉRALE
   On attend le chargement complet de la page avant de démarrer
   les scripts lourds (Three.js, GSAP...), pour un premier rendu
   plus rapide et fluide.
================================================================ */
window.addEventListener('load', () => {

    // --- Étape 1 : démarrer le préchargeur ---
    initPreloader(() => {
        // --- Une fois le préchargeur terminé, on lance tout le reste ---

        // Curseur + navigation (léger, instantané)
        initCustomCursor();
        initNavigation();
        initMisc();

        // Scroll fluide + animations liées au scroll
        initLenis();
        initScrollTrigger();
        initScrollReveal();

        // Effets interactifs (tilt, magnétisme)
        initTiltEffect();
        initMagneticEffect();

        // Contact
        initContactCopy();

        // --- Scène 3D Three.js ---
        const scene3D = initThreeScene();

        // La boucle de rendu 3D est synchronisée avec gsap.ticker
        // pour rester parfaitement alignée avec Lenis et ScrollTrigger.
        gsap.ticker.add((time) => {
            scene3D.animate(time * 1000);
        });

        // Redimensionnement : on utilise ResizeObserver (plus moderne
        // et plus fiable que l'event "resize" classique) avec un
        // debounce pour ne pas surcharger le calcul.
        const handleResize = debounce(() => scene3D.onResize(), 200);
        const resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(document.documentElement);

        // Filet de sécurité : on écoute aussi "resize" pour les
        // navigateurs qui géreraient mal ResizeObserver sur <html>.
        window.addEventListener('resize', handleResize);
    });
});
