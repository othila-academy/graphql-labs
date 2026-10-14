import { assert } from '@othila-academy/lab';
import {
  DEPTH_7,
  UNKNOWN_FIELD,
  WITH_ORGANIZER,
  hasEventCreated,
  publishOne,
  subscriptionError
} from './abonnement.mjs';

export const title = 'Le WebSocket a son propre chemin';
export const instructions = `Abonne-toi dans la Sandbox à eventCreated { title organizer { name } } : l'organisateur n'arrive pas.
Une opération reçue par WebSocket ne passe ni par expressMiddleware ni par ApolloServer, donc ni par leur
contexte, ni par leurs validationRules. Donne à useServer un contexte avec ses loaders, et une validation
qui applique ta règle de profondeur.`;

export const prediction = {
  promptId: 'subscriptions-profondeur',
  question: 'Ta règle de profondeur (lab profondeur) s’applique-t-elle aux subscriptions ?',
  choices: ['oui, c’est le même schéma', 'non, le WebSocket valide de son côté'],
  expected: 'non, le WebSocket valide de son côté'
};

// Une opération refusée à la validation reçoit son erreur tout de suite ; acceptée, elle attend un évènement.
async function refused(subscribe, query) {
  const message = await (await subscribe(query)).next({ timeout: 1000 });
  return Boolean(message?.errors?.length && !message.data);
}

const SEE_SOUSCRIRE = "Le schéma n'a pas de Subscription.eventCreated : regarde l'étape souscrire.";

export const checks = [
  {
    id: 'organisateur',
    label: 'l’évènement reçu par l’abonné porte son organisateur (Bilal), sans erreur',
    run: async ({ gql, subscribe }) => {
      assert(await hasEventCreated(gql), SEE_SOUSCRIRE);
      const sub = await subscribe(WITH_ORGANIZER);
      const { bilal, done } = await publishOne(gql);
      try {
        const message = await sub.next({ timeout: 3000 });
        assert(
          message,
          "Abonné avec organizer { name }, rien reçu en 3 s : regarde l'étape souscrire."
        );
        const error = message.errors?.[0]?.message;
        if (error && /loaders/.test(error))
          throw new Error(
            `L'évènement arrive sans organisateur (« ${error} ») : useServer n'a pas de contexte ; donne-lui des loaders, comme à expressMiddleware.`
          );
        if (error) throw new Error(subscriptionError(error));
        const name = message.data.eventCreated.organizer?.name;
        assert(
          name === bilal.user.name,
          `L'évènement arrive avec l'organisateur ${name ?? 'null'} au lieu de ${bilal.user.name}.`
        );
      } finally {
        await done();
      }
    }
  },
  {
    id: 'profondeur-ws',
    label:
      'une subscription de 7 niveaux est refusée par une erreur de validation, et un champ inconnu l’est toujours',
    run: async ({ gql, subscribe }) => {
      assert(await hasEventCreated(gql), SEE_SOUSCRIRE);
      assert(
        await refused(subscribe, DEPTH_7),
        "Une subscription de 7 niveaux est acceptée : useServer ne valide qu'avec les règles de graphql-js ; passe-lui validate avec depthLimit()."
      );
      assert(
        await refused(subscribe, UNKNOWN_FIELD),
        'Une subscription qui demande un champ inconnu est acceptée : la liste de règles passée à validate remplace celles de graphql-js ; garde [...specifiedRules, depthLimit()].'
      );
    }
  }
];

export const hints = [
  'Le serveur WebSocket exécute les opérations lui-même : il ne connaît que ce que tu passes à useServer.',
  'useServer accepte context (une fonction, appelée à chaque abonnement) et validate (la signature de validate de graphql).',
  'context: () => ({ loaders: loaders() }) ; validate: (schema, doc) => validate(schema, doc, [...specifiedRules, depthLimit()])'
];
