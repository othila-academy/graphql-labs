export const title = 'Déclarer les droits dans le schéma';
export const steps = ['declarer', 'appliquer'];
export const duration = '40 min';
export const summary = `Les gardes requireUser se répètent dans chaque mutation.
Tu déclares la règle une fois, dans le schéma, avec une directive @auth, et un transformateur l'applique partout.`;
export const objectives = [
  'déclarer une directive de schéma avec un argument',
  'écrire un transformateur qui enveloppe les résolveurs des champs qui portent la directive',
  'distinguer ce qui tient dans le schéma de ce qui reste dans les résolveurs'
];
