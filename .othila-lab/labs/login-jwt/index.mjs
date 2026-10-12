export const title = 'Qui es-tu ?';
export const steps = ['login', 'me'];
export const duration = '40 min';
export const summary = `N'importe qui peut encore tout faire sur ton API.
Avant de protéger quoi que ce soit, le serveur doit savoir qui lui parle : tu ajoutes la connexion par jeton JWT.`;
export const objectives = [
  'vérifier un mot de passe chiffré et signer un jeton JWT',
  'lire le jeton dans l’en-tête Authorization et construire le contexte de la requête',
  'reconnaître l’utilisateur à chaque requête, sans session côté serveur'
];
