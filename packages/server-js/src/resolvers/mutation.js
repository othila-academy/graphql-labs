import { GraphQLError } from 'graphql';
import { events } from '../data/events.js';
import { registrations } from '../data/registrations.js';

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
  createEvent: (_parent, { input }) => {
    if (!input.title.trim()) throw badInput('le titre ne peut pas être vide');
    const event = { id: nextId(), ...input, end: input.end ?? input.start };
    events.push(event);
    return event;
  },
  updateEvent: (_parent, { id, input }) => {
    const event = findEvent(id);
    // Un champ facultatif peut arriver à null explicitement : il finirait dans un champ non nul.
    for (const [key, value] of Object.entries(input)) {
      if (value === null) throw badInput(`${key} ne peut pas être null`);
    }
    if (input.title !== undefined && !input.title.trim())
      throw badInput('le titre ne peut pas être vide');
    Object.assign(event, input);
    return event;
  },
  deleteEvent: (_parent, { id }) => {
    const index = events.findIndex((e) => e.id === id);
    if (index === -1) throw notFound(id);
    events.splice(index, 1);
    // registrations est importé : on le modifie sur place, à l'envers pour que splice ne décale rien.
    for (let i = registrations.length - 1; i >= 0; i--) {
      if (registrations[i].eventId === id) registrations.splice(i, 1);
    }
    return id;
  }
};
