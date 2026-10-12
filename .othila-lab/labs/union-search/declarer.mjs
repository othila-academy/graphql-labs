import { assert } from '@othila-academy/lab';
import { argOf, fieldOf, sdl, typeOf } from '../../shared/schema.mjs';

export const title = 'Une union';
export const instructions = `La barre de recherche renvoie des utilisateurs et des évènements mélangés.
Déclare une union SearchResult de ces deux types, et un champ search(text: String!) qui renvoie
une liste de SearchResult (vide pour l'instant si tu veux).`;

export const prediction = {
  promptId: 'union-search-champ-commun',
  question: 'User et Event ont tous deux un id. Peut-on écrire { search(text: "a") { id } } ?',
  choices: ['oui', 'non'],
  expected: 'non'
};

export const checks = [
  {
    id: 'union-declaree',
    label: 'SearchResult est une union de User et Event',
    run: async ({ gql }) => {
      const union = await typeOf(gql, 'SearchResult');
      assert(union, "Le schéma n'a pas d'union SearchResult : le nom tient compte des majuscules.");
      assert(
        union.kind === 'UNION',
        `SearchResult est un type ${union.kind} : quel mot-clé réunit plusieurs types sans exiger de champ commun ?`
      );
      const members = union.possibleTypes.map((t) => t.name).sort();
      assert(
        members.join(',') === 'Event,User',
        `SearchResult réunit ${members.join(', ')} : elle doit réunir User et Event.`
      );
    }
  },
  {
    id: 'search-signature',
    label: 'Query.search prend text: String! et renvoie [SearchResult!]!',
    run: async ({ gql }) => {
      const search = fieldOf(await typeOf(gql, 'Query'), 'search');
      assert(search, "Query n'a pas de champ search : par où le client lance-t-il une recherche ?");
      const text = argOf(search, 'text');
      assert(text, "Query.search n'a pas d'argument text : que cherche le client ?");
      const textType = sdl(text.type);
      assert(
        textType !== 'String',
        "L'argument text est facultatif : une recherche sans texte a-t-elle un sens ?"
      );
      assert(
        textType === 'String!',
        `L'argument text est de type ${textType} : on cherche un texte.`
      );
      const got = sdl(search.type);
      assert(
        got === '[SearchResult!]!',
        `Query.search renvoie ${got} : une recherche sans résultat renvoie-t-elle null, ou une liste vide ?`
      );
    }
  }
];

export const hints = [
  'Quel type GraphQL réunit plusieurs types objets sans exiger de champ commun ?',
  'union SearchResult = User | Event, puis search(text: String!): [SearchResult!]!',
  'Comme pour Node, l’union a besoin de __resolveType.'
];
