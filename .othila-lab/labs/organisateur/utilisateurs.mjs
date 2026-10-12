import { assert, expectData } from '@othila-academy/lab';
import { nullField, unknownField } from '../../shared/errors.mjs';
import { fieldOf, sdl, typeOf } from '../../shared/schema.mjs';

export const title = 'Des utilisateurs';
export const instructions = `Un évènement est organisé par quelqu'un. Déclare un type User (identifiant, nom),
ajoute au moins trois utilisateurs dans src/data/users.js et un champ users à la racine.
Leurs identifiants commencent par u (u1, u2…) : on verra plus tard pourquoi un identifiant
doit être unique dans tout le graphe.`;

export const prediction = {
  promptId: 'organisateur-meme-fichier',
  question:
    'Tes utilisateurs et tes évènements ont-ils besoin d’être dans le même fichier pour que GraphQL les relie ?',
  choices: ['oui', 'non'],
  expected: 'non'
};

// Les champs attendus sur User, et le message quand le type n'est pas le bon.
const USER_FIELDS = [
  ['id', 'ID!', 'quel scalaire pour un identifiant ? Et peut-il manquer ?'],
  ['name', 'String!', 'un utilisateur sans nom a-t-il un sens ?']
];

// La liste des utilisateurs. En cas d'erreur, le premier check montre celle du serveur, les suivants renvoient vers lui.
async function users(gql, { first = false } = {}) {
  const result = await gql('{ users { id name } }');
  const error = result.errors?.[0]?.message;
  if (!error) return result.data.users;
  if (!first) throw new Error('users ne répond pas encore : regarde le premier échec de l’étape.');
  const missing = nullField(error, 'User');
  if (missing)
    throw new Error(
      `User.${missing} vaut null pour un utilisateur : les noms des propriétés de tes données sont-ils exactement ceux du schéma ?`
    );
  throw new Error(
    unknownField(error) ?? `users répond « ${error} » : qui a tort, la requête ou le serveur ?`
  );
}

export const checks = [
  {
    id: 'type-user',
    label: 'User a les champs id: ID! et name: String!',
    run: async ({ gql }) => {
      const user = await typeOf(gql, 'User');
      assert(
        user,
        "Le schéma n'a pas de type User : ouvre l'onglet Schema de la Sandbox et cherche-le. Le nom tient compte des majuscules."
      );
      for (const [name, expected, why] of USER_FIELDS) {
        const field = fieldOf(user, name);
        assert(
          field,
          `User n'a pas de champ ${name} : relis la liste des champs de User dans la Sandbox.`
        );
        const got = sdl(field.type);
        assert(got === expected, `User.${name} est de type ${got} : ${why}`);
      }
    }
  },
  {
    id: 'users-liste',
    label: 'users renvoie au moins trois utilisateurs, chacun avec un id et un name',
    run: async ({ gql }) => {
      const list = await users(gql, { first: true });
      assert(
        list.length >= 3,
        `users renvoie ${list.length} utilisateur(s) : combien en contient ton tableau ?`
      );
      list.forEach((user, i) => {
        for (const name of ['id', 'name']) {
          assert(
            user[name],
            `L'utilisateur n°${i + 1} n'a pas de ${name} : les noms des propriétés de tes données sont-ils exactement ceux du schéma ?`
          );
        }
      });
    }
  },
  {
    id: 'users-ids',
    label: 'les id des utilisateurs sont uniques et différents de ceux des évènements',
    run: async ({ gql }) => {
      const list = await users(gql);
      const eventIds = new Set(
        expectData(await gql('{ events { id } }'), 'events').events.map((e) => e.id)
      );
      const seen = new Set();
      for (const user of list) {
        assert(
          !seen.has(user.id),
          `Deux utilisateurs partagent l'id ${user.id} : un identifiant ne désigne qu'un objet.`
        );
        assert(
          !eventIds.has(user.id),
          `L'utilisateur ${user.name} et l'évènement ${user.id} partagent l'id ${user.id} : préfixe les identifiants des utilisateurs par u.`
        );
        seen.add(user.id);
      }
    }
  }
];

export const hints = [
  'Quel type racine expose une liste au client ? Tu l’as déjà fait pour les évènements.',
  'type User { id: ID! name: String! } puis users: [User!]! dans Query, et un résolveur qui renvoie le tableau de users.js.',
  "Dans resolvers/query.js : users: () => users, avec import { users } from '../data/users.js'"
];
