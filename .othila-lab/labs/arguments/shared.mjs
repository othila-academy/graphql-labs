// Les checks communs aux deux étapes : un champ racine qui prend un id et renvoie un objet, ou null.
import { assert } from '@othila-academy/lab';
import { unknownField } from '../../shared/errors.mjs';
import { argOf, fieldOf, sdl, typeOf } from '../../shared/schema.mjs';

// Query.<field>(id: ID!): <type>, nullable.
export function argumentCheck({ id, field, type, what }) {
  return {
    id,
    label: `Query.${field} prend un argument id: ID! et renvoie ${type}`,
    run: async ({ gql }) => {
      const root = fieldOf(await typeOf(gql, 'Query'), field);
      assert(root, `Query n'a pas de champ ${field} : par où un client demande-t-il ${what} ?`);
      const arg = argOf(root, 'id');
      assert(
        arg,
        `Query.${field} n'a pas d'argument id : comment le client dit-il ce qu'il veut ?`
      );
      const argType = sdl(arg.type);
      assert(
        argType === 'ID!',
        `l'argument id de Query.${field} est de type ${argType} : peut-on appeler ${field} sans id ? Quel scalaire pour un identifiant ?`
      );
      const got = sdl(root.type);
      assert(
        got === type,
        `Query.${field} renvoie ${got} : que rendre quand ${what} n'existe pas ?`
      );
    }
  };
}

// Les arguments arrivent en deuxième paramètre : déstructurer le premier (le parent, vide à la racine) casse.
function explain(message) {
  if (/destructure property 'id'/.test(message))
    return 'le résolveur cherche l’id dans son premier paramètre, le parent : où arrivent les arguments ?';
  return null;
}

// Le message quand le résolveur ne trouve pas un objet qui existe.
export const notFound = (field, id) =>
  `${field}(id: "${id}") renvoie null : le résolveur de Query.${field} existe-t-il, lit-il l’id dans ses arguments (deuxième paramètre) et compare-t-il les identifiants ?`;

// Un objet que l'id ne désigne pas : null, sans erreur.
export function absentCheck({ id, field, missing, what }) {
  const query = `{ ${field}(id: "${missing}") { id } }`;
  return {
    id,
    label: `${field}(id: "${missing}") renvoie null, sans erreur`,
    run: async ({ gql }) => {
      const result = await gql(query);
      const error = result.errors?.[0]?.message;
      if (error) {
        throw new Error(
          unknownField(error) ??
            (explain(error) &&
              `${field}(id: "${missing}") répond « ${error} » : ${explain(error)}`) ??
            `${field}(id: "${missing}") répond par une erreur (« ${error} ») : ${what} absent est-il une erreur, ou une réponse vide ?`
        );
      }
      assert(
        result.data[field] === null,
        `${field}(id: "${missing}") renvoie ${JSON.stringify(result.data[field])} : aucun objet n'a cet id, que doit répondre le résolveur ?`
      );
    }
  };
}

// La réponse d'une requête dont on attend les données, ou l'erreur traduite.
export async function dataOf(gql, query, label) {
  const result = await gql(query);
  const error = result.errors?.[0]?.message;
  if (error)
    throw new Error(
      unknownField(error) ??
        `${label} répond « ${error} » : ${explain(error) ?? 'qui a tort, la requête ou le serveur ?'}`
    );
  return result.data;
}
