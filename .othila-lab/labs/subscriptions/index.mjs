export const title = 'En temps réel';
export const steps = ['migrer', 'souscrire', 'aligner'];
export const duration = '55 min';
export const summary = `Un client veut savoir qu'un évènement vient d'être créé sans interroger le serveur en boucle.
Tu passes le serveur à Express pour ouvrir un WebSocket à côté de HTTP, puis tu publies chaque création
aux abonnés de Subscription.eventCreated, avec le même contexte et la même validation que HTTP.`;
export const objectives = [
  'brancher Apollo Server dans Express, sur un serveur HTTP qu’on crée soi-même',
  'publier un évènement et le pousser aux abonnés d’une subscription',
  'donner au WebSocket le contexte et les règles de validation du chemin HTTP'
];
