import { events } from '../data/events.js';

export const User = {
  organizedEvents: (user) => events.filter((event) => event.organizerId === user.id)
};
