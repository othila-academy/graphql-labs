import { assert, expectData } from '@othila-academy/lab';
import { codeOf, codeText } from '../../shared/auth.mjs';
import { schemaError } from '../../shared/errors.mjs';
import { sdl } from '../../shared/schema.mjs';
import { MAX, ids, page } from '../../shared/pages.mjs';

export const title = 'Découper la liste';
export const instructions = `Les évènements se comptent maintenant par dizaines. Complète data/events.js jusqu'à douze évènements
au moins (garde l'évènement orphelin), puis ajoute à events deux arguments, offset (0 par défaut) et limit
(10 par défaut, 50 au plus). Une page hors bornes (limit hors de 1 à 50, offset négatif) est refusée
avec BAD_USER_INPUT.`;

export const prediction = {
  promptId: 'pagination-offset-1000',
  question: 'Que renvoie events(offset: 1000) ?',
  choices: ['une erreur', 'une liste vide', 'les derniers évènements'],
  expected: 'une liste vide'
};

// Toute la liste, assez longue pour juger des pages ; sinon, renvoie au check donnees.
async function enough(gql) {
  const all = await page(gql, { limit: MAX }, `events(limit: ${MAX})`, 'donnees');
  assert(
    all.length >= 12,
    `Avec ${all.length} évènement(s), les pages ne se voient pas : regarde le check donnees.`
  );
  return all;
}

export const checks = [
  {
    id: 'donnees',
    label: `events(limit: ${MAX}) renvoie douze évènements au moins`,
    run: async ({ gql }) => {
      const events = await page(gql, { limit: MAX }, `events(limit: ${MAX})`);
      assert(
        events.length >= 12,
        `Il n'y a que ${events.length} évènement(s) : complète data/events.js jusqu'à douze au moins.`
      );
    }
  },
  {
    id: 'arguments',
    label: 'events a offset: Int = 0 et limit: Int = 10',
    run: async ({ gql }) => {
      const { __type } = expectData(
        await gql(
          `{ __type(name: "Query") { fields { name args { name defaultValue type { kind name ofType { kind name } } } } } }`
        ),
        'introspection de Query'
      );
      const args = __type.fields.find((f) => f.name === 'events').args;
      for (const [name, value] of [
        ['offset', '0'],
        ['limit', '10']
      ]) {
        const arg = args.find((a) => a.name === name);
        assert(
          arg,
          `events n'a pas d'argument ${name} : relis la signature dans la Sandbox, et relance ton serveur.`
        );
        assert(
          ['Int', 'Int!'].includes(sdl(arg.type)),
          `L'argument ${name} est de type ${sdl(arg.type)} : un rang ou une taille de page est un entier.`
        );
        assert(
          arg.defaultValue === value,
          `L'argument ${name} vaut ${arg.defaultValue ?? 'rien'} par défaut : sans précision, ${name} vaut ${value} (${name}: Int = ${value}).`
        );
      }
    }
  },
  {
    id: 'defaut',
    label: 'events sans argument renvoie les dix premiers évènements',
    run: async ({ gql }) => {
      const all = await enough(gql);
      const result = await gql('{ events { id } }');
      const error = result.errors?.[0]?.message;
      if (error) throw new Error(schemaError(error) ?? `events sans argument répond « ${error} ».`);
      const events = result.data.events;
      assert(
        events.length === 10,
        `events renvoie ${events.length} évènement(s) sans argument : quelle est la limite par défaut ?`
      );
      assert(
        ids(events) === ids(all.slice(0, 10)),
        `events sans argument renvoie ${ids(events)} au lieu des dix premiers (${ids(all.slice(0, 10))}) : quel est l'offset par défaut ?`
      );
    }
  },
  {
    id: 'pages-disjointes',
    label: 'les pages (offset 0, limit 5) et (offset 5, limit 5) se suivent sans se recouvrir',
    run: async ({ gql }) => {
      const all = await enough(gql);
      const first = await page(
        gql,
        { offset: 0, limit: 5 },
        'events(offset: 0, limit: 5)',
        'donnees'
      );
      const second = await page(
        gql,
        { offset: 5, limit: 5 },
        'events(offset: 5, limit: 5)',
        'donnees'
      );
      assert(
        first.length === 5,
        `events(offset: 0, limit: 5) renvoie ${first.length} évènement(s) : le résolveur découpe-t-il selon limit ?`
      );
      const repeated = second.find((e) => first.some((f) => f.id === e.id));
      assert(
        !repeated,
        `La page 2 répète l'évènement ${repeated?.id} : slice(offset, offset + limit) ?`
      );
      assert(
        ids(second) === ids(all.slice(5, 10)),
        `La page (offset 5, limit 5) renvoie ${ids(second) || 'rien'} au lieu de ${ids(all.slice(5, 10))} : slice(offset, offset + limit) ?`
      );
    }
  },
  {
    id: 'bornes',
    label:
      'events(limit: 100), events(limit: 0) et events(offset: -1) échouent avec BAD_USER_INPUT',
    run: async ({ gql }) => {
      for (const [args, call, why] of [
        [
          { limit: 100 },
          'events(limit: 100)',
          'un client peut-il encore tout demander d’un coup ?'
        ],
        [{ limit: 0 }, 'events(limit: 0)', 'une page de zéro évènement a-t-elle un sens ?'],
        [{ offset: -1 }, 'events(offset: -1)', 'que fait slice d’un indice négatif ?']
      ]) {
        const result = await gql(
          'query ($offset: Int, $limit: Int) { events(offset: $offset, limit: $limit) { id } }',
          { variables: args }
        );
        const error = result.errors?.[0]?.message;
        if (error && schemaError(error))
          throw new Error(`${call} ne passe pas la validation : regarde le check arguments.`);
        assert(error, `${call} répond : ${why}`);
        assert(
          codeOf(result) === 'BAD_USER_INPUT',
          `${call} échoue ${codeText(result)} : le client attend BAD_USER_INPUT, une demande mal formée.`
        );
      }
    }
  },
  {
    id: 'filtre-garde',
    label:
      'pour chaque catégorie X, events(category: X, limit: 2) renvoie les deux premiers évènements de X',
    run: async ({ gql }) => {
      const all = await page(gql, { limit: MAX }, `events(limit: ${MAX})`, 'donnees');
      for (const category of new Set(all.map((e) => e.category))) {
        const expected = all.filter((e) => e.category === category).slice(0, 2);
        const got = await page(
          gql,
          { category, limit: 2 },
          `events(category: ${category}, limit: 2)`
        );
        assert(
          ids(got) === ids(expected),
          `events(category: ${category}, limit: 2) renvoie ${ids(got) || 'rien'} au lieu de ${ids(expected)} : le filtre est-il appliqué avant le découpage ?`
        );
      }
    }
  }
];

export const hints = [
  'Deux nombres suffisent à décrire une page : lesquels ?',
  'Des valeurs par défaut dans le schéma (offset: Int = 0), puis slice dans le résolveur, après avoir filtré.',
  'filtered(category).slice(offset, offset + limit), après avoir refusé limit < 1, limit > 50 ou offset < 0 (GraphQLError, code BAD_USER_INPUT).'
];
