// Les évènements de test : créés par une session, avec un input qui s'adapte au schéma de l'étudiant.
import { schemaError } from './errors.mjs';
import { typeOf, fieldOf } from './schema.mjs';

export const FIELDS = 'id title organizer { id name }';
export const CREATE = `mutation ($input: CreateEventInput!) { createEvent(input: $input) { ${FIELDS} } }`;
export const UPDATE = `mutation ($id: ID!, $input: UpdateEventInput!) { updateEvent(id: $id, input: $input) { ${FIELDS} } }`;
export const DELETE = 'mutation ($id: ID!) { deleteEvent(id: $id) }';

let counter = 0;
const probeTitle = () => `check-${Date.now()}-${++counter}`;

// Un input de création ; tant que CreateEventInput a organizerId, on y met organizerId.
export async function eventInput(gql, organizerId) {
  const input = { title: probeTitle(), start: '2026-12-20', category: 'ATELIER' };
  if (fieldOf(await typeOf(gql, 'CreateEventInput'), 'organizerId'))
    input.organizerId = organizerId;
  return input;
}

// Un évènement créé par cette session (organisateur : l'utilisateur de la session), ou l'erreur traduite.
export async function createAs(session) {
  const input = await eventInput(session.gql, session.user.id);
  const result = await session.gql(CREATE, { variables: { input } });
  const error = result.errors?.[0]?.message;
  if (error)
    throw new Error(
      schemaError(error) ??
        `${session.user.name}, connecté, ne peut pas créer d'évènement (« ${error} ») : createEvent doit marcher pour un utilisateur connecté.`
    );
  return result.data.createEvent;
}

// Supprime un évènement de test ; ne fait jamais échouer un check.
export async function cleanup(session, id) {
  try {
    await session.gql(DELETE, { variables: { id } });
  } catch {
    // l'évènement de test disparaîtra au redémarrage du serveur
  }
}
