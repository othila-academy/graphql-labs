import { assert } from '@othila-academy/lab';
import { dataOf } from '../../shared/query.mjs';

export const title = 'Trouver';
export const instructions = `Écris le résolveur de search : il renvoie les utilisateurs dont le nom contient le texte,
et les évènements dont le titre le contient, sans tenir compte des majuscules. Un texte vide ne renvoie rien.`;

export const prediction = {
  promptId: 'union-search-fragment',
  question:
    'Dans { search(text: "a") { ... on Event { title } } }, que reçoit le client pour un utilisateur trouvé ?',
  choices: ['rien, l’élément est ignoré', 'un objet vide {}', 'une erreur'],
  expected: 'un objet vide {}'
};

const SEARCH = `query ($text: String!) {
  search(text: $text) { __typename ... on User { id name } ... on Event { id title } }
}`;

const search = async (gql, text) =>
  (await dataOf(gql, SEARCH, `search(text: "${text}")`, { variables: { text } })).search;

// Les utilisateurs et les évènements du serveur, pour calculer ce que la recherche doit trouver.
async function catalog(gql) {
  const { users, events } = await dataOf(
    gql,
    '{ users { id name } events { id title } }',
    'users et events'
  );
  return { users, events };
}

const has = (results, typename, id) =>
  results.some((r) => r.__typename === typename && r.id === id);

export const checks = [
  {
    id: 'trouve-evenement',
    label: 'search trouve un évènement par un mot de son titre, en type Event',
    run: async ({ gql }) => {
      const { events } = await catalog(gql);
      const event = events[0];
      const word = event.title.split(/\s+/).at(-1).toLowerCase();
      const results = await search(gql, word);
      assert(
        has(results, 'Event', event.id),
        `search(text: "${word}") ne trouve pas « ${event.title} » : cherches-tu dans les titres des évènements ?`
      );
    }
  },
  {
    id: 'trouve-utilisateur',
    label: 'search trouve un utilisateur par son nom en majuscules, en type User',
    run: async ({ gql }) => {
      const { users } = await catalog(gql);
      const user = users[0];
      const text = user.name.toUpperCase();
      const results = await search(gql, text);
      assert(
        has(results, 'User', user.id),
        `search(text: "${text}") ne trouve pas ${user.name} : compares-tu les noms sans tenir compte des majuscules ?`
      );
    }
  },
  {
    id: 'texte-vide',
    label: 'search(text: "  ") renvoie une liste vide',
    run: async ({ gql }) => {
      const results = await search(gql, '  ');
      assert(
        results.length === 0,
        `search(text: "  ") renvoie ${results.length} résultat(s) : un texte vide doit-il tout renvoyer ?`
      );
    }
  },
  {
    id: 'melange',
    label:
      'search sur une lettre commune renvoie, dans une même liste, tous les User et Event qui la contiennent',
    run: async ({ gql }) => {
      const { users, events } = await catalog(gql);
      const contains = (text, letter) => text.toLowerCase().includes(letter);
      const letter = [...'aeiourstln'].find(
        (l) => users.some((u) => contains(u.name, l)) && events.some((e) => contains(e.title, l))
      );
      assert(
        letter,
        'Aucune lettre commune à un nom et à un titre : ce check ne peut rien vérifier.'
      );
      const results = await search(gql, letter);
      const types = new Set(results.map((r) => r.__typename));
      assert(
        types.has('User') && types.has('Event'),
        types.size
          ? `search(text: "${letter}") ne renvoie que des ${[...types][0]} : la liste fusionne-t-elle utilisateurs et évènements ?`
          : `search(text: "${letter}") ne renvoie rien : la recherche parcourt-elle les utilisateurs et les évènements ?`
      );
      for (const user of users.filter((u) => contains(u.name, letter)))
        assert(
          has(results, 'User', user.id),
          `search(text: "${letter}") oublie ${user.name} : la recherche parcourt-elle tous les utilisateurs ?`
        );
      for (const event of events.filter((e) => contains(e.title, letter)))
        assert(
          has(results, 'Event', event.id),
          `search(text: "${letter}") oublie « ${event.title} » : la recherche parcourt-elle tous les évènements ?`
        );
      const extra = results.find((r) => !contains(r.name ?? r.title, letter));
      assert(
        !extra,
        `search(text: "${letter}") renvoie « ${extra?.name ?? extra?.title} », qui ne contient pas « ${letter} » : que compare le filtre ?`
      );
    }
  }
];

export const hints = [
  'Deux recherches, une liste : comment fusionner deux tableaux en JavaScript ?',
  'toLowerCase() des deux côtés, includes(), puis [...utilisateurs, ...évènements].',
  'const needle = text.trim().toLowerCase() ; si needle est vide, renvoie [] ; sinon [...users.filter((u) => u.name.toLowerCase().includes(needle)), ...events.filter((e) => e.title.toLowerCase().includes(needle))]'
];
