import React from 'react';
import profilePhoto from '../assets/pp_de_mezz.png';

function getYouTubeVideoId(url) {
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (shortMatch) {
    return shortMatch[1];
  }

  const longMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
  return longMatch ? longMatch[1] : '';
}

function getYouTubeThumbnail(url) {
  const videoId = getYouTubeVideoId(url);
  return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : '';
}

const portfolioContent = {
  profileImage: profilePhoto,
  bio: "Je transforme des idees brutes en montages courts nets, intenses et memorables. Ce portfolio pose une base premium noir et blanc, prete a accueillir ta vraie image, tes reels et tes collaborations.",
  software: [
    { name: 'Adobe Premiere Pro' },
    { name: 'Adobe After Effects' },
    { name: 'Adobe Audition' },
  ],
  stats: [
    { value: 'Shorts', label: 'Formats rapides et impactants' },
    { value: 'TikTok', label: 'Hook, rythme, retention' },
    { value: 'Trailers', label: 'Montages de lancement et reveal' },
    { value: 'Intros', label: 'Identites video courtes et propres' },
  ],
  services: [
    {
      title: 'Montage court',
      description: "Coupe precise, tempo fort et structure pensee pour retenir l'attention des premieres secondes.",
    },
    {
      title: 'Packaging video',
      description: 'Habillage, transitions, sous-titres, sound design et finition visuelle coherente.',
    },
    {
      title: 'Direction creative',
      description: "Une presentation plus premium pour donner a la chaine, au reel ou au projet une vraie presence.",
    },
  ],
  contactLinks: [
    { label: 'Discord', value: 'jesappellemezz', href: '#' },
    { label: 'X / Twitter', value: 'Voir le post', href: 'https://x.com/i/status/2033200072565912030' },
    { label: 'YouTube', value: '@mezzmonteur', href: 'https://www.youtube.com/@mezzmonteur' },
    {
      label: 'Playlist',
      value: 'Playlist complete',
      href: 'https://www.youtube.com/playlist?list=PLr6Ba9RZO-sZ-AjnjAxozsWwqyTn204Md',
    },
  ],
  featuredVideos: [
    {
      format: 'Short vertical',
      href: 'https://youtu.be/-_bcmHst_Yc',
      thumbnail: getYouTubeThumbnail('https://youtu.be/-_bcmHst_Yc'),
    },
    {
      format: 'Montage court',
      href: 'https://youtu.be/fMvX_PeXom4',
      thumbnail: getYouTubeThumbnail('https://youtu.be/fMvX_PeXom4'),
    },
    {
      format: 'TikTok edit',
      href: 'https://youtu.be/qulAzY_eMTE',
      thumbnail: getYouTubeThumbnail('https://youtu.be/qulAzY_eMTE'),
    },
    {
      format: 'Trailer court',
      href: 'https://youtu.be/sFIP1reqB_4',
      thumbnail: getYouTubeThumbnail('https://youtu.be/sFIP1reqB_4'),
    },
    {
      format: 'Short gaming',
      href: 'https://youtu.be/AfmDTQgVIVk',
      thumbnail: getYouTubeThumbnail('https://youtu.be/AfmDTQgVIVk'),
    },
    {
      format: 'Selection client',
      href: 'https://www.youtube.com/shorts/mXBvYss0AVI',
      thumbnail: getYouTubeThumbnail('https://www.youtube.com/shorts/mXBvYss0AVI'),
    },
  ],
  collaborations: [
    {
      name: 'Cubi Game',
      audience: '+100k abonnes',
      href: 'https://www.youtube.com/@cubi-game6913',
      avatar:
        'https://yt3.googleusercontent.com/einN5wa9bMaQ_-cna0F8ZrExNG9nvBKZnCZCObLQHOOsYnmsMiZt9l8G0inbGP9t2uxmLR9JcA=s160-c-k-c0x00ffffff-no-rj',
    },
    {
      name: 'Stick On The Place',
      audience: '+16k abonnes',
      href: 'https://www.youtube.com/@StickOnThePlace',
      avatar:
        'https://yt3.googleusercontent.com/QHR_66W9GHkWd966LnzauXfYa8xtqAjV_SJcVWWtG3ptaMCLqdMIwWJ2xcpQBoEjCorTKJKf=s160-c-k-c0x00ffffff-no-rj',
    },
  ],
};

function ProfileVisual({ profileImage }) {
  if (profileImage) {
    return (
      <div className="profile-shell">
        <img className="profile-photo" src={profileImage} alt="Portrait de mezz" />
      </div>
    );
  }

  return (
    <div className="profile-shell profile-shell-placeholder" aria-label="Placeholder du profil">
      <div className="profile-monogram">
        <span>M</span>
      </div>
      <p>Photo a ajouter</p>
    </div>
  );
}

function copyDiscordTag() {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText('jesappellemezz').catch(() => {});
  }
}

function Home() {
  const {
    profileImage,
    bio,
    software,
    stats,
    services,
    contactLinks,
    featuredVideos,
    collaborations,
  } = portfolioContent;

  return (
    <main className="portfolio-page" id="top">
      <div className="ambient-stage" aria-hidden="true">
        <div className="ambient-orb ambient-orb-one" />
        <div className="ambient-orb ambient-orb-two" />
        <div className="ambient-grid" />
        <div className="ambient-beams">
          <span />
          <span />
          <span />
        </div>
        <div className="ambient-particles">
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>
      <div className="page-noise" aria-hidden="true" />
      <div className="page-glow page-glow-left" aria-hidden="true" />
      <div className="page-glow page-glow-right" aria-hidden="true" />

      <section className="hero section-shell">
        <div className="hero-copy">
          <p className="eyebrow">Portfolio editorial</p>
          <h1>mezz</h1>
          <p className="hero-role">Monteur video</p>
          <p className="hero-bio">{bio}</p>

          <div className="hero-actions">
            <a className="button-primary" href="#portfolio">
              Voir la selection
            </a>
            <a className="button-secondary" href="#contact">
              Me contacter
            </a>
            <button className="button-secondary discord-hero-button" type="button" onClick={copyDiscordTag}>
              Copier mon pseudo Discord
            </button>
          </div>

          <div className="hero-meta">
            {stats.map((item) => (
              <article className="meta-card" key={item.value}>
                <span>{item.value}</span>
                <p>{item.label}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="hero-visual">
          <ProfileVisual profileImage={profileImage} />
          <div className="hero-note">
            <span className="hero-note-label">Direction</span>
            <p>Univers noir et blanc, propre, contraste fort, sensation premium.</p>
          </div>
        </div>
      </section>

      <section className="section-shell info-grid" aria-label="Apercu du profil">
        <article className="panel-card">
          <p className="panel-kicker">Logiciels</p>
          <h2>Mes outils de travail</h2>
          <ul className="software-list">
            {software.map((tool) => (
              <li key={tool.name}>{tool.name}</li>
            ))}
          </ul>
        </article>

        <article className="panel-card panel-card-quote">
          <p className="panel-kicker">Positionnement</p>
          <h2>Des formats courts avec une presence visuelle claire.</h2>
        </article>
      </section>

      <section className="section-shell services-section" id="services">
        <div className="section-heading">
          <p className="eyebrow">Services</p>
          <h2>Formats maitrises</h2>
        </div>

        <div className="services-grid">
          {services.map((service, index) => (
            <article className="service-card" key={service.title}>
              <span className="service-index" aria-hidden="true">
                0{index + 1}
              </span>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-shell portfolio-section" id="portfolio">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Selection</p>
            <h2>Montages mis en avant</h2>
          </div>
        </div>

        <div className="video-grid">
          {featuredVideos.map((video) => (
            <a className="video-card" href={video.href} key={video.href} target="_blank" rel="noreferrer">
              <div className="video-thumb" aria-hidden="true">
                {video.thumbnail ? (
                  <img className="video-thumb-image" src={video.thumbnail} alt="" />
                ) : null}
                <span>Voir</span>
              </div>
              <div className="video-card-body">
              </div>
            </a>
          ))}
        </div>
      </section>

      <section className="section-shell collab-section" id="collabs">
        <div className="section-heading">
          <p className="eyebrow">Collaborations</p>
          <h2>Partenaires et chaines a mettre en avant</h2>
        </div>

        <div className="collab-grid">
          {collaborations.map((collab) => (
            <a className="collab-card" href={collab.href} key={collab.name} target="_blank" rel="noreferrer">
              <img className="collab-avatar-image" src={collab.avatar} alt="" />
              <div className="collab-copy">
                <h3>{collab.name}</h3>
                <p className="collab-audience">{collab.audience}</p>
              </div>
              <span className="collab-action" aria-hidden="true">
                <svg viewBox="0 0 24 24" role="presentation">
                  <path d="M10 8.5v7l6-3.5-6-3.5Z" fill="currentColor" />
                  <path d="M22 12c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2s10 4.48 10 10Zm-1.6 0A8.4 8.4 0 1 0 12 20.4 8.4 8.4 0 0 0 20.4 12Z" fill="currentColor" />
                </svg>
              </span>
            </a>
          ))}
        </div>
      </section>

      <section className="section-shell contact-section" id="contact">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Contact</p>
            <h2>Contact</h2>
          </div>
        </div>

        <div className="contact-grid">
          {contactLinks.map((link) => (
            <a className="contact-card" href={link.href} key={link.label} target="_blank" rel="noreferrer">
              <span className="contact-label">{link.label}</span>
              <strong>{link.value}</strong>
            </a>
          ))}
        </div>
      </section>

      <footer className="section-shell footer-shell">
        <p>mezz — Portfolio noir et blanc pour montage video</p>
        <a href="#top">Revenir en haut</a>
      </footer>
    </main>
  );
}

export default Home;
