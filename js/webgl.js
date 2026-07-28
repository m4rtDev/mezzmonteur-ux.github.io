import * as THREE from 'three';

// Configuration de base
const canvas = document.querySelector('#bgCanvas');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x050505, 0.02); // Brouillard pour la profondeur

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Optimisation GPU

// Création d'objets 3D filaires (Wireframes)
const objects = [];
const material = new THREE.MeshBasicMaterial({ 
    color: 0xffffff, 
    wireframe: true, 
    transparent: true, 
    opacity: 0.15 
});

const geometries = [
    new THREE.IcosahedronGeometry(1, 0),
    new THREE.TorusGeometry(1, 0.4, 16, 32),
    new THREE.OctahedronGeometry(1, 0),
    new THREE.BoxGeometry(1.5, 1.5, 1.5)
];

// Disperser 40 objets dans la profondeur (Z) du site
for(let i = 0; i < 40; i++) {
    const geo = geometries[Math.floor(Math.random() * geometries.length)];
    const mesh = new THREE.Mesh(geo, material);
    
    // Position aléatoire, étalée le long de l'axe Z négatif (pour donner un effet de tunnel/voyage)
    mesh.position.x = (Math.random() - 0.5) * 20;
    mesh.position.y = (Math.random() - 0.5) * 20;
    mesh.position.z = (Math.random() - 1) * 50; 
    
    mesh.rotation.x = Math.random() * Math.PI;
    mesh.rotation.y = Math.random() * Math.PI;
    
    // Vitesse de rotation propre
    mesh.userData = {
        rx: (Math.random() - 0.5) * 0.01,
        ry: (Math.random() - 0.5) * 0.01
    };

    scene.add(mesh);
    objects.push(mesh);
}

// Particules (Poussière stellaire / Volumétrique)
const particlesGeo = new THREE.BufferGeometry();
const particlesCount = 800;
const posArray = new Float32Array(particlesCount * 3);

for(let i = 0; i < particlesCount * 3; i++) {
    posArray[i] = (Math.random() - 0.5) * 60; // Spread x, y, z
}
particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
const particlesMat = new THREE.PointsMaterial({ size: 0.05, color: 0xffffff, transparent: true, opacity: 0.4 });
const particlesMesh = new THREE.Points(particlesGeo, particlesMat);
scene.add(particlesMesh);

// Parallaxe de la souris
let mouseX = 0;
let mouseY = 0;
let targetX = 0;
let targetY = 0;
const windowHalfX = window.innerWidth / 2;
const windowHalfY = window.innerHeight / 2;

if(window.innerWidth > 768) {
    document.addEventListener('mousemove', (event) => {
        mouseX = (event.clientX - windowHalfX);
        mouseY = (event.clientY - windowHalfY);
    });
}

// Animation et Scroll
let scrollY = window.scrollY;
window.addEventListener('scroll', () => {
    scrollY = window.scrollY;
});

const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const elapsedTime = clock.getElapsedTime();

    // La caméra avance dans l'axe Z selon le scroll
    camera.position.z = 5 - (scrollY * 0.01);
    
    // Effet de parallaxe lié à la souris (mouvement doux de la caméra)
    targetX = mouseX * 0.001;
    targetY = mouseY * 0.001;
    camera.rotation.y += 0.05 * (targetX - camera.rotation.y);
    camera.rotation.x += 0.05 * (targetY - camera.rotation.x);

    // Animation individuelle des objets
    objects.forEach(obj => {
        obj.rotation.x += obj.userData.rx;
        obj.rotation.y += obj.userData.ry;
    });

    // Légère rotation continue des particules
    particlesMesh.rotation.y = elapsedTime * 0.05;

    renderer.render(scene, camera);
}

animate();

// Responsive WebGL
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});