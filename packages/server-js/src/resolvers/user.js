import { events } from '../data/events.js';
import { registrations } from '../data/registrations.js';

export const User = {
  organizedEvents: (user) => events.filter((event) => event.organizerId === user.id),
  participations: (user) =>
    registrations
      .filter((r) => r.userId === user.id)
      .map((r) => events.find((event) => event.id === r.eventId))
};
