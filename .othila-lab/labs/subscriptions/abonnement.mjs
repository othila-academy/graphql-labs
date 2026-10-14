// Ce que partagent les checks de subscriptions : les opérations, un évènement créé par Bilal, les erreurs reçues.
import { session } from '../../shared/auth.mjs';
import { schemaError } from '../../shared/errors.mjs';
import { cleanup, createAs } from '../../shared/probes.mjs';
import { typeOf, fieldOf } from '../../shared/schema.mjs';

export const CREATED = 'subscription { eventCreated { id title } }';
export const WITH_ORGANIZER = 'subscription { eventCreated { id title organizer { name } } }';
// 7 niveaux : eventCreated, organizer, organizedEvents, organizer, organizedEvents, organizer, name.
export const DEPTH_7 =
  'subscription { eventCreated { organizer { organizedEvents { organizer { organizedEvents { organizer { name } } } } } } }';
// Un champ que Event n'a pas : les règles de graphql-js le refusent.
export const UNKNOWN_FIELD = 'subscription { eventCreated { inconnu } }';

export const NOTHING =
  'Abonné, rien reçu en 3 s : createEvent publie-t-il sur le même canal que celui de la subscription ?';

// Un évènement créé par Bilal pendant que l'abonné écoute ; done le supprime.
export async function publishOne(gql) {
  const bilal = await session(gql, 'bilal');
  const event = await createAs(bilal);
  return { bilal, event, done: () => cleanup(bilal, event.id) };
}

// Une erreur reçue par l'abonné, dite à l'apprenant.
export function subscriptionError(message) {
  if (/asyncIterator is not a function/.test(message))
    return 'pubsub.asyncIterator n’existe plus dans graphql-subscriptions 3 : c’est asyncIterableIterator.';
  if (/not configured to execute subscription/.test(message))
    return "Le schéma n'a pas de type Subscription : regarde le check subscription-type.";
  if (/non-nullable field Subscription\.eventCreated/.test(message))
    return "L'abonné reçoit un eventCreated vide : publish envoie-t-il { eventCreated: event } ? La clé est le nom du champ.";
  return schemaError(message) ?? `La subscription répond « ${message} ».`;
}

// Le premier message de l'abonné, sans erreur ; nothing : le message si rien n'arrive en 3 s.
export async function firstMessage(sub, nothing = NOTHING) {
  const message = await sub.next({ timeout: 3000 });
  if (!message) throw new Error(nothing);
  const error = message.errors?.[0]?.message;
  if (error) throw new Error(subscriptionError(error));
  return message.data.eventCreated;
}

// Vrai si le schéma déclare Subscription.eventCreated.
export const hasEventCreated = async (gql) =>
  Boolean(fieldOf(await typeOf(gql, 'Subscription'), 'eventCreated'));
