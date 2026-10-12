import { assert } from '@othila-academy/lab';
import { absentCheck, argumentCheck, dataOf, notFound } from './shared.mjs';

export const title = 'Un utilisateur par son identifiant';
export const instructions = `Fais de même pour les utilisateurs : user(id: ID!) renvoie l'utilisateur ou null.
Essaie ensuite, dans la Sandbox, d'appeler user sans argument.`;

export const prediction = {
  promptId: 'arguments-sans-id',
  question: 'Que répond { user { name } } (sans id) ?',
  choices: ['null', 'une erreur avant toute exécution', 'le premier utilisateur'],
  expected: 'une erreur avant toute exécution'
};

export const checks = [
  argumentCheck({ id: 'user-argument', field: 'user', type: 'User', what: 'un utilisateur' }),
  {
    id: 'user-trouve',
    label: 'user(id: …) renvoie l’utilisateur demandé et ses organizedEvents',
    run: async ({ gql }) => {
      const { users } = await dataOf(gql, '{ users { id name organizedEvents { id } } }', 'users');
      for (const expected of users) {
        const { user } = await dataOf(
          gql,
          `{ user(id: "${expected.id}") { id name organizedEvents { id } } }`,
          `user(id: "${expected.id}")`
        );
        assert(user, notFound('user', expected.id));
        assert(
          user.id === expected.id,
          `user(id: "${expected.id}") renvoie ${user.name} (${user.id}) : compare les identifiants, pas les noms.`
        );
        const ids = (list) => list.map((e) => e.id).join(',');
        assert(
          ids(user.organizedEvents) === ids(expected.organizedEvents),
          `user(id: "${expected.id}") ne renvoie pas les mêmes organizedEvents que users : le résolveur User.organizedEvents est-il toujours en place ?`
        );
      }
    }
  },
  absentCheck({ id: 'user-absent', field: 'user', missing: 'u999', what: 'un utilisateur' }),
  {
    id: 'sans-argument',
    label: '{ user { name } } est refusée par la validation, avant toute exécution',
    run: async ({ gql }) => {
      const result = await gql('{ user { name } }');
      const error = result.errors?.[0]?.message ?? '';
      // Avant que user existe, l'erreur porte sur le champ, pas sur l'argument : rien à observer encore.
      assert(
        !/Cannot query field "user"/.test(error),
        "Query n'a pas encore de champ user : commence par le premier check de l'étape."
      );
      assert(
        result.data === undefined && /argument "id"/.test(error),
        'La requête sans id a été exécutée : l’argument est-il bien obligatoire (ID!) ?'
      );
    }
  }
];

export const hints = [
  'Tu as déjà écrit le même champ pour les évènements.',
  'user(id: ID!): User, et un résolveur qui cherche dans users.',
  'user: (_parent, { id }) => users.find((u) => u.id === id) ?? null'
];
