import { PubSub } from 'graphql-subscriptions';

// L'émetteur des subscriptions : en mémoire, il ne tient que sur un seul processus.
export const pubsub = new PubSub();

export const EVENT_CREATED = 'EVENT_CREATED';
