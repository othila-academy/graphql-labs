import { events } from '../data/events.js';
import { users } from '../data/users.js';

export const Query = {
  hello: () => 'Bonjour GraphQL',
  events: (_parent, { category }) =>
    category ? events.filter((event) => event.category === category) : events,
  users: () => users,
  event: (_parent, { id }) => events.find((event) => event.id === id) ?? null,
  user: (_parent, { id }) => users.find((user) => user.id === id) ?? null,
  // Les identifiants sont uniques dans tout le graphe : on cherche dans les deux tableaux.
  node: (_parent, { id }) =>
    events.find((event) => event.id === id) ?? users.find((user) => user.id === id) ?? null,
  search: (_parent, { text }) => {
    const needle = text.trim().toLowerCase();
    if (!needle) return [];
    return [
      ...users.filter((user) => user.name.toLowerCase().includes(needle)),
      ...events.filter((event) => event.title.toLowerCase().includes(needle))
    ];
  }
};
