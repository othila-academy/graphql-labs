import { assert } from '@othila-academy/lab';
import { nullField, schemaError } from '../../shared/errors.mjs';
import { fieldOf, sdl, typeOf } from '../../shared/schema.mjs';

export const title = 'Relier les évènements à leur organisateur';
export const instructions = `Ajoute à chaque évènement un organizerId dans les données, puis un champ organizer: User!
sur Event, et son inverse organizedEvents sur User. Ces deux champs ont besoin de leur propre
résolveur, dans resolvers/event.js et resolvers/user.js.`;

export const prediction = {
  promptId: 'organisateur-une-requete',
  question:
    'Pour afficher le titre et le nom de l’organisateur de chaque évènement, combien de requêtes HTTP le client envoie-t-il ?',
  choices: ['une par évènement', 'deux', 'une seule'],
  expected: 'une seule'
};

// La requête du défi : chaque évènement et le nom de son organisateur, en une fois.
const CHALLENGE = '{ events { title organizer { name } } }';

const NO_ORGANIZER =
  'renvoie organizer: null : le résolveur de Event.organizer est-il réuni dans resolvers/index.js, et trouve-t-il l’utilisateur par son id ?';

export const checks = [
  {
    id: 'event-organizer',
    label: 'Event.organizer est de type User!',
    run: async ({ gql }) => {
      const field = fieldOf(await typeOf(gql, 'Event'), 'organizer');
      assert(
        field,
        "Event n'a pas de champ organizer : comment un client saurait-il qui organise un évènement ?"
      );
      const got = sdl(field.type);
      assert(
        got === 'User!',
        `Event.organizer est de type ${got} : un évènement a-t-il toujours un organisateur ?`
      );
    }
  },
  {
    id: 'organizer-resolu',
    label: 'chaque évènement renvoie un organisateur avec un nom',
    run: async ({ gql }) => {
      const result = await gql('{ events { id organizer { name } } }');
      const error = result.errors?.[0];
      if (error) {
        const unknown = schemaError(error.message);
        if (unknown) throw new Error(unknown);
        // organizer est non nul : un organisateur introuvable fait remonter null jusqu'à data.
        if (nullField(error.message, 'Event') === 'organizer') {
          const index = error.path?.[1];
          const which = Number.isInteger(index) ? `L'évènement n°${index + 1}` : 'Un évènement';
          throw new Error(`${which} ${NO_ORGANIZER}`);
        }
        throw new Error(`events répond « ${error.message} » : regarde le check query-explorer.`);
      }
      for (const event of result.data.events) {
        assert(event.organizer?.name, `L'évènement ${event.id} ${NO_ORGANIZER}`);
      }
    }
  },
  {
    id: 'query-explorer',
    label: `${CHALLENGE} répond en une requête, sans erreur`,
    run: async ({ gql }) => {
      const result = await gql(CHALLENGE);
      const error = result.errors?.[0];
      const path = error?.path ? ` (chemin ${error.path.join('.')})` : '';
      assert(
        !error,
        `La requête du défi répond « ${error?.message} »${path} : lis le chemin (path) de l'erreur pour savoir quel champ casse.`
      );
    }
  },
  {
    id: 'organized-events',
    label: 'chaque évènement figure dans les organizedEvents de son organisateur, et seulement là',
    run: async ({ gql }) => {
      const field = fieldOf(await typeOf(gql, 'User'), 'organizedEvents');
      assert(
        field,
        "User n'a pas de champ organizedEvents : quel est l'inverse de Event.organizer ?"
      );
      const type = sdl(field.type);
      assert(
        type === '[Event!]!',
        `User.organizedEvents est de type ${type} : un utilisateur qui n'organise rien reçoit-il null, ou une liste vide ?`
      );

      const byUser = await gql('{ users { id name organizedEvents { id } } }');
      const error = byUser.errors?.[0]?.message;
      assert(
        nullField(error ?? '', 'User') !== 'organizedEvents',
        'User.organizedEvents vaut null : sans résolveur, GraphQL cherche une propriété organizedEvents dans tes données. Qui doit la calculer ?'
      );
      assert(
        !error,
        `users { organizedEvents } répond « ${error} » : qui a tort, la requête ou le serveur ?`
      );
      const byEvent = await gql('{ events { id organizer { id } } }');
      assert(
        !byEvent.errors && byEvent.data.events.every((e) => e.organizer),
        'events { organizer } ne répond pas encore : regarde le check organizer-resolu.'
      );

      const organizerOf = new Map(byEvent.data.events.map((e) => [e.id, e.organizer.id]));
      for (const user of byUser.data.users) {
        const listed = new Set(user.organizedEvents.map((e) => e.id));
        for (const [eventId, organizerId] of organizerOf) {
          if (organizerId === user.id)
            assert(
              listed.has(eventId),
              `${user.name} organise l'évènement ${eventId}, mais ne le retrouve pas dans organizedEvents : les deux résolveurs comparent-ils les mêmes identifiants ?`
            );
        }
        for (const eventId of listed) {
          assert(
            organizerOf.get(eventId) === user.id,
            `${user.name} liste l'évènement ${eventId} dans organizedEvents sans en être l'organisateur : le filtre compare-t-il event.organizerId à user.id ?`
          );
        }
      }
    }
  }
];

export const hints = [
  'Un évènement contient organizerId, pas un utilisateur. Qui transforme l’un en l’autre ?',
  'Un résolveur de champ reçoit l’objet parent en premier argument : Event.organizer reçoit l’évènement, et cherche l’utilisateur.',
  'export const Event = { organizer: (event) => users.find((u) => u.id === event.organizerId) } ; même idée pour User.organizedEvents avec filter.'
];
