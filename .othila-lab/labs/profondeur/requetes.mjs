// Les requêtes du lab profondeur : un champ compte un niveau, feuilles comprises ({ events { title } } : 2).

export const DEPTH_6 =
  '{ events { organizer { organizedEvents { organizer { organizedEvents { title } } } } } }';
export const DEPTH_7 =
  '{ events { organizer { organizedEvents { organizer { organizedEvents { organizer { name } } } } } } }';
export const DEPTH_7_FRAGMENTS = `query { events { ...A } }
fragment A on Event { organizer { organizedEvents { ...B } } }
fragment B on Event { organizer { organizedEvents { organizer { name } } } }`;
export const FRAGMENT_LOOP = `query { events { ...A } }
fragment A on Event { organizer { organizedEvents { ...B } } }
fragment B on Event { organizer { organizedEvents { ...A } } }`;
export const DEPTH_7_TYPENAME = `{ __typename events { __typename organizer { __typename organizedEvents {
  __typename organizer { __typename organizedEvents { __typename organizer { __typename name } } } } } } }`;
export const INTROSPECTION_8 =
  '{ __schema { types { fields { type { ofType { ofType { ofType { name } } } } } } } }';

export const VALIDATION = 'GRAPHQL_VALIDATION_FAILED';
export const codeOf = (result) => result.errors?.[0]?.extensions?.code ?? null;

// Une requête refusée à la validation : sinon, le message dit pourquoi (passes : elle a répondu).
export async function expectRefused(gql, query, passes) {
  const result = await gql(query);
  if (!result.errors) throw new Error(passes);
  const code = codeOf(result);
  if (code !== VALIDATION)
    throw new Error(
      `La requête est refusée avec ${code ? `le code ${code}` : 'une erreur sans code'} (« ${result.errors[0].message} ») : une règle de validation donne d'elle-même ${VALIDATION}.`
    );
  return result;
}

// Une requête qui répond sans erreur : sinon, le message dit pourquoi (refused : elle a été refusée).
export async function expectAnswered(gql, query, refused) {
  const result = await gql(query);
  const error = result.errors?.[0];
  if (error) throw new Error(`${refused} (« ${error.message} »)`);
  return result;
}
