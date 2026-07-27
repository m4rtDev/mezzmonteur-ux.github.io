/*
 * Lightweight hand-rolled 3D wireframe engine (no external libraries).
 * Renders rotating polyhedra on 2D canvases using basic perspective projection.
 * Kept strictly monochrome (black / white / grays) to match the site's DA.
 */
(function () {
    'use strict';

    function makeIcosahedron(scale) {
        var t = (1 + Math.sqrt(5)) / 2;
        var raw = [
            [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
            [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
            [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]
        ];
        var verts = raw.map(function (p) {
            var len = Math.sqrt(p[0] * p[0] + p[1] * p[1] + p[2] * p[2]);
            return [p[0] / len * scale, p[1] / len * scale, p[2] / len * scale];
        });
        var edges = [
            [0,1],[0,5],[0,7],[0,10],[0,11],
            [1,5],[1,7],[1,8],[1,9],
            [2,3],[2,4],[2,6],[2,10],[2,11],
            [3,4],[3,6],[3,8],[3,9],
            [4,5],[4,9],[4,11],
            [5,9],[5,11],
            [6,7],[6,8],[6,10],
            [7,8],[7,10],
            [8,9],
            [10,11]
        ];
        return { verts: verts, edges: edges };
    }

    function makeOctahedron(scale) {
        var verts = [
            [scale, 0, 0], [-scale, 0, 0],
            [0, scale, 0], [0, -scale, 0],
            [0, 0, scale], [0, 0, -scale]
        ];
        var edges = [
            [0,2],[0,3],[0,4],[0,5],
            [1,2],[1,3],[1,4],[1,5],
            [2,4],[2,5],[3,4],[3,5]
        ];
        return { verts: verts, edges: edges };
    }

    function rotateX(p, a) {
        var c = Math.cos(a), s = Math.sin(a);
        return [p[0], p[1] * c - p[2] * s, p[1] * s + p[2] * c];
    }
    function rotateY(p, a) {
        var c = Math.cos(a), s = Math.sin(a);
        return [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c];
    }
    function rotateZ(p, a) {
        var c = Math.cos(a), s = Math.sin(a);
        return [p[0] * c - p[1] * s, p[0] * s + p[1] * c, p[2]];
    }

    function WireScene(opts) {
        this.canvas = opts.canvas;
        this.ctx = this.canvas.getContext('2d');
        this.shape = opts.shape;
        this.speed = opts.speed || { x: 0.12, y: 0.18, z: 0.05 };
        this.perspective = opts.perspective || 480;
        this.color = opts.color || '0,0,0';
        this.lineWidth = opts.lineWidth || 1;
        this.dotRadius = opts.dotRadius || 2;
        this.parallax = !!opts.parallax;
        this.parallaxStrength = opts.parallaxStrength || 0.35;
        this.angle = { x: Math.random() * Math.PI * 2, y: Math.random() * Math.PI * 2, z: 0 };
        this.mouse = { x: 0, y: 0 };
        this.dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.paused = false;
        this._bindResize();
        this.resize();
        if (this.parallax) this._bindMouse();
        this._bindVisibility();
    }

    WireScene.prototype._bindResize = function () {
        var self = this;
        window.addEventListener('resize', function () { self.resize(); });
    };

    WireScene.prototype._bindVisibility = function () {
        var self = this;
        this._io = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) { self.paused = !e.isIntersecting; });
        }, { threshold: 0.01 });
        this._io.observe(this.canvas);
    };

    WireScene.prototype._bindMouse = function () {
        var self = this;
        window.addEventListener('mousemove', function (e) {
            var nx = (e.clientX / window.innerWidth) * 2 - 1;
            var ny = (e.clientY / window.innerHeight) * 2 - 1;
            self.mouse.x = nx;
            self.mouse.y = ny;
        }, { passive: true });
    };

    WireScene.prototype.resize = function () {
        var rect = this.canvas.getBoundingClientRect();
        this.w = rect.width;
        this.h = rect.height;
        this.canvas.width = this.w * this.dpr;
        this.canvas.height = this.h * this.dpr;
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    };

    WireScene.prototype.project = function (p) {
        var pz = p[2] + this.perspective;
        var scale = this.perspective / pz;
        return [
            p[0] * scale + this.w / 2,
            p[1] * scale + this.h / 2,
            scale
        ];
    };

    WireScene.prototype.render = function () {
        if (this.paused || !this.w || !this.h) return;
        var ctx = this.ctx;
        ctx.clearRect(0, 0, this.w, this.h);

        this.angle.x += this.speed.x * 0.01;
        this.angle.y += this.speed.y * 0.01;
        this.angle.z += this.speed.z * 0.01;

        var tiltX = this.angle.x + (this.parallax ? this.mouse.y * this.parallaxStrength : 0);
        var tiltY = this.angle.y + (this.parallax ? this.mouse.x * this.parallaxStrength : 0);

        var projected = this.shape.verts.map(function (v) {
            var p = rotateX(v, tiltX);
            p = rotateY(p, tiltY);
            p = rotateZ(p, this.angle.z);
            return p;
        }, this);

        var proj2d = projected.map(this.project, this);

        ctx.lineWidth = this.lineWidth;
        this.shape.edges.forEach(function (edge) {
            var a = proj2d[edge[0]];
            var b = proj2d[edge[1]];
            var depth = (a[2] + b[2]) / 2;
            var alpha = Math.max(0.08, Math.min(0.9, depth * 0.75));
            ctx.strokeStyle = 'rgba(' + this.color + ',' + alpha + ')';
            ctx.beginPath();
            ctx.moveTo(a[0], a[1]);
            ctx.lineTo(b[0], b[1]);
            ctx.stroke();
        }, this);

        proj2d.forEach(function (p) {
            var alpha = Math.max(0.15, Math.min(1, p[2] * 0.9));
            ctx.beginPath();
            ctx.arc(p[0], p[1], this.dotRadius * p[2], 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(' + this.color + ',' + alpha + ')';
            ctx.fill();
        }, this);
    };

    function loop(scenes) {
        scenes.forEach(function (s) { s.render(); });
        requestAnimationFrame(function () { loop(scenes); });
    }

    document.addEventListener('DOMContentLoaded', function () {
        var scenes = [];
        var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        var heroCanvas = document.getElementById('heroWire');
        if (heroCanvas) {
            scenes.push(new WireScene({
                canvas: heroCanvas,
                shape: makeIcosahedron(140),
                speed: { x: reducedMotion ? 0 : 0.16, y: reducedMotion ? 0 : 0.22, z: 0.04 },
                color: '0,0,0',
                lineWidth: 1.1,
                dotRadius: 1.6,
                parallax: true,
                parallaxStrength: 0.5
            }));
        }

        var aboutCanvas = document.getElementById('aboutWire');
        if (aboutCanvas) {
            scenes.push(new WireScene({
                canvas: aboutCanvas,
                shape: makeOctahedron(90),
                speed: { x: reducedMotion ? 0 : 0.08, y: reducedMotion ? 0 : 0.11, z: 0.02 },
                color: '0,0,0',
                lineWidth: 1,
                dotRadius: 1.4
            }));
        }

        var contactCanvas = document.getElementById('contactWire');
        if (contactCanvas) {
            scenes.push(new WireScene({
                canvas: contactCanvas,
                shape: makeIcosahedron(110),
                speed: { x: reducedMotion ? 0 : 0.1, y: reducedMotion ? 0 : 0.14, z: 0.03 },
                color: '0,0,0',
                lineWidth: 1,
                dotRadius: 1.4
            }));
        }

        if (scenes.length && !reducedMotion) loop(scenes);
        else if (scenes.length) scenes.forEach(function (s) { s.render(); });
    });
})();
