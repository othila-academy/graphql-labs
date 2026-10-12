import { assert } from '@othila-academy/lab';
import { codeOf, codeText, session } from '../../shared/auth.mjs';
import { schemaError } from '../../shared/errors.mjs';
import { dataOf } from '../../shared/query.mjs';
import { fieldOf, typeOf } from '../../shared/schema.mjs';
import { CREATE, cleanup, eventInput } from '../../shared/probes.mjs';

export const title = 'Pas de modification sans connexion';
export const instructions = `N'importe qui peut encore créer un évènement. Exige une connexion pour createEvent, updateEvent
et deleteEvent (code UNAUTHENTICATED), et fais de l'utilisateur connecté l'organisateur de ce qu'il crée :
organizerId disparaît de CreateEventInput.`;

export const prediction = {
  promptId: 'autorisations-lecture-anonyme',
  question: 'Une fois les mutations protégées, un visiteur sans jeton peut-il encore lire events ?',
  choices: ['oui', 'non'],
  expected: 'oui'
};

const count = async (gql) => (await dataOf(gql, '{ events { id } }', 'events')).events.length;

export const checks = [
  {
    id: 'anonyme-refuse',
    label: 'createEvent sans jeton échoue avec le code UNAUTHENTICATED, et rien n’est créé',
    run: async ({ gql }) => {
      const alice = await session(gql, 'alice');
      const before = await count(gql);
      const result = await gql(CREATE, {
        variables: { input: await eventInput(gql, alice.user.id) }
      });
      const created = result.data?.createEvent;
      if (created) await cleanup(alice, created.id);
      const error = result.errors?.[0]?.message;
      if (error && schemaError(error)) throw new Error(schemaError(error));
      assert(
        !created,
        'createEvent répond sans jeton : où le résolveur vérifie-t-il qu’un utilisateur est connecté ?'
      );
      assert(
        codeOf(result) === 'UNAUTHENTICATED',
        `createEvent sans jeton échoue ${codeText(result)} : le client attend UNAUTHENTICATED pour proposer de se connecter.`
      );
      assert(
        (await count(gql)) === before,
        'createEvent refuse le visiteur, mais l’évènement a quand même été ajouté : vérifie la connexion avant d’écrire.'
      );
    }
  },
  {
    id: 'input-sans-organisateur',
    label: 'CreateEventInput n’a plus de champ organizerId',
    run: async ({ gql }) => {
      const input = await typeOf(gql, 'CreateEventInput');
      assert(
        input,
        "Le schéma n'a plus d'input CreateEventInput : il reste nécessaire à createEvent."
      );
      assert(
        !fieldOf(input, 'organizerId'),
        'Le client choisit encore l’organisateur (CreateEventInput.organizerId) : qui devrait-il être ?'
      );
    }
  },
  {
    id: 'organisateur-connecte',
    label: 'createEvent avec le jeton de Bilal crée un évènement dont l’organisateur est Bilal',
    run: async ({ gql }) => {
      const alice = await session(gql, 'alice');
      const bilal = await session(gql, 'bilal');
      // Si l'input accepte encore organizerId, on y met Alice : l'organisateur doit pourtant être Bilal.
      const input = await eventInput(gql, alice.user.id);
      const result = await bilal.gql(CREATE, { variables: { input } });
      const error = result.errors?.[0]?.message;
      if (error)
        throw new Error(
          schemaError(error) ??
            `createEvent avec le jeton de Bilal répond « ${error} » : un utilisateur connecté doit pouvoir créer.`
        );
      const event = result.data.createEvent;
      await cleanup(alice, event.id);
      assert(
        event.organizer?.id === bilal.user.id,
        `L'évènement créé par Bilal a pour organisateur ${event.organizer?.name ?? 'personne'} : d'où vient organizerId dans ta mutation ?`
      );
    }
  },
  {
    id: 'lecture-libre',
    label: 'events répond sans jeton',
    passesOnStart: true,
    run: async ({ gql }) => {
      const result = await gql('{ events { id } }');
      assert(
        !result.errors,
        'events refuse un visiteur sans jeton : la lecture doit rester publique, seules les mutations sont protégées.'
      );
    }
  }
];

export const hints = [
  'Où le résolveur trouve-t-il l’utilisateur connecté ?',
  'Un petit garde requireUser(user) qui lève UNAUTHENTICATED, appelé en tête de chaque mutation.',
  "export function requireUser(user) { if (!user) throw new GraphQLError('connexion requise', { extensions: { code: 'UNAUTHENTICATED' } }); return user; } ; dans createEvent : const event = { …, organizerId: user.id }"
];
