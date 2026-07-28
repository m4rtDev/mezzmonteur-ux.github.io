// Complete Admin Dashboard Logic (#admin route)
class AdminDashboard {
    constructor() {
        this.overlay = document.getElementById('admin-dashboard');
        this.authView = document.getElementById('admin-auth-view');
        this.currentTab = 'tab-videos';
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkRoute();
        window.addEventListener('hashchange', () => this.checkRoute());
    }

    checkRoute() {
        if (window.location.hash === '#admin') {
            this.overlay.classList.remove('hidden');
            this.checkAuth();
        } else {
            this.overlay.classList.add('hidden');
        }
    }

    async checkAuth() {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            this.authView.classList.add('hidden');
            this.showTab(this.currentTab);
        } else {
            this.authView.classList.remove('hidden');
        }
    }

    bindEvents() {
        // Admin Auth Login
        document.getElementById('admin-login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('admin-email').value;
            const password = document.getElementById('admin-password').value;

            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                document.getElementById('admin-auth-error').innerText = "Identifiants invalides.";
            } else {
                this.checkAuth();
            }
        });

        // Logout
        document.getElementById('admin-logout-btn').addEventListener('click', async () => {
            await supabase.auth.signOut();
            this.checkAuth();
        });

        // Tabs Navigation
        document.querySelectorAll('.admin-menu li').forEach(item => {
            item.addEventListener('click', (e) => {
                document.querySelectorAll('.admin-menu li').forEach(li => li.classList.remove('active'));
                e.target.classList.add('active');
                this.showTab(e.target.dataset.tab);
            });
        });

        // Modal close
        document.getElementById('modal-close-btn').addEventListener('click', () => {
            document.getElementById('admin-modal').classList.add('hidden');
        });
    }

    showTab(tabId) {
        this.currentTab = tabId;
        document.querySelectorAll('.admin-tab-content').forEach(tab => tab.classList.add('hidden'));
        const target = document.getElementById(tabId);
        if (target) {
            target.classList.remove('hidden');
            this.loadTabData(tabId);
        }
    }

    async loadTabData(tabId) {
        if (tabId === 'tab-videos') this.renderVideosTable();
        if (tabId === 'tab-youtubeurs') this.renderYoutubeursTable();
        if (tabId === 'tab-analytics') this.renderAnalyticsTable();
    }

    async renderVideosTable() {
        const videos = await dbModule.getVideos();
        const tbody = document.getElementById('admin-videos-table-body');
        tbody.innerHTML = videos.map(v => `
            <tr>
                <td><img src="${v.thumbnail_url || ''}" class="admin-thumb" alt="thumb"/></td>
                <td>${v.title}</td>
                <td>${v.categories?.name || 'N/A'}</td>
                <td>${v.display_order}</td>
                <td>
                    <button class="btn btn-secondary" onclick="adminModule.deleteVideoItem('${v.id}')">Supprimer</button>
                </td>
            </tr>
        `).join('');
    }

    async deleteVideoItem(id) {
        if (confirm("Supprimer la vidéo ?")) {
            await dbModule.deleteVideo(id);
            this.renderVideosTable();
            window.app.renderDynamicContent();
        }
    }

    async renderYoutubeursTable() {
        const data = await dbModule.getYoutubeurs();
        const tbody = document.getElementById('admin-youtubeurs-table-body');
        tbody.innerHTML = data.map(item => `
            <tr>
                <td><img src="${item.avatar_url}" class="admin-thumb" style="border-radius:50%"/></td>
                <td>${item.name}</td>
                <td><a href="${item.channel_url}" target="_blank">Lien</a></td>
                <td>${item.display_order}</td>
                <td>
                    <button class="btn btn-secondary" onclick="adminModule.deleteYoutubeurItem('${item.id}')">Supprimer</button>
                </td>
            </tr>
        `).join('');
    }

    async deleteYoutubeurItem(id) {
        if (confirm("Supprimer cet utilisateur ?")) {
            await dbModule.deleteYoutubeur(id);
            this.renderYoutubeursTable();
            window.app.renderDynamicContent();
        }
    }

    async renderAnalyticsTable() {
        const data = await dbModule.getAnalytics();
        document.getElementById('stat-total-views').innerText = data.length;
        const browsers = new Set(data.map(d => d.browser));
        document.getElementById('stat-unique-browsers').innerText = browsers.size;

        const tbody = document.getElementById('admin-analytics-table-body');
        tbody.innerHTML = data.slice(0, 15).map(a => `
            <tr>
                <td>${new Date(a.created_at).toLocaleDateString()}</td>
                <td>${a.page}</td>
                <td>${a.browser}</td>
                <td>${a.device}</td>
                <td>${a.country}</td>
            </tr>
        `).join('');
    }
}

const adminModule = new AdminDashboard();