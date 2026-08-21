const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1540395613345157241/8wSx8CRq4db3j-G33-6HwfQ3jMxxaAeNm_RHwGATgEqHj8Li-19_csg7y8fmVEEfteIp";

const IP_API = 'https://api.ipify.org?format=json';

async function getVisitorInfo() {
    let ip = 'Inconnue';

    try {
        const response = await fetch(IP_API);
        const data = await response.json();
        ip = data.ip || 'Inconnue';
    } catch {
    }

    const userAgent = navigator.userAgent;


    let browser = 'Inconnu';

    if (userAgent.includes('Edg/')) {
        browser = 'Microsoft Edge';
    } else if (userAgent.includes('OPR/') || userAgent.includes('Opera')) {
        browser = 'Opera';
    } else if (userAgent.includes('Chrome/')) {
        browser = 'Google Chrome';
    } else if (userAgent.includes('Firefox/')) {
        browser = 'Mozilla Firefox';
    } else if (userAgent.includes('Safari/')) {
        browser = 'Safari';
    }

    
    let os = 'Inconnu';

    if (userAgent.includes('Windows')) {
        os = 'Windows';
    } else if (userAgent.includes('Android')) {
        os = 'Android';
    } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
        os = 'iOS';
    } else if (userAgent.includes('Mac OS X')) {
        os = 'macOS';
    } else if (userAgent.includes('Linux')) {
        os = 'Linux';
    }

    return {
        ip,
        page: window.location.href,
        browser,
        os,
        resolution: `${screen.width}x${screen.height}`,
        language: navigator.language,
        date: new Date().toLocaleString('fr-FR', {
            timeZone: 'Europe/Paris'
        })
    };
}


async function sendToDiscord(visitor) {
    if (!DISCORD_WEBHOOK_URL || DISCORD_WEBHOOK_URL === "COLLE_TON_WEBHOOK_ICI") {
        console.warn("Webhook Discord non configuré.");
        return;
    }

    try {
        await fetch(DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                embeds: [{
                    title: '📊 Nouvelle visite',
                    color: 0x000000,
                    fields: [
                        {
                            name: '🌐 IP',
                            value: visitor.ip,
                            inline: true
                        },
                        {
                            name: '📄 Page',
                            value: visitor.page,
                            inline: false
                        },
                        {
                            name: '🌍 Navigateur',
                            value: visitor.browser,
                            inline: true
                        },
                        {
                            name: '💻 OS',
                            value: visitor.os,
                            inline: true
                        },
                        {
                            name: '🖥️ Résolution',
                            value: visitor.resolution,
                            inline: true
                        },
                        {
                            name: '🗣️ Langue',
                            value: visitor.language,
                            inline: true
                        },
                        {
                            name: '🕐 Date / heure',
                            value: visitor.date,
                            inline: true
                        }
                    ],
                    footer: {
                        text: 'Mezz — Visitor Tracker'
                    }
                }]
            })
        });
    } catch (error) {
        console.error('Erreur Discord :', error);
    }
}


async function trackVisit() {
    try {
        const visitor = await getVisitorInfo();

        console.log('📊 Visiteur détecté :', visitor);

        await sendToDiscord(visitor);
    } catch (error) {
        console.error('Erreur du tracker :', error);
    }
}


if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', trackVisit, {
        once: true
    });
} else {
    trackVisit();
}
