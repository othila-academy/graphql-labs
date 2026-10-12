import { assert } from '@othila-academy/lab';
import { nullField } from '../../shared/errors.mjs';
import { dataOf } from '../../shared/query.mjs';
import { expectField, typeOf } from '../../shared/schema.mjs';

export const title = 'Un évènement sur plusieurs jours';
export const instructions = `Un hackathon dure deux jours : une seule date ne suffit plus. Déclare un type DateRange
(start, end) et un champ period sur Event. Dans les données, remplace date par start et end,
au format AAAA-MM-JJ. Demande ensuite date dans la Sandbox, sans rien corriger.`;

export const prediction = {
  promptId: 'deprecation-date-retiree',
  question:
    'Tu as remplacé date par start dans les données. Que répond une requête qui demande encore date ?',
  choices: ['la date de début', 'null', 'une erreur'],
  expected: 'une erreur'
};

// Les périodes de tous les évènements ; un start ou un end manquant pointe vers les données.
async function periods(gql) {
  try {
    return (await dataOf(gql, '{ events { id title period { start end } } }', 'events')).events;
  } catch (error) {
    const missing = nullField(error.message, 'DateRange') ?? nullField(error.message, 'Event');
    if (missing === 'start' || missing === 'end')
      throw new Error(
        `DateRange.${missing} vaut null pour un évènement : chaque évènement de tes données a-t-il un ${missing}, et le résolveur de period le lit-il ?`
      );
    if (missing === 'period')
      throw new Error(
        'Event.period vaut null : period n’existe pas dans les données, qui construit l’objet { start, end } ?'
      );
    throw error;
  }
}

export const checks = [
  {
    id: 'daterange',
    label: 'DateRange a start: String! et end: String!',
    run: async ({ gql }) => {
      const range = await typeOf(gql, 'DateRange');
      assert(range, "Le schéma n'a pas de type DateRange : le nom tient compte des majuscules.");
      expectField(
        range,
        'DateRange',
        'start',
        'String!',
        'un évènement a-t-il toujours un début ?'
      );
      expectField(range, 'DateRange', 'end', 'String!', 'un évènement a-t-il toujours une fin ?');
    }
  },
  {
    id: 'event-period',
    label: 'Event.period est de type DateRange!, et aucune période ne finit avant de commencer',
    run: async ({ gql }) => {
      expectField(
        await typeOf(gql, 'Event'),
        'Event',
        'period',
        'DateRange!',
        'chaque évènement a une période.'
      );
      for (const event of await periods(gql)) {
        assert(
          event.period.end >= event.period.start,
          `L'évènement ${event.id} finit (${event.period.end}) avant de commencer (${event.period.start}) : relis start et end dans tes données.`
        );
      }
    }
  },
  {
    id: 'hackathon',
    label: 'au moins un évènement dure plus d’un jour',
    run: async ({ gql }) => {
      const events = await periods(gql);
      assert(
        events.some((e) => e.period.end > e.period.start),
        'Aucun évènement ne dure plus d’un jour : le hackathon devrait.'
      );
    }
  }
];

export const hints = [
  'Un champ peut renvoyer un petit objet, sans identifiant, qui regroupe deux valeurs.',
  'type DateRange { start: String! end: String! } ; period: DateRange! sur Event, et un résolveur qui construit l’objet.',
  'period: (event) => ({ start: event.start, end: event.end })'
];
