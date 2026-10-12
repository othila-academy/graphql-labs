import { events } from '../data/events.js';
import { registrations } from '../data/registrations.js';
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
  me: (_parent, _args, { user }) => user,
  stats: () => ({
    eventsCount: events.length,
    usersCount: users.length,
    registrationsCount: registrations.length
  }),
  search: (_parent, { text }) => {
    const needle = text.trim().toLowerCase();
    if (!needle) return [];
    return [
      ...users.filter((user) => user.name.toLowerCase().includes(needle)),
      ...events.filter((event) => event.title.toLowerCase().includes(needle))
    ];
  }
};
