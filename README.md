# mezzmonteur.com

Portfolio statique hébergé par GitHub Pages, avec un dashboard d'administration.

## Routes d'administration

- `/login/` : connexion administrateur ;
- `/dashboard/` : dashboard protégé par une session de 8 heures dans l'onglet courant ;
- `/login.html` et `/dashboard.html` : anciennes URL redirigées vers les routes propres.

Le dashboard renvoie automatiquement vers `/login/` lorsqu'aucune session valide n'existe. Le bouton de déconnexion détruit cette session.

## Statistiques

GitHub Pages ne fournit ni base de données ni code serveur. Le suivi est donc volontairement local : `tracker.js` enregistre les visites dans `localStorage` et le dashboard construit les graphiques à partir de ces données. Cela permet au dashboard de fonctionner sans endpoints `/web4856` inexistants et sans erreurs réseau.

Conséquence : les chiffres concernent uniquement le navigateur courant. Pour agréger les visites de tous les visiteurs, il faudra connecter un service d'analytics ou une API serveur.

## Limite de sécurité de GitHub Pages

Le mot de passe n'est pas stocké en clair : seul un vérificateur PBKDF2 est versionné. Toutefois, un site entièrement statique ne peut pas assurer une authentification serveur réelle. La garde actuelle empêche l'accès normal au dashboard sans passer par `/login/`, mais elle ne doit pas protéger des données sensibles contre une personne capable de modifier le JavaScript dans son navigateur.

Pour une protection forte, placer `/dashboard/` derrière Cloudflare Access, Netlify Identity ou un backend qui valide une session avec un cookie `HttpOnly`.

## Changer le mot de passe

Exécuter ce script, puis remplacer `salt` et `verifier` dans `js/auth.js` :

```bash
python3 - <<'PY'
import base64, getpass, hashlib, secrets
password = getpass.getpass('Nouveau mot de passe : ').encode()
salt = secrets.token_bytes(16)
iterations = 210_000
verifier = hashlib.pbkdf2_hmac('sha256', password, salt, iterations, 32)
print('salt:', base64.b64encode(salt).decode())
print('verifier:', base64.b64encode(verifier).decode())
PY
```

## Tester localement

```bash
python3 -m http.server 8080
```

Puis ouvrir `http://localhost:8080/login/`. Il ne faut pas ouvrir les fichiers directement avec `file://`, car les modules JavaScript et Web Crypto nécessitent un contexte web.
