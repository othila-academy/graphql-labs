import { componentTest } from '@othila-academy/lab';

export const title = 'Charger la suite dans le client';
export const instructions = `Dans packages/client-react, EventsList demande la première page (offset 0, limit 10) et eventsCount,
et affiche sous la liste un bouton « Voir plus » qui charge la page suivante avec fetchMore. Les pages se mettent
bout à bout : configure le cache pour events dans apollo.js. Le bouton disparaît quand tous les évènements
sont affichés.`;

export const prediction = {
  promptId: 'pagination-fetchmore-cache',
  question:
    'Sans configurer le cache, que montre la liste après fetchMore({ variables: { offset: 10 } }) ?',
  choices: [
    'les vingt premiers évènements',
    'seulement les dix suivants',
    'toujours les dix premiers'
  ],
  expected: 'toujours les dix premiers'
};

export const checks = [
  componentTest({
    id: 'premiere-page',
    label: 'EventsList affiche les dix premiers évènements et un bouton « Voir plus »',
    file: 'tests/voir-plus.test.jsx'
  }),
  componentTest({
    id: 'page-suivante',
    label: 'un clic sur « Voir plus » ajoute les évènements suivants sans retirer les premiers',
    file: 'tests/voir-plus.test.jsx'
  }),
  componentTest({
    id: 'fin-de-liste',
    label: 'une fois tous les évènements affichés, « Voir plus » disparaît',
    file: 'tests/voir-plus.test.jsx'
  })
];

export const hints = [
  'useQuery renvoie aussi de quoi demander une autre page de la même requête.',
  'fetchMore({ variables: { offset: data.events.length } }) ; dans apollo.js, une politique de champ pour Query.events qui fusionne les pages.',
  "new InMemoryCache({ typePolicies: { Query: { fields: { events: offsetLimitPagination(['category']) } } } }), offsetLimitPagination venant de @apollo/client/utilities"
];
