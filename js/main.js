// Application Orchestrator & Dynamic Renderer
class MainApp {
    constructor() {
        this.cursor = new CustomCursor();
        this.scroll = new ScrollManager(universe3D);
        this.init();
    }

    async init() {
        AnimationController.initLoader(() => {
            AnimationController.revealHero();
        });

        await this.renderDynamicContent();
        this.bindContactForm();
        dbModule.trackPageView();
    }

    async renderDynamicContent() {
        // Load settings
        const settings = await dbModule.getSettings();
        if (settings.general) {
            if (settings.general.logoText) document.getElementById('site-logo').innerText = settings.general.logoText;
        }

        // Load Categories & Videos
        const categories = await dbModule.getCategories();
        const filterBar = document.getElementById('video-categories-filter');
        filterBar.innerHTML = `<button class="filter-btn active" data-category="all">Tous</button>` + 
            categories.map(c => `<button class="filter-btn" data-category="${c.id}">${c.name}</button>`).join('');

        const videos = await dbModule.getVideos();
        const videosGrid = document.getElementById('videos-grid');
        
        videosGrid.innerHTML = videos.map(v => `
            <div class="glass-card video-card-item" data-category="${v.category_id}">
                <div style="position:relative; width:100%; height:180px; overflow:hidden; border-radius:8px; margin-bottom:1rem;">
                    <img src="${v.thumbnail_url || 'https://via.placeholder.com/400x225'}" style="width:100%; height:100%; object-fit:cover;"/>
                </div>
                <h3>${v.title}</h3>
                <p style="color: var(--text-muted); font-size: 0.9rem; margin-top:0.5rem;">${v.description || ''}</p>
                <a href="${v.video_url}" target="_blank" class="btn btn-secondary" style="margin-top:1rem; display:inline-block;">Visionner</a>
            </div>
        `).join('');

        // Bind filter event listeners
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                const cat = e.target.dataset.category;

                document.querySelectorAll('.video-card-item').forEach(card => {
                    if (cat === 'all' || card.dataset.category === cat) {
                        card.style.display = 'block';
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        });

        // Load Youtubeurs
        const youtubeurs = await dbModule.getYoutubeurs();
        const ytbGrid = document.getElementById('youtubeurs-list');
        ytbGrid.innerHTML = youtubeurs.map(y => `
            <div class="glass-card creator-card">
                <img src="${y.avatar_url || 'https://via.placeholder.com/100'}" class="creator-avatar" alt="${y.name}"/>
                <h4>${y.name}</h4>
                <a href="${y.channel_url}" target="_blank" class="btn btn-secondary btn-full">Voir la Chaîne</a>
            </div>
        `).join('');

        // Instantiate 3D card meshes dynamically in Three.js universe
        videos.slice(0, 3).forEach((_, idx) => {
            universe3D.create3DCardMesh(new THREE.Vector3((idx - 1) * 5, -8, 0));
        });
    }

    bindContactForm() {
        const form = document.getElementById('contact-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('contact-name').value;
            const email = document.getElementById('contact-email').value;
            const subject = document.getElementById('contact-subject').value;
            const message = document.getElementById('contact-message').value;

            const feedback = document.getElementById('contact-feedback');
            const { error } = await dbModule.sendMessage(name, email, subject, message);

            if (!error) {
                feedback.innerText = "Message envoyé avec succès !";
                feedback.style.color = "#4ade80";
                form.reset();
            } else {
                feedback.innerText = "Une erreur est survenue.";
                feedback.style.color = "#ef4444";
            }
        });
    }
}

window.app = new MainApp();