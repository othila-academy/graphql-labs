import { assert } from '@othila-academy/lab';
import { schemaError } from '../../shared/errors.mjs';
import { callsOf, loaderError, steady } from './calls.mjs';

export const title = 'Regrouper avec DataLoader';
export const instructions = `Installe dataloader dans packages/server-js. Crée dans le contexte, à chaque requête, un DataLoader
qui charge des utilisateurs par lots (repository.findUsersByIds), et utilise-le dans Event.organizer.`;

export const prediction = {
  promptId: 'n1-loaders-par-requete',
  question: 'Pourquoi créer les loaders à chaque requête plutôt qu’une seule fois au démarrage ?',
  choices: [
    'pour aller plus vite',
    'pour que deux requêtes ne partagent pas le cache du loader',
    'ça ne change rien'
  ],
  expected: 'pour que deux requêtes ne partagent pas le cache du loader'
};

const ORGANIZERS = '{ events(limit: 10) { organizer { name } } }';

// Les données d'une requête, sans regarder le compte.
async function dataOf(gql, query) {
  const result = await gql(query);
  const error = result.errors?.[0]?.message;
  if (error)
    throw new Error(schemaError(error) ?? loaderError(error) ?? `${query} répond « ${error} ».`);
  return result.data;
}

const who = (organizer) => organizer?.id ?? 'aucun';

export const checks = [
  {
    id: 'lot',
    label: '{ events(limit: 10) { organizer { name } } } compte 2 accès au plus',
    run: async ({ gql }) => {
      await steady(gql);
      const { calls } = await callsOf(gql, ORGANIZERS, 'compteur-present');
      assert(
        calls <= 2,
        `La liste coûte encore ${calls} accès : Event.organizer utilise-t-il loaders.userById.load ?`
      );
    }
  },
  {
    id: 'resultats-justes',
    label:
      'les organisateurs de la liste sont ceux que renvoie event(id:), un par un ; l’évènement orphelin garde organizer: null',
    passesOnStart: true,
    run: async ({ gql }) => {
      const { events } = await dataOf(gql, '{ events(limit: 10) { id organizer { id } } }');
      for (const event of events) {
        const alone = (await dataOf(gql, `{ event(id: "${event.id}") { organizer { id } } }`))
          .event;
        assert(
          who(event.organizer) === who(alone?.organizer),
          `L'évènement ${event.id} a l'organisateur ${who(event.organizer)} dans la liste, ${who(alone?.organizer)} seul : findUsersByIds renvoie-t-il les utilisateurs dans l'ordre des ids ?`
        );
      }
    }
  },
  {
    id: 'par-requete',
    label: 'la même requête, envoyée deux fois, compte autant d’accès chaque fois, au moins 2',
    run: async ({ gql }) => {
      await steady(gql);
      const first = (await callsOf(gql, ORGANIZERS, 'compteur-present')).calls;
      const second = (await callsOf(gql, ORGANIZERS, 'compteur-present')).calls;
      assert(
        second === first,
        `La seconde requête compte ${second} accès au lieu de ${first} : les loaders sont-ils créés une seule fois, au démarrage ?`
      );
      assert(
        first >= 2,
        `La liste et ses organisateurs comptent ${first} accès à chaque fois : le lot des organisateurs ne coûte rien. Les loaders sont-ils créés une seule fois, au démarrage (leur cache garde alors les utilisateurs d'une requête à l'autre) ? Sinon, findUsersByIds compte-t-il son appel ?`
      );
    }
  }
];

export const hints = [
  'Et si tous les load(id) d’une même requête attendaient un instant pour partir ensemble ?',
  'new DataLoader(async (ids) => repository.findUsersByIds(ids)) dans le contexte ; organizer appelle loaders.userById.load(event.organizerId).',
  'context: async ({ req }) => ({ user: …, loaders: { userById: new DataLoader(async (ids) => repository.findUsersByIds(ids)) } }) ; l’ordre des résultats suit celui des ids.'
];
