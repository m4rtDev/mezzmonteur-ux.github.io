document.addEventListener('DOMContentLoaded', () => {
    
    /* ==========================================
       1. CURSEUR PERSONNALISÉ & MAGNÉTIQUE
    ========================================== */
    const cursor = document.querySelector('.cursor');
    const follower = document.querySelector('.cursor-follower');
    const magnetics = document.querySelectorAll('.magnetic');
    
    let mouseX = 0, mouseY = 0;
    let followerX = 0, followerY = 0;

    // Suivi fluide (Lerp)
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        // Curseur point immédiat
        cursor.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
    });

    function animateCursor() {
        // Formule de Lerp pour la traînée (Trail)
        followerX += (mouseX - followerX) * 0.15;
        followerY += (mouseY - followerY) * 0.15;
        follower.style.transform = `translate(${followerX}px, ${followerY}px)`;
        requestAnimationFrame(animateCursor);
    }
    animateCursor();

    // Effet survol
    magnetics.forEach(btn => {
        btn.addEventListener('mouseenter', () => document.body.classList.add('hovering'));
        btn.addEventListener('mouseleave', () => {
            document.body.classList.remove('hovering');
            btn.style.transform = '';
        });
        
        // Effet Magnétique (déplacement du bouton vers la souris)
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px) scale(1.05)`;
        });
    });

    /* ==========================================
       2. COPIER LE PSEUDO DISCORD
    ========================================== */
    const discordBox = document.getElementById('copy-discord');
    const copyFeedback = discordBox.querySelector('.copy-feedback');
    const discordId = "xmezzedv";

    discordBox.addEventListener('click', () => {
        navigator.clipboard.writeText(discordId).then(() => {
            copyFeedback.textContent = "Copié !";
            copyFeedback.style.background = "#fff";
            copyFeedback.style.color = "#000";
            setTimeout(() => {
                copyFeedback.textContent = "Copier";
                copyFeedback.style.background = "transparent";
                copyFeedback.style.color = "#fff";
            }, 2000);
        });
    });

    /* ==========================================
       3. APPARITION AU SCROLL (Cinématique)
    ========================================== */
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.15 }); // Se déclenche quand 15% de la section est visible

    document.querySelectorAll('.hidden').forEach(section => {
        observer.observe(section);
    });

    /* ==========================================
       4. UNIVERS 3D THREE.JS (Voyage Caméra)
    ========================================== */
    const canvas = document.getElementById('webgl-canvas');
    const scene = new THREE.Scene();
    
    // Brouillard pour masquer la profondeur et donner un effet "fade" aux particules
    scene.fog = new THREE.FogExp2(0x050505, 0.002);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Optimisation performance
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Création des particules (poussière d'étoiles / univers 3D)
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 2000;
    const posArray = new Float32Array(particlesCount * 3);

    for(let i = 0; i < particlesCount * 3; i++) {
        // Répartition aléatoire dans un tunnel long
        posArray[i] = (Math.random() - 0.5) * (Math.random() * 20); // Dispersion X, Y, Z
    }

    // Etirement sur l'axe Z pour donner l'impression de profondeur
    for(let i = 2; i < particlesCount * 3; i+=3) {
        posArray[i] = (Math.random() - 0.5) * 100;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    // Matériau des particules
    const particlesMaterial = new THREE.PointsMaterial({
        size: 0.02,
        color: 0xffffff,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });

    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    // Position initiale
    camera.position.z = 10;

    // Synchronisation du Scroll avec la caméra 3D
    let scrollPercent = 0;
    document.body.onscroll = () => {
        // Calcul du pourcentage de scroll de la page
        scrollPercent = (document.documentElement.scrollTop / (document.documentElement.scrollHeight - document.documentElement.clientHeight));
        
        // La caméra avance dans l'axe Z (vers les négatifs)
        camera.position.z = 10 - (scrollPercent * 30);
        
        // Légère rotation de la scène pour un effet cinématique
        scene.rotation.y = scrollPercent * Math.PI * 0.2;
    };

    // Boucle d'animation
    const clock = new THREE.Clock();
    function animate3D() {
        requestAnimationFrame(animate3D);
        const elapsedTime = clock.getElapsedTime();
        
        // Mouvement naturel continu des particules
        particlesMesh.rotation.y = elapsedTime * 0.02;
        particlesMesh.rotation.x = elapsedTime * 0.01;

        // Interaction douce avec la souris (Parallax)
        camera.position.x += (mouseX * 0.001 - camera.position.x) * 0.05;
        camera.position.y += (-(mouseY * 0.001) - camera.position.y) * 0.05;

        renderer.render(scene, camera);
    }
    animate3D();

    // Redimensionnement de la fenêtre
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
});