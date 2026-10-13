import { events } from './events.js';
import { registrations } from './registrations.js';
import { users } from './users.js';

// Le passage obligé des lectures mesurées : chaque fonction compte ses appels.
let calls = 0;
const counted =
  (read) =>
  (...args) => {
    calls += 1;
    return read(...args);
  };

export const repository = {
  listEvents: counted(() => events),
  findEventById: counted((id) => events.find((event) => event.id === id) ?? null),
  findUserById: counted((id) => users.find((user) => user.id === id) ?? null),
  // Un lot en un seul accès : un utilisateur par id, dans l'ordre des ids, null pour un id inconnu.
  findUsersByIds: counted((ids) => ids.map((id) => users.find((user) => user.id === id) ?? null)),
  registrationsOfEvent: counted((id) => registrations.filter((r) => r.eventId === id))
};

// Le compte depuis le dernier appel ; le compteur repart de zéro.
export function takeCalls() {
  const n = calls;
  calls = 0;
  return n;
}
