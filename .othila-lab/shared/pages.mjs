// La liste des évènements, paginée depuis le lab pagination : une page, et la liste entière lue page après page.
import { schemaError } from './errors.mjs';

export const MAX = 50;

const PAGE = `query ($category: EventCategory, $offset: Int, $limit: Int) {
  events(category: $category, offset: $offset, limit: $limit) { id title category }
}`;

// Une page d'events, ou une erreur : traduite par le premier check qui la rencontre, les suivants
// renvoient à lui (first, son id). args : { category, offset, limit }.
export async function page(gql, args, label, first) {
  const result = await gql(PAGE, { variables: args });
  const error = result.errors?.[0]?.message;
  if (error && first) throw new Error(`${label} ne répond pas : regarde le check ${first}.`);
  if (error) throw new Error(schemaError(error) ?? `${label} répond « ${error} ».`);
  return result.data.events;
}

// Tous les évènements (d'une catégorie, si elle est donnée), lus par pages de MAX.
export async function everything(gql, category, first) {
  const all = [];
  for (let offset = 0; ; offset += MAX) {
    const events = await page(
      gql,
      { category, offset, limit: MAX },
      `events(offset: ${offset}, limit: ${MAX})`,
      first
    );
    all.push(...events);
    if (events.length < MAX || all.length > 1000) return all;
  }
}

export const ids = (events) => events.map((e) => e.id).join(', ');
