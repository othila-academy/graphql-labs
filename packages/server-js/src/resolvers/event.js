import { registrations } from '../data/registrations.js';
import { users } from '../data/users.js';

const registrationsOf = (event) => registrations.filter((r) => r.eventId === event.id);

// Le parent est l'évènement : il ne connaît que organizerId, le résolveur trouve l'utilisateur.
export const Event = {
  organizer: (event) => users.find((user) => user.id === event.organizerId),
  period: (event) => ({ start: event.start, end: event.end }),
  // Déprécié : les clients qui le demandent encore reçoivent le début de la période.
  date: (event) => event.start,
  participants: (event) =>
    registrationsOf(event).map((r) => users.find((user) => user.id === r.userId)),
  // Un champ calculé : il n'existe pas dans les données.
  participantsCount: (event) => registrationsOf(event).length
};
