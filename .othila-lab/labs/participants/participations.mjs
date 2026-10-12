import { assert } from '@othila-academy/lab';
import { expectField, typeOf } from '../../shared/schema.mjs';
import { dataOf } from '../../shared/query.mjs';

export const title = 'Les évènements d’un utilisateur';
export const instructions = `Lis la relation dans l'autre sens : ajoute User.participations, la liste des évènements
auxquels l'utilisateur est inscrit. Essaie ensuite une requête qui va d'un évènement à ses participants,
puis à leurs autres participations.`;

export const prediction = {
  promptId: 'participants-traversee',
  question:
    'Une requête peut-elle aller d’un évènement à ses participants, puis aux autres évènements de ces participants ?',
  choices: ['non, une seule relation par requête', 'oui'],
  expected: 'oui'
};

const TRAVERSAL = '{ event(id: "1") { participants { participations { title } } } }';

export const checks = [
  {
    id: 'user-participations',
    label: 'User.participations est [Event!]!',
    run: async ({ gql }) => {
      expectField(
        await typeOf(gql, 'User'),
        'User',
        'participations',
        '[Event!]!',
        'un utilisateur inscrit nulle part a-t-il null, ou une liste vide ?'
      );
    }
  },
  {
    id: 'deux-sens',
    label: 'participants et participations décrivent les mêmes inscriptions, dans les deux sens',
    run: async ({ gql }) => {
      const { events } = await dataOf(gql, '{ events { id title participants { id } } }', 'events');
      const { users } = await dataOf(
        gql,
        '{ users { id name participations { id title } } }',
        'users'
      );
      const registered = (user, event) => event.participants.some((p) => p.id === user.id);
      for (const user of users) {
        for (const event of events) {
          const listed = user.participations.some((e) => e.id === event.id);
          assert(
            !registered(user, event) || listed,
            `${user.name} participe à « ${event.title} », mais l'évènement n'apparaît pas dans ses participations : compares-tu userId à l'id de l'utilisateur ?`
          );
          assert(
            registered(user, event) || !listed,
            `${user.name} a « ${event.title} » dans ses participations sans figurer parmi ses participants : les deux résolveurs lisent-ils les mêmes inscriptions ?`
          );
        }
      }
    }
  },
  {
    id: 'traversee',
    label: `${TRAVERSAL} répond sans erreur`,
    run: async ({ gql }) => {
      const { event } = await dataOf(gql, TRAVERSAL, 'La traversée');
      assert(
        event,
        'event(id: "1") renvoie null : l’évènement 1 est-il toujours dans les données ?'
      );
    }
  }
];

export const hints = [
  'Tu as écrit le même résolveur dans l’autre sens.',
  'User.participations filtre les inscriptions par userId, puis retrouve chaque évènement.',
  'participations: (user) => registrations.filter((r) => r.userId === user.id).map((r) => events.find((e) => e.id === r.eventId))'
];
