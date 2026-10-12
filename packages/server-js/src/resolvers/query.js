import { events } from '../data/events.js';
import { users } from '../data/users.js';

export const Query = {
  hello: () => 'Bonjour GraphQL',
  events: () => events,
  users: () => users,
  event: (_parent, { id }) => events.find((event) => event.id === id) ?? null,
  user: (_parent, { id }) => users.find((user) => user.id === id) ?? null
};
