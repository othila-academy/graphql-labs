import { assert, componentTest } from '@othila-academy/lab';
import { session } from '../../shared/auth.mjs';

export const title = 'Se connecter depuis le client';
export const instructions = `Écris packages/client-react/src/Login.jsx (export par défaut) : un formulaire avec deux champs
étiquetés « E-mail » et « Mot de passe » et un bouton « Se connecter ». La mutation login renvoie un jeton :
garde-le dans localStorage (clé token), ajoute-le à chaque requête avec un lien de contexte dans apollo.js,
puis affiche le nom de l'utilisateur connecté, lu par la requête me.`;

export const prediction = {
  promptId: 'client-apollo-cache',
  question: 'Après la connexion, la liste des évènements est-elle redemandée au serveur ?',
  choices: ['oui', 'non, elle vient du cache'],
  expected: 'non, elle vient du cache'
};

export const checks = [
  {
    id: 'login-fonctionne',
    label: 'login et me répondent pour Bilal (côté serveur)',
    passesOnStart: true,
    run: async ({ gql }) => {
      const bilal = await session(gql, 'bilal');
      const result = await bilal.gql('{ me { name } }');
      assert(
        result.data?.me?.name === bilal.user.name,
        'login ou me ne répondent plus côté serveur : le lab ne touche qu’au client, qu’as-tu changé dans packages/server-js ?'
      );
    }
  },
  componentTest({
    id: 'jeton-garde',
    label: 'après envoi du formulaire avec Bilal, localStorage contient son jeton (clé token)',
    file: 'tests/connexion.test.jsx'
  }),
  componentTest({
    id: 'jeton-envoye',
    label: 'avec un jeton dans localStorage, client.query({ me }) renvoie Bilal',
    file: 'tests/connexion.test.jsx'
  }),
  componentTest({
    id: 'nom-affiche',
    label: 'après la connexion, Login affiche le nom de Bilal',
    file: 'tests/connexion.test.jsx'
  })
];

export const hints = [
  'Un lien Apollo peut modifier chaque requête avant son départ.',
  'SetContextLink (@apollo/client/link/context) lit le jeton et ajoute l’en-tête authorization ; ApolloLink.from([auth, http]).',
  "new SetContextLink(({ headers }) => ({ headers: { ...headers, authorization: `Bearer ${localStorage.getItem('token')}` } }))"
];
