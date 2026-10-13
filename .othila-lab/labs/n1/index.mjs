export const title = 'Le problème N+1';
export const steps = ['compter', 'observer', 'corriger'];
export const duration = '45 min';
export const summary = `Un résolveur de champ s'exécute une fois par objet : une liste de N évènements et leurs organisateurs
coûte N+1 accès aux données. Tu mesures ces accès, tu vois le N+1, puis DataLoader les regroupe.`;
export const objectives = [
  'mesurer les accès aux données d’une requête avant d’optimiser',
  'expliquer d’où viennent le N et le +1',
  'regrouper les accès d’une requête avec un DataLoader créé par requête'
];
