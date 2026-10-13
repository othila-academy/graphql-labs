import { GraphQLError } from 'graphql';
import { events } from '../data/events.js';
import { repository } from '../data/repository.js';
import { registrations } from '../data/registrations.js';
import { users } from '../data/users.js';

// Une page ne dépasse jamais MAX_LIMIT évènements : le client ne peut pas tout demander d'un coup.
const MAX_LIMIT = 50;

// Le filtre s'applique avant le découpage, et eventsCount compte la même liste.
const filtered = (category) => {
  const all = repository.listEvents();
  return category ? all.filter((event) => event.category === category) : all;
};

export const Query = {
  hello: () => 'Bonjour GraphQL',
  events: (_parent, { category, offset, limit }) => {
    if (offset < 0 || limit < 1 || limit > MAX_LIMIT)
      throw new GraphQLError(`limit entre 1 et ${MAX_LIMIT}, offset positif ou nul`, {
        extensions: { code: 'BAD_USER_INPUT' }
      });
    return filtered(category).slice(offset, offset + limit);
  },
  eventsCount: (_parent, { category }) => filtered(category).length,
  users: () => users,
  event: (_parent, { id }) => repository.findEventById(id),
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
