import { assert } from '@othila-academy/lab';
import { callsOf, steady } from './calls.mjs';

export const title = 'Voir le N+1';
export const instructions = `Demande { events(limit: 10) { title organizer { name } } } dans la Sandbox et lis le compte
(extensions, sous la réponse) : c'est la requête de la page de ton client. Puis ajoute participants { name }
et relis-le.`;

export const prediction = {
  promptId: 'n1-organisateurs',
  question: 'Combien d’accès pour events(limit: 10) avec organizer { name } ?',
  choices: ['2', '10', '11'],
  expected: '11'
};

const BASE = '{ event(id: "1") { title } }';

// Le compte de event(id: "1") avec un champ de plus doit dépasser celui de event(id: "1") seul.
async function adds(gql, field, message) {
  await steady(gql);
  const base = (await callsOf(gql, BASE, 'compteur-present')).calls;
  const more = (await callsOf(gql, `{ event(id: "1") { title ${field} } }`, 'compteur-present'))
    .calls;
  assert(more > base, message);
}

export const checks = [
  {
    id: 'organisateur-compte',
    label: 'ajouter organizer { name } à event(id: "1") ajoute au moins un accès',
    run: async ({ gql }) =>
      adds(
        gql,
        'organizer { name }',
        'Ajouter organizer ne change pas le compte : Event.organizer passe-t-il par le dépôt ?'
      )
  },
  {
    id: 'participants-compte',
    label: 'ajouter participants { name } à event(id: "1") ajoute au moins un accès',
    run: async ({ gql }) =>
      adds(
        gql,
        'participants { name }',
        'Ajouter participants ne change pas le compte : Event.participants passe-t-il par le dépôt ?'
      )
  }
];

export const hints = [
  'Un résolveur de champ s’exécute combien de fois dans une liste ?',
  'Une fois pour la liste, puis une fois par évènement pour l’organisateur.',
  '1 + 10.'
];
