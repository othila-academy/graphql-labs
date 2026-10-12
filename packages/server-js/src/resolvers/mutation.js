import bcrypt from 'bcryptjs';
import { GraphQLError } from 'graphql';
import { requireOwnerOrAdmin } from '../auth/guards.js';
import { sign } from '../auth/jwt.js';
import { events } from '../data/events.js';
import { registrations } from '../data/registrations.js';
import { users } from '../data/users.js';

// Une erreur métier porte un code que le client sait traiter, en plus du message.
const notFound = (id) =>
  new GraphQLError(`évènement ${id} introuvable`, { extensions: { code: 'NOT_FOUND' } });
const badInput = (message) => new GraphQLError(message, { extensions: { code: 'BAD_USER_INPUT' } });

const nextId = () => String(Math.max(0, ...events.map((event) => Number(event.id))) + 1);

function findEvent(id) {
  const event = events.find((e) => e.id === id);
  if (!event) throw notFound(id);
  return event;
}

export const Mutation = {
  // Le même refus que l'email existe ou non : on ne révèle pas qui est inscrit.
  login: async (_parent, { email, password }) => {
    const user = users.find((u) => u.email === email);
    if (!user || !(await bcrypt.compare(password, user.passwordHash)))
      throw new GraphQLError('identifiants invalides', { extensions: { code: 'UNAUTHENTICATED' } });
    return { token: sign(user), user };
  },
  createEvent: (_parent, { input }, { user }) => {
    if (!input.title.trim()) throw badInput('le titre ne peut pas être vide');
    // L'organisateur est l'utilisateur connecté, pas un choix du client.
    const event = { id: nextId(), ...input, end: input.end ?? input.start, organizerId: user.id };
    events.push(event);
    return event;
  },
  updateEvent: (_parent, { id, input }, { user }) => {
    // @auth garantit un utilisateur connecté. On cherche l'évènement avant de vérifier les droits :
    // un id inconnu donne NOT_FOUND à tous.
    const event = findEvent(id);
    requireOwnerOrAdmin(user, event);
    // Un champ facultatif peut arriver à null explicitement : il finirait dans un champ non nul.
    for (const [key, value] of Object.entries(input)) {
      if (value === null) throw badInput(`${key} ne peut pas être null`);
    }
    if (input.title !== undefined && !input.title.trim())
      throw badInput('le titre ne peut pas être vide');
    Object.assign(event, input);
    return event;
  },
  deleteEvent: (_parent, { id }, { user }) => {
    const index = events.findIndex((e) => e.id === id);
    if (index === -1) throw notFound(id);
    requireOwnerOrAdmin(user, events[index]);
    events.splice(index, 1);
    // registrations est importé : on le modifie sur place, à l'envers pour que splice ne décale rien.
    for (let i = registrations.length - 1; i >= 0; i--) {
      if (registrations[i].eventId === id) registrations.splice(i, 1);
    }
    return id;
  }
};
