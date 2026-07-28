// Global Supabase Integration Module
const SUPABASE_URL = "https://siunhxyxoomjevjaixun.supabase.co/";
const SUPABASE_ANON_KEY = "sb_publishable_3p334dDZuK--JKEc7G8QIg_aR9Z6imi";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const dbModule = {
    // Categories API
    async getCategories() {
        const { data, error } = await supabase.from('categories').select('*').order('name');
        if (error) console.error("Error fetching categories:", error);
        return data || [];
    },
    async createCategory(name, slug) {
        return await supabase.from('categories').insert([{ name, slug }]);
    },

    // Videos API
    async getVideos() {
        const { data, error } = await supabase.from('videos').select('*, categories(name)').order('display_order', { ascending: true });
        if (error) console.error("Error fetching videos:", error);
        return data || [];
    },
    async upsertVideo(videoObj) {
        return await supabase.from('videos').upsert(videoObj);
    },
    async deleteVideo(id) {
        return await supabase.from('videos').delete().eq('id', id);
    },

    // Youtubeurs API
    async getYoutubeurs() {
        const { data, error } = await supabase.from('youtubeurs').select('*').order('display_order', { ascending: true });
        if (error) console.error("Error fetching youtubeurs:", error);
        return data || [];
    },
    async upsertYoutubeur(itemObj) {
        return await supabase.from('youtubeurs').upsert(itemObj);
    },
    async deleteYoutubeur(id) {
        return await supabase.from('youtubeurs').delete().eq('id', id);
    },

    // Messages API
    async sendMessage(sender_name, sender_email, subject, message) {
        return await supabase.from('messages').insert([{ sender_name, sender_email, subject, message }]);
    },
    async getMessages() {
        const { data } = await supabase.from('messages').select('*').order('created_at', { ascending: false });
        return data || [];
    },

    // Analytics API
    async trackPageView() {
        const ua = navigator.userAgent;
        const browser = ua.includes("Chrome") ? "Chrome" : ua.includes("Firefox") ? "Firefox" : "Autre";
        const device = /Mobi|Android/i.test(ua) ? "Mobile" : "Desktop";
        
        await supabase.from('analytics').insert([{
            page: window.location.pathname + window.location.hash,
            user_agent: ua,
            browser,
            device,
            referrer: document.referrer || 'Direct'
        }]);
    },
    async getAnalytics() {
        const { data } = await supabase.from('analytics').select('*').order('created_at', { ascending: false });
        return data || [];
    },

    // Settings API
    async getSettings() {
        const { data } = await supabase.from('settings').select('*');
        const settingsMap = {};
        if (data) {
            data.forEach(item => settingsMap[item.key] = item.value);
        }
        return settingsMap;
    },
    async updateSettings(key, valueObj) {
        return await supabase.from('settings').upsert({ key, value: valueObj, updated_at: new Date() });
    }
};