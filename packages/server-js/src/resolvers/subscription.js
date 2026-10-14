import { EVENT_CREATED, pubsub } from '../pubsub.js';

// subscribe renvoie un itérateur : chaque publication sur le canal devient un message pour l'abonné.
export const Subscription = {
  eventCreated: { subscribe: () => pubsub.asyncIterableIterator(EVENT_CREATED) }
};
