import { assert } from '@othila-academy/lab';
import { codeOf, codeText, session } from '../../shared/auth.mjs';
import { UPDATE } from '../../shared/probes.mjs';

export const title = 'Ne rien trahir';
export const instructions = `Provoque une erreur (updateEvent sur un id inconnu) et regarde la réponse :
Apollo y joint la pile d'appels du serveur, dans extensions.stacktrace. Désactive-la.`;

export const prediction = {
  promptId: 'autorisations-stacktrace',
  question: 'Que révèle extensions.stacktrace à un attaquant ?',
  choices: ['rien d’utile', 'les chemins et bibliothèques du serveur'],
  expected: 'les chemins et bibliothèques du serveur'
};

// L'erreur de updateEvent sur un id inconnu, demandée par Chloé.
async function notFoundError(gql) {
  const chloe = await session(gql, 'chloe');
  const result = await chloe.gql(UPDATE, { variables: { id: '999', input: { title: 'x' } } });
  assert(result.errors, 'updateEvent(id: "999") répond sans erreur : regarde l’étape autoriser.');
  return result;
}

export const checks = [
  {
    id: 'sans-trace',
    label: 'une erreur NOT_FOUND n’a pas de extensions.stacktrace',
    run: async ({ gql }) => {
      const result = await notFoundError(gql);
      assert(
        !result.errors[0].extensions?.stacktrace,
        "L'erreur contient la pile d'appels du serveur (extensions.stacktrace) : quelle option d'ApolloServer la retire ?"
      );
    }
  },
  {
    id: 'code-garde',
    label: 'l’erreur garde son code NOT_FOUND',
    passesOnStart: true,
    run: async ({ gql }) => {
      const result = await notFoundError(gql);
      assert(
        codeOf(result) === 'NOT_FOUND',
        `L'erreur arrive ${codeText(result)} : masquer la trace ne doit pas retirer extensions.code.`
      );
    }
  }
];

export const hints = [
  'Cherche dans les options du constructeur ApolloServer.',
  'includeStacktraceInErrorResponses.',
  'new ApolloServer({ typeDefs, resolvers, includeStacktraceInErrorResponses: false })'
];
