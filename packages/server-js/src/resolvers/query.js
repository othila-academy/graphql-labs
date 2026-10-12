import { events } from '../data/events.js';

export const Query = {
  hello: () => 'Bonjour GraphQL',
  events: () => events
};
