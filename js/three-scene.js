// Full Three.js 3D Universe Engine
class ThreeUniverse {
    constructor() {
        this.canvas = document.getElementById('webgl-canvas');
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });
        
        this.floatingObjects = [];
        this.interactiveCards = [];
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.draggedObject = null;
        this.previousMousePosition = { x: 0, y: 0 };

        this.init();
    }

    init() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;

        // Dynamic Camera Setup
        this.camera.position.set(0, 0, 15);

        // Fog & Atmosphere
        this.scene.fog = new THREE.FogExp2(0x050508, 0.035);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const pointLight1 = new THREE.PointLight(0x6366f1, 3, 50);
        pointLight1.position.set(10, 10, 10);
        this.scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0xa855f7, 3, 50);
        pointLight2.position.set(-10, -10, -5);
        this.scene.add(pointLight2);

        this.createParticles();
        this.createPolyhedrons();
        this.bindEvents();
        this.animate();
    }

    createParticles() {
        const particleCount = 1200;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount * 3; i++) {
            positions[i] = (Math.random() - 0.5) * 80;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            size: 0.08,
            color: 0x6366f1,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });

        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }

    createPolyhedrons() {
        const geoms = [
            new THREE.IcosahedronGeometry(1.5, 0),
            new THREE.OctahedronGeometry(1.2, 0),
            new THREE.TetrahedronGeometry(1.8, 0)
        ];

        for (let i = 0; i < 15; i++) {
            const geom = geoms[i % geoms.length];
            const wireframe = new THREE.WireframeGeometry(geom);
            const line = new THREE.LineSegments(wireframe);
            line.material.color.setHex(0xa855f7);
            line.material.transparent = true;
            line.material.opacity = 0.25;

            line.position.set(
                (Math.random() - 0.5) * 40,
                (Math.random() - 0.5) * 40,
                (Math.random() - 0.5) * 40
            );

            line.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
            
            line.userData = {
                rotSpeedX: (Math.random() - 0.5) * 0.005,
                rotSpeedY: (Math.random() - 0.5) * 0.005
            };

            this.floatingObjects.push(line);
            this.scene.add(line);
        }
    }

    // 3D Interactive Card Physics setup
    create3DCardMesh(positionVector) {
        const geometry = new THREE.PlaneGeometry(4, 2.5);
        const material = new THREE.MeshPhysicalMaterial({
            color: 0x1e1e2f,
            metalness: 0.1,
            roughness: 0.2,
            transmission: 0.6,
            thickness: 0.5,
            transparent: true,
            opacity: 0.9,
            reflectivity: 0.9
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(positionVector);
        mesh.userData = { velocity: new THREE.Vector3(), isInteractive: true };

        this.interactiveCards.push(mesh);
        this.scene.add(mesh);
        return mesh;
    }

    bindEvents() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        window.addEventListener('pointerdown', (e) => this.onPointerDown(e));
        window.addEventListener('pointermove', (e) => this.onPointerMove(e));
        window.addEventListener('pointerup', () => this.onPointerUp());
    }

    onPointerDown(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.interactiveCards);

        if (intersects.length > 0) {
            this.draggedObject = intersects[0].object;
            this.previousMousePosition = { x: event.clientX, y: event.clientY };
        }
    }

    onPointerMove(event) {
        if (!this.draggedObject) return;

        const deltaX = event.clientX - this.previousMousePosition.x;
        const deltaY = event.clientY - this.previousMousePosition.y;

        this.draggedObject.rotation.y += deltaX * 0.01;
        this.draggedObject.rotation.x += deltaY * 0.01;

        this.previousMousePosition = { x: event.clientX, y: event.clientY };
    }

    onPointerUp() {
        this.draggedObject = null;
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // Particles continuous rotation
        if (this.particles) {
            this.particles.rotation.y += 0.0005;
            this.particles.rotation.x += 0.0002;
        }

        // Floating wireframes inertia animation
        this.floatingObjects.forEach(obj => {
            obj.rotation.x += obj.userData.rotSpeedX;
            obj.rotation.y += obj.userData.rotSpeedY;
        });

        this.renderer.render(this.scene, this.camera);
    }
}

const universe3D = new ThreeUniverse();