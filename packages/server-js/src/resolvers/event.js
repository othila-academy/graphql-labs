import { users } from '../data/users.js';

// Le parent est l'évènement : il ne connaît que organizerId, le résolveur trouve l'utilisateur.
export const Event = {
  organizer: (event) => users.find((user) => user.id === event.organizerId)
};
