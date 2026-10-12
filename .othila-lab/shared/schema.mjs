// Lecture du schéma par introspection, partagée par les labs du cours.
import { expectData } from '@othila-academy/lab';

// Le type nommé par introspection : sa sorte (OBJECT, ENUM, INTERFACE, UNION…), ses champs et leurs arguments,
// ses valeurs d'énumération, les interfaces qu'il implémente et ses types possibles ; null s'il n'existe pas.
export async function typeOf(gql, name) {
  const result = await gql(
    `query ($name: String!) {
       __type(name: $name) {
         name kind
         fields { name type { ...T } args { name type { ...T } } }
         enumValues { name }
         interfaces { name }
         possibleTypes { name }
       }
     }
     fragment T on __Type { kind name ofType { kind name ofType { kind name ofType { kind name } } } }`,
    { variables: { name } }
  );
  return expectData(result, `introspection de ${name}`).__type;
}

// Le type d'un champ tel qu'on l'écrit dans le schéma : ID!, [Event!]!
export function sdl(type) {
  if (type.kind === 'NON_NULL') return `${sdl(type.ofType)}!`;
  if (type.kind === 'LIST') return `[${sdl(type.ofType)}]`;
  return type.name;
}

export const fieldOf = (type, name) => type?.fields?.find((f) => f.name === name) ?? null;

export const argOf = (field, name) => field?.args?.find((a) => a.name === name) ?? null;

// Vérifie qu'un type déclare un champ du type attendu ; why explique le type attendu à l'apprenant.
export function expectField(type, typeName, name, expected, why) {
  const field = fieldOf(type, name);
  if (!field)
    throw new Error(
      `${typeName} n'a pas de champ ${name} : relis la liste des champs de ${typeName} dans la Sandbox.`
    );
  const got = sdl(field.type);
  if (got !== expected) throw new Error(`${typeName}.${name} est de type ${got} : ${why}`);
  return field;
}
