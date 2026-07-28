// Loader sequence & Text Reveal Animations
class AnimationController {
    static initLoader(onComplete) {
        const bar = document.getElementById('loader-bar');
        const percent = document.getElementById('loader-percent');
        const loader = document.getElementById('loader');

        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.floor(Math.random() * 12) + 1;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                
                setTimeout(() => {
                    loader.classList.add('fade-out');
                    if (onComplete) onComplete();
                }, 400);
            }
            bar.style.width = `${progress}%`;
            percent.innerText = `${progress}%`;
        }, 50);
    }

    static revealHero() {
        gsap.from("#hero-title-text", {
            y: 80,
            opacity: 0,
            duration: 1.2,
            ease: "power4.out"
        });

        gsap.from(".hero-subtitle", {
            y: 40,
            opacity: 0,
            duration: 1,
            delay: 0.3,
            ease: "power3.out"
        });

        gsap.from(".hero-cta", {
            y: 20,
            opacity: 0,
            duration: 0.8,
            delay: 0.6,
            ease: "power3.out"
        });
    }
}