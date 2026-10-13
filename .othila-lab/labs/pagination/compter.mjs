import { assert, expectData } from '@othila-academy/lab';
import { schemaError } from '../../shared/errors.mjs';
import { everything } from '../../shared/pages.mjs';

export const title = 'Savoir s’il reste des pages';
export const instructions = `Le client doit savoir quand cacher son bouton « Voir plus ». Ajoute eventsCount(category),
le nombre total d'évènements (de la catégorie, si elle est donnée).`;

export const prediction = {
  promptId: 'pagination-suppression',
  question:
    'Un évènement de la page 1 est supprimé pendant que l’étudiant lit la page 2. Que voit-il sur la page 3 ?',
  choices: ['rien de spécial', 'un évènement sauté', 'un évènement en double'],
  expected: 'un évènement sauté'
};

// eventsCount, d'une catégorie si elle est donnée.
async function count(gql, category, first) {
  const result = await gql(
    'query ($category: EventCategory) { eventsCount(category: $category) }',
    {
      variables: { category }
    }
  );
  const error = result.errors?.[0]?.message;
  if (error && first) throw new Error(`eventsCount ne répond pas : regarde le check ${first}.`);
  if (error)
    throw new Error(
      schemaError(error) ??
        `eventsCount${category ? `(category: ${category})` : ''} répond « ${error} ».`
    );
  return result.data.eventsCount;
}

export const checks = [
  {
    id: 'count',
    label: 'eventsCount vaut le nombre total d’évènements (parcours de toutes les pages)',
    run: async ({ gql }) => {
      const total = await count(gql);
      const all = await everything(gql, undefined, 'donnees');
      assert(
        total === all.length,
        `eventsCount annonce ${total} évènement(s), les pages en contiennent ${all.length} : compte-t-il la même liste que events, avant découpage ?`
      );
    }
  },
  {
    id: 'count-categorie',
    label: 'eventsCount(category: X) vaut le nombre d’évènements de X, pour chaque catégorie',
    run: async ({ gql }) => {
      const { __type } = expectData(
        await gql('{ __type(name: "EventCategory") { enumValues { name } } }'),
        'introspection de EventCategory'
      );
      const all = await everything(gql, undefined, 'donnees');
      for (const { name } of __type.enumValues) {
        const expected = all.filter((e) => e.category === name).length;
        const got = await count(gql, name, 'count');
        assert(
          got === expected,
          `eventsCount(category: ${name}) annonce ${got}, il y a ${expected} évènement(s) ${name} : applique le même filtre que events.`
        );
      }
    }
  }
];

export const hints = [
  'Le total ne dépend pas de la page.',
  'Un champ racine à part, eventsCount(category: EventCategory): Int!, qui applique le même filtre que events.',
  'eventsCount: (_parent, { category }) => filtered(category).length'
];
