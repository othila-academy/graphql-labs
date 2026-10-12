// Les requêtes des checks, partagées par les labs du cours.
import { schemaError } from './errors.mjs';

// Les données d'une requête, ou l'erreur traduite (avec son chemin quand le serveur en donne un).
export async function dataOf(gql, query, label, options) {
  const result = await gql(query, options);
  const error = result.errors?.[0];
  if (!error) return result.data;
  const path = error.path ? ` (chemin ${error.path.join('.')})` : '';
  throw new Error(
    schemaError(error.message) ??
      `${label} répond « ${error.message} »${path} : lis le path pour trouver le champ en cause.`
  );
}
