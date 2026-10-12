import { assert } from '@othila-academy/lab';
import { nullField } from '../../shared/errors.mjs';
import { dataOf } from '../../shared/query.mjs';
import { fieldOf, typeOf } from '../../shared/schema.mjs';

export const title = 'Garder date, la déprécier';
export const instructions = `Des clients demandent encore date. Ne le retire pas : garde-le, calculé depuis period.start,
et marque-le @deprecated avec une raison qui dit quoi utiliser à la place.`;

export const prediction = {
  promptId: 'deprecation-apres-deprecated',
  question: 'Après @deprecated, que reçoit un client qui demande encore date ?',
  choices: ['une erreur', 'la date, comme avant', 'null'],
  expected: 'la date, comme avant'
};

export const checks = [
  {
    id: 'date-depreciee',
    label: 'Event.date est marqué déprécié, avec une raison qui cite period',
    run: async ({ gql }) => {
      const date = fieldOf(await typeOf(gql, 'Event'), 'date');
      assert(
        date,
        "Event n'a plus de champ date : des clients le demandent encore, le retirer les casse."
      );
      assert(
        date.isDeprecated,
        "Event.date n'est pas déprécié : regarde fields(includeDeprecated: true) dans l'introspection, ou la Sandbox."
      );
      assert(
        /period/i.test(date.deprecationReason ?? ''),
        `La raison « ${date.deprecationReason} » ne dit pas quoi utiliser à la place : cite period.`
      );
    }
  },
  {
    id: 'date-compatible',
    label: 'date répond toujours, et vaut period.start',
    run: async ({ gql }) => {
      let events;
      try {
        ({ events } = await dataOf(gql, '{ events { id date period { start } } }', 'date'));
      } catch (error) {
        if (nullField(error.message, 'Event') === 'date')
          throw new Error(
            'Event.date vaut null : un champ déprécié doit continuer de marcher. Son résolveur calcule-t-il la date depuis start ?'
          );
        throw error;
      }
      for (const event of events) {
        assert(
          event.date === event.period.start,
          `L'évènement ${event.id} a date ${event.date} et period.start ${event.period.start} : date doit valoir le début de la période.`
        );
      }
    }
  }
];

export const hints = [
  'Retirer un champ casse les clients qui le demandent. Que peut dire le schéma à la place ?',
  'La directive @deprecated(reason: "…") sur le champ, et un résolveur qui renvoie la date de début.',
  'date: String! @deprecated(reason: "Utilise period.start.") et date: (event) => event.start'
];
