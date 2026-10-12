// Les comptes du cours (mot de passe password123), connectés comme le fait loginAs de @othila-academy/lab.
import { assert } from '@othila-academy/lab';

const LOGIN = `mutation ($email: String!, $password: String!) {
  login(email: $email, password: $password) { token user { id name role } }
}`;

export const EMAILS = {
  alice: 'alice@othila.test',
  bilal: 'bilal@othila.test',
  chloe: 'chloe@othila.test'
};

// Une session : l'utilisateur, son jeton, et gql qui envoie ce jeton à chaque requête.
export async function session(gql, who) {
  const result = await gql(LOGIN, { variables: { email: EMAILS[who], password: 'password123' } });
  assert(
    !result.errors,
    `La connexion de ${EMAILS[who]} échoue (« ${result.errors?.[0]?.message} ») : le lab login-jwt est-il toujours en place ?`
  );
  const { token, user } = result.data.login;
  return { token, user, gql: (query, options = {}) => gql(query, { ...options, token }) };
}

export const codeOf = (result) => result.errors?.[0]?.extensions?.code ?? null;

// Le code d'une erreur, dit en français : « avec le code FORBIDDEN », ou « sans code ».
export const codeText = (result) =>
  codeOf(result) ? `avec le code ${codeOf(result)}` : 'sans code (extensions.code est vide)';
