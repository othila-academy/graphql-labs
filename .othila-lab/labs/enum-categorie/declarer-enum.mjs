import { assert } from '@othila-academy/lab';
import { nullField, schemaError } from '../../shared/errors.mjs';
import { expectField, typeOf } from '../../shared/schema.mjs';

export const title = 'Une liste fermée';
export const instructions = `Chaque évènement appartient à une catégorie : atelier, conférence, hackathon ou soirée,
et rien d'autre. Déclare une énumération EventCategory (ATELIER, CONFERENCE, HACKATHON, SOIREE),
un champ category obligatoire sur Event, et renseigne la catégorie de chaque évènement dans les données.`;

export const prediction = {
  promptId: 'enum-categorie-minuscules',
  question:
    'Une donnée a la catégorie « atelier », en minuscules. Que répond events pour cet évènement ?',
  choices: ['« atelier »', 'ATELIER', 'une erreur'],
  expected: 'une erreur'
};

export const CATEGORIES = ['ATELIER', 'CONFERENCE', 'HACKATHON', 'SOIREE'];

export const checks = [
  {
    id: 'enum-declaree',
    label: `EventCategory est une énumération avec ${CATEGORIES.join(', ')}`,
    run: async ({ gql }) => {
      const type = await typeOf(gql, 'EventCategory');
      assert(
        type,
        "Le schéma n'a pas d'énumération EventCategory : le nom tient compte des majuscules."
      );
      assert(
        type.kind === 'ENUM',
        `EventCategory est un type ${type.kind} : quel mot-clé déclare une liste fermée de valeurs ?`
      );
      const values = type.enumValues.map((v) => v.name);
      for (const value of CATEGORIES) {
        assert(
          values.includes(value),
          `EventCategory n'a pas la valeur ${value} : relis la liste dans la Sandbox.`
        );
      }
    }
  },
  {
    id: 'event-category',
    label: 'Event.category est de type EventCategory!',
    run: async ({ gql }) => {
      expectField(
        await typeOf(gql, 'Event'),
        'Event',
        'category',
        'EventCategory!',
        'quel type n’accepte que les catégories prévues ? Et un évènement peut-il ne pas en avoir ?'
      );
    }
  },
  {
    id: 'categories-servies',
    label: 'chaque évènement renvoie une catégorie, sans erreur',
    run: async ({ gql }) => {
      const result = await gql('{ events { id category } }');
      const error = result.errors?.[0]?.message;
      if (error) {
        if (/cannot represent value/.test(error))
          throw new Error(
            `events répond « ${error} » : la valeur de tes données est-elle écrite exactement comme dans l'énumération ?`
          );
        if (nullField(error, 'Event') === 'category')
          throw new Error(
            'Un évènement a category: null : chaque évènement de tes données a-t-il une propriété category ?'
          );
        throw new Error(
          schemaError(error) ??
            `events répond « ${error} » : qui a tort, la requête ou le serveur ?`
        );
      }
    }
  }
];

export const hints = [
  'Une chaîne accepterait n’importe quel texte. Quel type GraphQL n’accepte qu’une liste de valeurs ?',
  'enum EventCategory { … } puis category: EventCategory! dans Event ; les données utilisent les mêmes noms, en majuscules.',
  "enum EventCategory { ATELIER CONFERENCE HACKATHON SOIREE } et, dans chaque évènement, category: 'ATELIER' (ou une autre)."
];
