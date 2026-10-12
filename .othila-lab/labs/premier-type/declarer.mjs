import { assert } from '@othila-academy/lab';
import { fieldOf, sdl, typeOf } from '../../shared/schema.mjs';

export const title = 'Déclarer le type';
export const instructions = `Ton serveur ne connaît que hello. Déclare dans le schéma un type Event avec un identifiant,
un titre et une date, puis un champ events à la racine qui renvoie la liste des évènements.
Pas encore de données : pour l'instant, le schéma promet seulement.`;

export const prediction = {
  promptId: 'premier-type-sans-resolveur',
  question: 'Une fois le schéma en place, sans résolveur, que répond { events { title } } ?',
  choices: ['une liste vide', 'null', 'une erreur'],
  expected: 'une erreur'
};

// Les champs attendus sur Event, et le message quand le type n'est pas le bon.
const EVENT_FIELDS = [
  ['id', 'ID!', 'un identifiant a son propre scalaire, lequel ? Et peut-il manquer ?'],
  ['title', 'String!', 'un évènement sans titre a-t-il un sens ?'],
  ['date', 'String!', 'une date au format AAAA-MM-JJ est un texte, toujours présent.']
];

export const checks = [
  {
    id: 'type-event',
    label: 'le schéma contient un type Event',
    run: async ({ gql }) => {
      assert(
        await typeOf(gql, 'Event'),
        "Le schéma n'a pas de type Event : ouvre l'onglet Schema de la Sandbox et cherche-le. Le nom tient compte des majuscules."
      );
    }
  },
  {
    id: 'event-fields',
    label: 'Event a les champs id: ID!, title: String! et date: String!',
    run: async ({ gql }) => {
      const event = await typeOf(gql, 'Event');
      assert(event, "Pas de type Event dans le schéma : commence par le premier check de l'étape.");
      for (const [name, expected, why] of EVENT_FIELDS) {
        const field = fieldOf(event, name);
        assert(
          field,
          `Event n'a pas de champ ${name} : relis la liste des champs de Event dans la Sandbox.`
        );
        const got = sdl(field.type);
        assert(got === expected, `Event.${name} est de type ${got} : ${why}`);
      }
    }
  },
  {
    id: 'query-events',
    label: 'Query.events renvoie [Event!]!',
    run: async ({ gql }) => {
      const field = fieldOf(await typeOf(gql, 'Query'), 'events');
      assert(field, "Query n'a pas de champ events : par où un client entre-t-il dans le graphe ?");
      const got = sdl(field.type);
      assert(
        got === '[Event!]!',
        `Query.events est de type ${got} : la liste peut-elle être null ? Un de ses éléments ?`
      );
    }
  }
];

export const hints = [
  'Un type que rien n’atteint depuis Query est-il utilisable par un client ?',
  'Ajoute type Event { … } à côté de type Query dans typeDefs.js, puis un champ events dans Query. Les scalaires s’écrivent avec une majuscule : ID, String.',
  'type Event { id: ID! title: String! date: String! } et, dans Query, events: [Event!]!'
];
