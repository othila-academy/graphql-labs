import { assert } from '@othila-academy/lab';
import { schemaError } from '../../shared/errors.mjs';
import { dataOf } from '../../shared/query.mjs';

export const title = 'Retrouver n’importe quoi par son id';
export const instructions = `Ajoute node(id: ID!): Node à la racine : il renvoie l'évènement ou l'utilisateur qui porte cet id,
ou null. GraphQL te demandera comment choisir le type concret : écris __resolveType.
Essaie ensuite { node(id: "u1") { name } } dans la Sandbox.`;

export const prediction = {
  promptId: 'interface-node-sans-fragment',
  question: 'Que répond { node(id: "u1") { name } } ?',
  choices: ['Alice', 'une erreur de validation', 'null'],
  expected: 'une erreur de validation'
};

// node(id:) pour un objet attendu ; le message d'un type abstrait non résolu pointe vers __resolveType.
async function nodeOf(gql, id, fragment) {
  const result = await gql(`{ node(id: "${id}") { __typename ${fragment} } }`);
  const error = result.errors?.[0]?.message;
  if (error && /Abstract type "Node" must resolve/.test(error))
    throw new Error(
      `node(id: "${id}") répond « Abstract type "Node" must resolve to an Object type at runtime… » : qui dit à GraphQL quel type concret renvoyer ?`
    );
  if (error)
    throw new Error(
      schemaError(error) ??
        `node(id: "${id}") répond « ${error} » : qui a tort, la requête ou le serveur ?`
    );
  return result.data.node;
}

export const checks = [
  {
    id: 'node-utilisateur',
    label:
      'node(id:) sur un utilisateur a pour __typename User, et ... on User { name } rend son nom',
    run: async ({ gql }) => {
      const { users } = await dataOf(gql, '{ users { id name } }', 'users');
      for (const user of users) {
        const node = await nodeOf(gql, user.id, '... on User { name }');
        assert(
          node,
          `node(id: "${user.id}") renvoie null : le résolveur de node cherche-t-il aussi parmi les utilisateurs ?`
        );
        assert(
          node.__typename === 'User',
          `node(id: "${user.id}") est un ${node.__typename} : __resolveType distingue-t-il un utilisateur d'un évènement ?`
        );
        assert(
          node.name === user.name,
          `node(id: "${user.id}") rend ${node.name} : le résolveur compare-t-il les identifiants ?`
        );
      }
    }
  },
  {
    id: 'node-evenement',
    label: 'node(id:) sur un évènement a pour __typename Event, avec son titre',
    run: async ({ gql }) => {
      const { events } = await dataOf(gql, '{ events { id title } }', 'events');
      for (const event of events) {
        const node = await nodeOf(gql, event.id, '... on Event { title }');
        assert(
          node,
          `node(id: "${event.id}") renvoie null : le résolveur de node cherche-t-il aussi parmi les évènements ?`
        );
        assert(
          node.__typename === 'Event',
          `node(id: "${event.id}") est un ${node.__typename} : __resolveType distingue-t-il un évènement d'un utilisateur ?`
        );
        assert(
          node.title === event.title,
          `node(id: "${event.id}") rend « ${node.title} » : le résolveur compare-t-il les identifiants ?`
        );
      }
    }
  },
  {
    id: 'node-absent',
    label: 'node(id: "zzz") renvoie null, sans erreur',
    run: async ({ gql }) => {
      const result = await gql('{ node(id: "zzz") { id } }');
      const error = result.errors?.[0]?.message;
      assert(
        !error,
        schemaError(error ?? '') ??
          `node(id: "zzz") répond par une erreur (« ${error} ») : un identifiant inconnu donne null, comme event(id:) et user(id:).`
      );
      assert(
        result.data.node === null,
        `node(id: "zzz") renvoie ${JSON.stringify(result.data.node)} : aucun objet n'a cet id.`
      );
    }
  },
  {
    id: 'fragment-requis',
    label: '{ node(id: "u1") { name } } est refusée par la validation',
    run: async ({ gql }) => {
      const result = await gql('{ node(id: "u1") { name } }');
      const error = result.errors?.[0]?.message ?? '';
      assert(
        !/Cannot query field "node"/.test(error),
        "Query n'a pas encore de champ node : commence par node-utilisateur."
      );
      assert(
        /Cannot query field "name" on type "Node"/.test(error),
        '{ node(id: "u1") { name } } a été acceptée : node renvoie-t-il bien l’interface Node, et non User ?'
      );
    }
  }
];

export const hints = [
  'Le résolveur de node renvoie un objet JavaScript : comment GraphQL sait-il si c’est un User ou un Event ?',
  'Une fonction __resolveType sur Node reçoit l’objet et renvoie le nom du type : User ou Event.',
  "Node: { __resolveType: (obj) => ('organizerId' in obj ? 'Event' : 'User') }, et node cherche dans les deux tableaux."
];
