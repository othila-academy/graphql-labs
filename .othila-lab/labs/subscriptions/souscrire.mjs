import { assert } from '@othila-academy/lab';
import { typeOf, expectField } from '../../shared/schema.mjs';
import { CREATED, firstMessage, publishOne } from './abonnement.mjs';

export const title = 'Être prévenu des nouveaux évènements';
export const instructions = `Déclare Subscription.eventCreated, publie l'évènement dans createEvent, et ouvre un serveur WebSocket
(ws, graphql-ws) sur le même chemin. Teste dans la Sandbox : un onglet s'abonne à eventCreated { id title },
un autre crée un évènement.`;

export const prediction = {
  promptId: 'subscriptions-redemarrage',
  question: 'Un client s’abonne, puis le serveur redémarre. Que reçoit le client ?',
  choices: ['les évènements manqués', 'rien, la connexion est perdue'],
  expected: 'rien, la connexion est perdue'
};

export const checks = [
  {
    id: 'subscription-type',
    label: 'Subscription.eventCreated est de type Event!',
    run: async ({ gql }) => {
      const type = await typeOf(gql, 'Subscription');
      assert(
        type,
        "Le schéma n'a pas de type Subscription : déclare type Subscription { eventCreated: Event! }."
      );
      expectField(
        type,
        'Subscription',
        'eventCreated',
        'Event!',
        'un évènement créé existe toujours.'
      );
    }
  },
  {
    id: 'recoit',
    label:
      'un abonné à eventCreated { id title } reçoit l’évènement créé ensuite par Bilal, en moins de 3 s',
    run: async ({ gql, subscribe }) => {
      const sub = await subscribe(CREATED);
      const { event, done } = await publishOne(gql);
      try {
        const received = await firstMessage(sub);
        assert(
          received.id === event.id,
          `L'abonné a reçu l'évènement ${received.id}, pas celui que le check vient de créer (${event.id}) : publies-tu l'évènement créé ?`
        );
        assert(
          received.title === event.title,
          `L'abonné a reçu le titre « ${received.title} » au lieu de « ${event.title} ».`
        );
      } finally {
        await done();
      }
    }
  },
  {
    id: 'un-seul',
    label: 'l’abonné reçoit l’évènement une fois',
    run: async ({ gql, subscribe }) => {
      const sub = await subscribe(CREATED);
      const { done } = await publishOne(gql);
      try {
        await firstMessage(sub, 'Abonné, rien reçu en 3 s : regarde le check recoit.');
        assert(
          !(await sub.next({ timeout: 500 })),
          "L'abonné a reçu l'évènement deux fois : publies-tu à deux endroits ?"
        );
      } finally {
        await done();
      }
    }
  }
];

export const hints = [
  'Une subscription a besoin d’un émetteur et d’un canal.',
  "pubsub.publish('EVENT_CREATED', { eventCreated: event }) dans la mutation ; subscribe renvoie pubsub.asyncIterableIterator('EVENT_CREATED') ; useServer({ schema }, wsServer), importé de graphql-ws/use/ws.",
  "export const pubsub = new PubSub() dans pubsub.js ; Subscription = { eventCreated: { subscribe: () => pubsub.asyncIterableIterator('EVENT_CREATED') } } ; new WebSocketServer({ server: httpServer, path: '/graphql' })."
];
