import { assert } from '@othila-academy/lab';
import { absentCheck, argumentCheck, dataOf, notFound } from './shared.mjs';

export const title = 'Un évènement par son identifiant';
export const instructions = `Les écrans de détail n'ont besoin que d'un évènement. Ajoute à la racine un champ event
qui prend un id obligatoire et renvoie l'évènement correspondant, ou null s'il n'existe pas.`;

export const prediction = {
  promptId: 'arguments-evenement-absent',
  question: 'Que répond { event(id: "999") { title } } quand aucun évènement n’a cet id ?',
  choices: ['une erreur', '{ event: null }', 'une liste vide'],
  expected: '{ event: null }'
};

export const checks = [
  argumentCheck({ id: 'event-argument', field: 'event', type: 'Event', what: 'un évènement' }),
  {
    id: 'event-trouve',
    label: 'event(id: …) renvoie l’évènement demandé, avec son organisateur',
    run: async ({ gql }) => {
      const { events } = await dataOf(gql, '{ events { id } }', 'events');
      for (const expected of events) {
        const { event } = await dataOf(
          gql,
          `{ event(id: "${expected.id}") { id title organizer { name } } }`,
          `event(id: "${expected.id}")`
        );
        assert(event, notFound('event', expected.id));
        assert(
          event.id === expected.id,
          `event(id: "${expected.id}") renvoie l'évènement ${event.id} : le résolveur compare-t-il id avec le bon argument ?`
        );
      }
    }
  },
  absentCheck({ id: 'event-absent', field: 'event', missing: '999', what: 'un évènement' })
];

export const hints = [
  'Un résolveur reçoit (parent, args) : où trouves-tu l’id demandé ?',
  'event(id: ID!): Event dans Query ; le résolveur cherche dans le tableau avec find.',
  'event: (_parent, { id }) => events.find((e) => e.id === id) ?? null'
];
