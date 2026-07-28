// Cinematic 3D Scroll Synchronization with GSAP
gsap.registerPlugin(ScrollTrigger);

class ScrollManager {
    constructor(universe) {
        this.universe = universe;
        this.initTimeline();
    }

    initTimeline() {
        const camera = this.universe.camera;

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: "#smooth-wrapper",
                start: "top top",
                end: "bottom bottom",
                scrub: 1.2
            }
        });

        // Hero -> Videos Section Camera Travel
        tl.to(camera.position, {
            z: 8,
            y: -5,
            x: 2,
            duration: 2,
            ease: "power2.inOut"
        })
        .to(camera.rotation, {
            x: 0.2,
            y: -0.1,
            duration: 2,
            ease: "power2.inOut"
        }, 0);

        // Videos -> Youtubeurs Section Camera Travel
        tl.to(camera.position, {
            z: 12,
            y: -15,
            x: -3,
            duration: 2,
            ease: "power2.inOut"
        })
        .to(camera.rotation, {
            x: -0.1,
            y: 0.2,
            duration: 2,
            ease: "power2.inOut"
        }, "<");

        // Youtubeurs -> Contact Section
        tl.to(camera.position, {
            z: 5,
            y: -25,
            x: 0,
            duration: 2,
            ease: "power2.inOut"
        });
    }
}