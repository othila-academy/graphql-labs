import { events } from '../data/events.js';
import { users } from '../data/users.js';

export const Query = {
  hello: () => 'Bonjour GraphQL',
  events: () => events,
  users: () => users
};
