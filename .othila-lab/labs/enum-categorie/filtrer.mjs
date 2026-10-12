import { assert } from '@othila-academy/lab';
import { schemaError } from '../../shared/errors.mjs';
import { argOf, fieldOf, sdl, typeOf } from '../../shared/schema.mjs';

export const title = 'Filtrer par catégorie';
export const instructions = `Ajoute à events un argument facultatif category. Sans argument, events renvoie tout ;
avec, seulement les évènements de cette catégorie. Essaie aussi events(category: "ATELIER"), avec des guillemets.`;

export const prediction = {
  promptId: 'enum-categorie-guillemets',
  question: 'Que répond events(category: "ATELIER") (avec des guillemets) ?',
  choices: ['les ateliers', 'une erreur de validation', 'tous les évènements'],
  expected: 'une erreur de validation'
};

export const checks = [
  {
    id: 'sans-filtre',
    label: 'events sans argument renvoie tous les évènements',
    passesOnStart: true,
    run: async ({ gql }) => {
      const result = await gql('{ events { id } }');
      const error = result.errors?.[0]?.message;
      assert(
        !error,
        `events sans argument répond « ${error} » : l'argument category est-il bien facultatif ?`
      );
      assert(
        result.data.events.length >= 4,
        `events sans argument renvoie ${result.data.events.length} évènement(s) : sans catégorie demandée, le résolveur doit tout renvoyer.`
      );
    }
  },
  {
    id: 'argument-category',
    label: 'events a un argument category de type EventCategory (facultatif)',
    run: async ({ gql }) => {
      const arg = argOf(fieldOf(await typeOf(gql, 'Query'), 'events'), 'category');
      assert(
        arg,
        "Query.events n'a pas d'argument category : comment le client choisit-il la catégorie ?"
      );
      const got = sdl(arg.type);
      assert(
        got !== 'EventCategory!',
        "L'argument category est obligatoire (EventCategory!) : events sans argument doit encore tout renvoyer."
      );
      assert(
        got === 'EventCategory',
        `L'argument category est de type ${got} : quel type n'accepte que les catégories prévues ?`
      );
    }
  },
  {
    id: 'filtre-juste',
    label: 'events(category: X) renvoie tous les évènements de catégorie X, et seulement eux',
    run: async ({ gql }) => {
      const all = await gql('{ events { id category } }');
      const error = all.errors?.[0]?.message;
      if (error)
        throw new Error(
          schemaError(error) ??
            `events répond « ${error} » : regarde d'abord l'étape declarer-enum.`
        );
      const present = new Set(all.data.events.map((e) => e.category));
      assert(
        present.size > 0,
        'events sans argument ne renvoie rien : regarde le check sans-filtre.'
      );
      assert(
        present.size >= 2,
        'Tous tes évènements ont la même catégorie : le filtre ne se verrait pas. Varie les catégories dans les données.'
      );
      for (const category of present) {
        const result = await gql(
          'query ($category: EventCategory) { events(category: $category) { id category } }',
          { variables: { category } }
        );
        const error = result.errors?.[0]?.message;
        if (error)
          throw new Error(
            schemaError(error) ??
              `events(category: ${category}) répond « ${error} » : regarde le check argument-category.`
          );
        const got = result.data.events;
        const intruder = got.find((e) => e.category !== category);
        assert(
          !intruder,
          `events(category: ${category}) renvoie un évènement de catégorie ${intruder?.category} : le résolveur lit-il l'argument ?`
        );
        const ids = new Set(got.map((e) => e.id));
        const missing = all.data.events.find((e) => e.category === category && !ids.has(e.id));
        assert(
          !missing,
          `events(category: ${category}) oublie l'évènement ${missing?.id} : le filtre compare-t-il la catégorie de chaque évènement ?`
        );
      }
    }
  }
];

export const hints = [
  'Un argument facultatif n’a pas de ! ; que vaut-il quand le client ne le donne pas ?',
  'events(category: EventCategory): [Event!]! ; le résolveur filtre si category est fourni.',
  'events: (_p, { category }) => (category ? events.filter((e) => e.category === category) : events)'
];
