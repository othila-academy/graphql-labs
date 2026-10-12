// Les évènements de test : les checks créent les leurs (titre check-…) et les suppriment quand deleteEvent existe.
import { nullField, schemaError } from '../../shared/errors.mjs';
import { dataOf } from '../../shared/query.mjs';

export const FIELDS = 'id title category period { start end } organizer { id }';

const CREATE = `mutation ($input: CreateEventInput!) { createEvent(input: $input) { ${FIELDS} } }`;

let counter = 0;
export const probeTitle = () => `check-${Date.now()}-${++counter}`;

// La réponse brute de createEvent, organisée par un utilisateur existant ; input complète ou remplace les valeurs.
export async function create(gql, input = {}) {
  const { users } = await dataOf(gql, '{ users { id } }', 'users');
  const base = {
    title: probeTitle(),
    start: '2026-12-20',
    category: 'ATELIER',
    organizerId: users[0].id
  };
  return gql(CREATE, { variables: { input: { ...base, ...input } } });
}

// Un évènement de test créé, ou l'erreur traduite.
export async function createProbe(gql, input) {
  const result = await create(gql, input);
  const error = result.errors?.[0]?.message;
  if (error)
    throw new Error(
      schemaError(error) ?? `createEvent répond « ${error} » : regarde l'étape creer.`
    );
  return result.data.createEvent;
}

// Supprime un évènement de test si deleteEvent existe déjà ; ne fait jamais échouer un check.
export async function cleanup(gql, id) {
  try {
    await gql('mutation ($id: ID!) { deleteEvent(id: $id) }', { variables: { id } });
  } catch {
    // pas encore de deleteEvent : l'évènement de test disparaîtra au redémarrage du serveur
  }
}

export const codeOf = (result) => result.errors?.[0]?.extensions?.code ?? null;

// Une mutation sur un évènement de test : les données, ou l'erreur traduite.
export async function mutate(gql, query, label, variables) {
  const result = await gql(query, { variables });
  const error = result.errors?.[0]?.message;
  if (!error) return result.data;
  if (codeOf(result) === 'NOT_FOUND')
    throw new Error(
      `${label} ne trouve pas l'évènement que le check vient de créer : regarde le check create-visible.`
    );
  const emptied = nullField(error, 'Event');
  if (emptied)
    throw new Error(
      `${label} renvoie un évènement sans ${emptied} : ne copie que les champs fournis, sans effacer les autres.`
    );
  throw new Error(
    schemaError(error) ?? `${label} répond « ${error} » : qui a tort, la requête ou le serveur ?`
  );
}
