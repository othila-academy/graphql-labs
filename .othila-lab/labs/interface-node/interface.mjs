import { assert } from '@othila-academy/lab';
import { expectField, typeOf } from '../../shared/schema.mjs';

export const title = 'Ce que les types partagent';
export const instructions = `Un utilisateur et un évènement ont un point commun : un identifiant unique dans tout le graphe.
Déclare une interface Node avec ce champ, et fais-la implémenter par User et par Event.`;

export const prediction = {
  promptId: 'interface-node-redeclarer',
  question: 'Une fois Node déclarée, User doit-il redéclarer son champ id ?',
  choices: ['non, il l’hérite', 'oui, il le redéclare'],
  expected: 'oui, il le redéclare'
};

export const checks = [
  {
    id: 'node-interface',
    label: 'Node est une interface avec un champ id: ID!',
    run: async ({ gql }) => {
      const node = await typeOf(gql, 'Node');
      assert(node, "Le schéma n'a pas d'interface Node : le nom tient compte des majuscules.");
      assert(
        node.kind === 'INTERFACE',
        `Node est un type ${node.kind} : quel mot-clé déclare une interface ?`
      );
      expectField(
        node,
        'Node',
        'id',
        'ID!',
        'un identifiant a son propre scalaire, et ne manque jamais.'
      );
    }
  },
  {
    id: 'implementations',
    label: 'User et Event implémentent Node',
    run: async ({ gql }) => {
      for (const name of ['User', 'Event']) {
        const type = await typeOf(gql, name);
        assert(
          type?.interfaces?.some((i) => i.name === 'Node'),
          `${name} n'implémente pas Node : relis sa déclaration (implements).`
        );
      }
    }
  }
];

export const hints = [
  'Quel mot-clé GraphQL déclare un contrat partagé par plusieurs types ?',
  'interface Node { id: ID! }, puis type User implements Node { … }.',
  'interface Node { id: ID! } ; type User implements Node { id: ID! … } ; type Event implements Node { id: ID! … }'
];
