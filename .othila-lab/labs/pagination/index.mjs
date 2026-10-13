export const title = 'Page après page';
export const steps = ['paginer', 'compter', 'voir-plus'];
export const duration = '50 min';
export const summary = `Les évènements se comptent maintenant par dizaines, et events les renvoie tous d'un coup.
Tu découpes la liste en pages bornées côté serveur, puis le client charge la suite à la demande.`;
export const objectives = [
  'borner une liste avec offset et limit, et refuser une page hors bornes',
  'donner au client le nombre total pour savoir s’il reste des pages',
  'charger la page suivante avec fetchMore et fusionner les pages dans le cache'
];
