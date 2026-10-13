import { assert } from '@othila-academy/lab';
import {
  DEPTH_6,
  DEPTH_7,
  DEPTH_7_FRAGMENTS,
  FRAGMENT_LOOP,
  VALIDATION,
  codeOf,
  expectAnswered,
  expectRefused
} from './requetes.mjs';

export const title = 'Refuser les requêtes trop profondes';
export const instructions = `{ events { organizer { organizedEvents { organizer { organizedEvents { … } } } } } } : le graphe tourne
en rond, et un client peut demander mille niveaux. Écris une règle de validation qui mesure la profondeur
d'une opération et la refuse au-delà de 6 niveaux, puis branche-la dans ApolloServer (validationRules).
Chaque champ compte un niveau, feuilles comprises : { events { title } } a 2 niveaux. Une requête peut cacher
sa profondeur dans des fragments.`;

export const prediction = {
  promptId: 'profondeur-resolveurs',
  question: 'Une requête refusée par ta règle a-t-elle exécuté une partie de ses résolveurs ?',
  choices: ['oui, jusqu’au niveau 6', 'non, aucun'],
  expected: 'non, aucun'
};

const PASSES_7 =
  'Une requête de 7 niveaux passe : la règle est-elle dans validationRules, et refuse-t-elle au-delà de 6 ?';

export const checks = [
  {
    id: 'profonde-refusee',
    label: `une requête de 7 niveaux est refusée (code ${VALIDATION}), sans data`,
    run: async ({ gql }) => {
      const result = await expectRefused(gql, DEPTH_7, PASSES_7);
      assert(
        result.data == null,
        'La requête de 7 niveaux est refusée mais renvoie des données : le refus vient-il d’un résolveur plutôt que de la validation ?'
      );
    }
  },
  {
    id: 'refus-a-cout-nul',
    label: 'la réponse refusée compte 0 accès aux données (extensions.repositoryCalls)',
    run: async ({ gql }) => {
      const result = await gql(DEPTH_7);
      assert(result.errors, 'La requête de 7 niveaux passe : regarde le check profonde-refusee.');
      const calls = result.extensions?.repositoryCalls;
      assert(
        Number.isInteger(calls),
        'La réponse refusée n’a pas de extensions.repositoryCalls : le compteur du lab n1 est-il toujours branché ?'
      );
      assert(
        calls === 0,
        `La requête refusée a lu ${calls} donnée(s) : la profondeur est-elle contrôlée à la validation ou dans un résolveur ?`
      );
    }
  },
  {
    id: 'limite-exacte',
    label: 'une requête de 6 niveaux répond normalement',
    passesOnStart: true,
    run: async ({ gql }) => {
      await expectAnswered(
        gql,
        DEPTH_6,
        'Une requête de 6 niveaux est refusée : comptes-tu un niveau de trop ? { events { title } } en a 2.'
      );
    }
  },
  {
    id: 'fragments',
    label: 'une requête de 7 niveaux cachée dans deux fragments est refusée',
    run: async ({ gql }) => {
      await expectRefused(
        gql,
        DEPTH_7,
        'La requête de 7 niveaux passe : regarde le check profonde-refusee.'
      );
      await expectRefused(
        gql,
        DEPTH_7_FRAGMENTS,
        'Une requête profonde passe grâce à des fragments : ta règle suit-elle les fragments (FragmentSpread) ?'
      );
    }
  },
  {
    id: 'fragments-en-boucle',
    label:
      'une requête dont deux fragments se citent l’un l’autre est refusée par une erreur de validation, pas par une erreur interne',
    passesOnStart: true,
    run: async ({ gql }) => {
      // Une règle qui plante donne une erreur interne (HTTP 500), que gql lève.
      const result = await gql(FRAGMENT_LOOP).catch((error) => ({
        errors: [{ message: error.message }]
      }));
      const message = result.errors?.[0]?.message ?? '';
      assert(
        codeOf(result) === VALIDATION && !/call stack/i.test(message),
        `Deux fragments qui se citent font planter ta règle (« ${message} ») : retiens les fragments déjà suivis.`
      );
      const after = await gql('{ hello }');
      assert(
        after.data?.hello,
        'Après deux fragments qui se citent, le serveur ne répond plus : retiens les fragments déjà suivis.'
      );
    }
  }
];

export const hints = [
  'Une requête est un arbre ; la validation le parcourt avant l’exécution.',
  'Une règle de validation renvoie un visiteur ; sur OperationDefinition, calcule la profondeur de selectionSet (en suivant les fragments) et appelle context.reportError.',
  'Voir validation/depthLimit.js dans la fiche, sans la ligne des champs __ : c’est l’étape suivante.'
];
