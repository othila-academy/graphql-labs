import { expectData } from '@othila-academy/lab';

// Le type nommé et ses champs, par introspection ; null s'il n'existe pas.
export async function typeOf(gql, name) {
  const result = await gql(
    `query ($name: String!) { __type(name: $name) { name fields { name type { ...T } } } }
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
