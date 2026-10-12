import { assert } from '@othila-academy/lab';
import { unknownField } from '../../shared/errors.mjs';
import { fieldOf, sdl, typeOf } from '../../shared/schema.mjs';

export const title = 'Choisir ce que le client perd';
export const instructions = `Un organisateur peut avoir quitté la plateforme : le schéma doit le dire.
Rends organizer nullable et vérifie que la liste revient entière, avec organizer à null pour l'évènement 4.`;

export const prediction = {
  promptId: 'nullabilite-client-recoit',
  question: 'Une fois organizer nullable, que reçoit le client pour l’évènement 4 ?',
  choices: [
    'l’évènement, avec organizer: null',
    'rien pour cet évènement',
    'une erreur pour cet évènement seulement'
  ],
  expected: 'l’évènement, avec organizer: null'
};

// La liste complète avec les organisateurs. En cas d'erreur, le premier check qui l'utilise montre celle du serveur.
async function events(gql, { first = false } = {}) {
  const result = await gql('{ events { id title organizer { name } } }');
  const error = result.errors?.[0];
  if (!error) return result.data.events;
  if (!first) throw new Error('events ne répond pas encore : regarde le check liste-entiere.');
  const unknown = unknownField(error.message);
  if (unknown) throw new Error(unknown);
  const path = error.path ? ` (chemin ${error.path.join('.')})` : '';
  throw new Error(
    `events répond « ${error.message} »${path} : lis le path, quel champ casse encore ?`
  );
}

export const checks = [
  {
    id: 'organizer-nullable',
    label: 'Event.organizer est de type User',
    run: async ({ gql }) => {
      const field = fieldOf(await typeOf(gql, 'Event'), 'organizer');
      assert(
        field,
        "Event n'a plus de champ organizer : le rendre nullable ne veut pas dire le retirer."
      );
      const got = sdl(field.type);
      assert(
        got === 'User',
        got === 'User!'
          ? 'Event.organizer est encore de type User! : qu’est-ce qui oblige le serveur à toujours fournir un organisateur ?'
          : `Event.organizer est de type ${got} : un évènement a au plus un organisateur, de type User.`
      );
    }
  },
  {
    id: 'liste-entiere',
    label:
      '{ events { id title organizer { name } } } renvoie au moins quatre évènements, sans erreur',
    run: async ({ gql }) => {
      const list = await events(gql, { first: true });
      assert(
        list.length >= 4,
        `events renvoie ${list.length} évènement(s) : l'évènement 4 est-il toujours dans les données ?`
      );
    }
  },
  {
    id: 'organisateur-null',
    label: 'l’évènement 4 a organizer: null, les autres un organisateur',
    run: async ({ gql }) => {
      const list = await events(gql);
      const orphan = list.find((e) => e.id === '4');
      assert(orphan, 'Pas d’évènement 4 dans la liste : l’as-tu gardé dans les données ?');
      assert(
        orphan.organizer === null,
        `L'évènement 4 a un organisateur (${orphan.organizer?.name}) : as-tu gardé organizerId u9 ?`
      );
      for (const event of list) {
        assert(
          event.id === '4' || event.organizer,
          `L'évènement ${event.id} n'a plus d'organisateur : seul l'évènement 4 devait perdre le sien. Le résolveur de Event.organizer est-il intact ?`
        );
      }
    }
  }
];

export const hints = [
  'Le schéma ment : il promet un organisateur pour chaque évènement.',
  'Retire le ! de organizer dans le type Event.',
  'organizer: User'
];
