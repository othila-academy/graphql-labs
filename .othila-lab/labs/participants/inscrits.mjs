import { assert } from '@othila-academy/lab';
import { expectField, typeOf } from '../../shared/schema.mjs';
import { dataOf } from '../../shared/query.mjs';

export const title = 'Les inscrits d’un évènement';
export const instructions = `Les utilisateurs s'inscrivent aux évènements. Range les inscriptions dans
src/data/registrations.js (un évènement, un utilisateur), puis expose sur Event la liste participants
et son nombre participantsCount.`;

export const prediction = {
  promptId: 'participants-ou-ranger',
  question: 'Où ranges-tu l’information « Bilal est inscrit à l’atelier » ?',
  choices: ['dans l’évènement', 'dans l’utilisateur', 'dans une liste à part'],
  expected: 'dans une liste à part'
};

export const checks = [
  {
    id: 'event-participants',
    label: 'Event.participants est [User!]! et Event.participantsCount est Int!',
    run: async ({ gql }) => {
      const event = await typeOf(gql, 'Event');
      expectField(
        event,
        'Event',
        'participants',
        '[User!]!',
        'un évènement sans inscrit a-t-il null, ou une liste vide ? Un inscrit peut-il être null ?'
      );
      expectField(
        event,
        'Event',
        'participantsCount',
        'Int!',
        'un nombre de participants est un entier, toujours connu.'
      );
    }
  },
  {
    id: 'compte-juste',
    label: 'pour chaque évènement, participantsCount vaut la longueur de participants',
    run: async ({ gql }) => {
      const { events } = await dataOf(
        gql,
        '{ events { id participantsCount participants { id } } }',
        'events'
      );
      for (const event of events) {
        assert(
          typeof event.participantsCount === 'number',
          `participantsCount renvoie ${JSON.stringify(event.participantsCount)} : regarde le check event-participants.`
        );
        assert(
          event.participantsCount === event.participants.length,
          `L'évènement ${event.id} annonce ${event.participantsCount} participant(s) et en liste ${event.participants.length} : les deux résolveurs lisent-ils les mêmes inscriptions ?`
        );
      }
    }
  },
  {
    id: 'plusieurs-inscrits',
    label: 'au moins un évènement a deux participants ou plus',
    run: async ({ gql }) => {
      const { events } = await dataOf(gql, '{ events { id participants { id } } }', 'events');
      assert(
        events.some((e) => e.participants.length >= 2),
        "Aucun évènement n'a plus d'un participant : ajoute des inscriptions pour que la relation se voie."
      );
    }
  }
];

export const hints = [
  'Un évènement a plusieurs participants, un utilisateur plusieurs participations : aucun des deux ne peut porter seul la liste.',
  'Une liste d’inscriptions { eventId, userId } ; Event.participants filtre par eventId puis retrouve chaque utilisateur.',
  'participants: (event) => registrations.filter((r) => r.eventId === event.id).map((r) => users.find((u) => u.id === r.userId))'
];
