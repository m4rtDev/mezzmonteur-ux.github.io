// Point d'entrée public de l'analytique du site.
//
// Ce module expose le « vrai » export consommé par script.js (et pouvant
// être réutilisé ailleurs). L'implémentation reste centralisée et testée
// dans `analytics-store.js` : on la réexporte ici pour offrir une seule
// source de vérité et éviter la duplication du code de suivi.

export * from './analytics-store.js';

// Export nommé explicite de recordVisit (utilisé par script.js au chargement).
export { recordVisit } from './analytics-store.js';
