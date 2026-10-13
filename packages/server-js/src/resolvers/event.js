import { repository } from '../data/repository.js';

// Le parent est l'évènement : il ne connaît que organizerId, le résolveur trouve l'utilisateur.
export const Event = {
  // Le loader de la requête regroupe les organisateurs de toute la liste en un seul accès.
  organizer: (event, _args, { loaders }) => loaders.userById.load(event.organizerId),
  period: (event) => ({ start: event.start, end: event.end }),
  // Déprécié : les clients qui le demandent encore reçoivent le début de la période.
  date: (event) => event.start,
  participants: (event) =>
    repository.registrationsOfEvent(event.id).map((r) => repository.findUserById(r.userId)),
  // Un champ calculé : il n'existe pas dans les données.
  participantsCount: (event) => repository.registrationsOfEvent(event.id).length
};
