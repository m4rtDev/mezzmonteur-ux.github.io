// Custom Interactive Cursor with Trail Canvas
class CustomCursor {
    constructor() {
        this.cursor = document.getElementById('cursor');
        this.follower = document.getElementById('cursor-follower');
        this.trailCanvas = document.getElementById('cursor-trail-canvas');
        this.ctx = this.trailCanvas.getContext('2d');
        
        this.trail = [];
        this.pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        this.mouse = { x: this.pos.x, y: this.pos.y };

        this.init();
    }

    init() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;

            // Immediate dot cursor movement
            this.cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
            
            // Push trail particle
            this.trail.push({ x: e.clientX, y: e.clientY, alpha: 1.0, size: 4 });
        });

        this.bindMagneticElements();
        this.render();
    }

    resizeCanvas() {
        this.trailCanvas.width = window.innerWidth;
        this.trailCanvas.height = window.innerHeight;
    }

    bindMagneticElements() {
        const magnetics = document.querySelectorAll('[data-magnetic]');
        magnetics.forEach(el => {
            el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
            el.addEventListener('mouseleave', () => {
                document.body.classList.remove('cursor-hover');
                el.style.transform = 'translate(0px, 0px)';
            });

            el.addEventListener('mousemove', (e) => {
                const rect = el.getBoundingClientRect();
                const relX = e.clientX - rect.left - rect.width / 2;
                const relY = e.clientY - rect.top - rect.height / 2;

                el.style.transform = `translate(${relX * 0.3}px, ${relY * 0.3}px)`;
            });
        });
    }

    render() {
        // Follower lerp smoothly
        this.pos.x += (this.mouse.x - this.pos.x) * 0.15;
        this.pos.y += (this.mouse.y - this.pos.y) * 0.15;
        this.follower.style.transform = `translate(${this.pos.x}px, ${this.pos.y}px)`;

        // Render Cursor Particle Trail
        this.ctx.clearRect(0, 0, this.trailCanvas.width, this.trailCanvas.height);
        
        for (let i = 0; i < this.trail.length; i++) {
            const p = this.trail[i];
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(99, 102, 241, ${p.alpha})`;
            this.ctx.fill();

            p.alpha -= 0.02;
            p.size *= 0.96;
        }

        this.trail = this.trail.filter(p => p.alpha > 0);
        requestAnimationFrame(() => this.render());
    }
}