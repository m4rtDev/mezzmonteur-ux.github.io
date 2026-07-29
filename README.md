# mezzmonteur.com

Portfolio statique hébergé par GitHub Pages, avec un dashboard d'administration et des statistiques globales basées sur Cloudflare Workers et D1.

## Routes du site & administration

- `/` : portfolio principal ;
- `/login/` : connexion administrateur ;
- `/dashboard/` : dashboard protégé affichant les statistiques de visite complètes ;
- `/confidentialite/` : page de politique de confidentialité et gestion du consentement RGPD ;
- `/login.html`, `/dashboard.html` et `/confidentialite.html` : redirections de compatibilité.

Le dashboard renvoie automatiquement vers `/login/` lorsqu'aucune session valide n'existe. Le bouton de déconnexion détruit la session.

## Statistiques globales (Cloudflare Worker & D1)

Le système de suivi enregistre chaque visite dans une base de données Cloudflare D1 via un Cloudflare Worker (`src/worker.js`).

Chaque visite contient :
- **Date** (horodatage ISO)
- **Page**
- **Adresse IP complète**
- **Ville**
- **Pays**
- **Navigateur**
- **Appareil** (Desktop, Mobile, Tablette)
- **Provenance** (Referrer)

### Rétention des données (365 jours)

Les données de visite sont automatiquement conservées pendant **365 jours**. Un job quotidien (Cron Trigger `0 3 * * *`) nettoie automatiquement les entrées antérieures à 365 jours dans la base D1.

### Base de données D1 & Migration

Les schémas D1 sont configurés dans `wrangler.toml` et la migration initiale se trouve dans `migrations/0001_initial.sql`.

Pour exécuter la migration D1 :

```bash
npx wrangler d1 migrations apply mezz_analytics_db --remote
```

### Bandeau de consentement & RGPD

Un bandeau de consentement s'affiche lors de la première visite pour demander l'accord de l'utilisateur ("Accepter" ou "Refuser"). Le consentement est stocké localement (`mezz_consent_v1`). L'utilisateur peut modifier ses choix à tout moment sur la page `/confidentialite/`.

## Lancer les tests

```bash
npm test
```

## Tester localement

```bash
python3 -m http.server 8080
```

Puis ouvrir `http://localhost:8080/login/` ou `http://localhost:8080/dashboard/`.
