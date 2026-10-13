// Le compte d'accès aux données que le serveur ajoute à chaque réponse (extensions.repositoryCalls).
import { schemaError } from '../../shared/errors.mjs';

const NO_COUNT =
  "La réponse n'a pas de extensions.repositoryCalls : le plugin est-il déclaré dans ApolloServer (plugins) ?";

// Une erreur de DataLoader, dite à l'apprenant ; null si l'erreur est d'une autre nature.
export function loaderError(message) {
  if (/did not return a Promise of an Array of the same length/.test(message))
    return 'DataLoader refuse le lot : findUsersByIds doit renvoyer un élément par id, dans l’ordre des ids, null pour un id inconnu.';
  if (/did not return a Promise of an Array:/.test(message))
    return 'DataLoader refuse le lot : findUsersByIds doit renvoyer un tableau, un élément par id.';
  if (/did not return a Promise:/.test(message))
    return 'DataLoader attend une promesse de sa fonction de lot : écris-la async, new DataLoader(async (ids) => …).';
  return null;
}

// Les données et le compte d'une requête. first : l'id du check qui montre l'absence du compteur,
// auquel les suivants renvoient.
export async function callsOf(gql, query, first) {
  const result = await gql(query);
  const error = result.errors?.[0]?.message;
  if (error)
    throw new Error(schemaError(error) ?? loaderError(error) ?? `${query} répond « ${error} ».`);
  const calls = result.extensions?.repositoryCalls;
  if (!Number.isInteger(calls))
    throw new Error(
      first
        ? `La réponse n'a pas de extensions.repositoryCalls : regarde le check ${first}.`
        : NO_COUNT
    );
  return { calls, data: result.data };
}

// Un compte qui change d'une requête à l'autre ne mesure rien : les checks qui lisent un compte
// renvoient alors à compteur-remis.
export async function steady(gql) {
  const probe = '{ events(limit: 1) { id } }';
  const first = (await callsOf(gql, probe, 'compteur-present')).calls;
  const second = (await callsOf(gql, probe, 'compteur-present')).calls;
  if (first !== second)
    throw new Error("Le compte change d'une requête à l'autre : regarde le check compteur-remis.");
}
