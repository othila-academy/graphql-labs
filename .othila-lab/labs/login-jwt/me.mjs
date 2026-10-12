import { assert } from '@othila-academy/lab';
import { schemaError } from '../../shared/errors.mjs';
import { login } from './shared.mjs';

export const title = 'Qui suis-je ?';
export const instructions = `Le client renvoie le jeton dans l'en-tête Authorization: Bearer <jeton>. Lis-le dans le contexte
du serveur (startStandaloneServer accepte une fonction context), vérifie-le, et ajoute Query.me
qui renvoie l'utilisateur connecté, ou null.`;

export const prediction = {
  promptId: 'login-jwt-jeton-falsifie',
  question: 'Avec un jeton expiré ou falsifié, que doit répondre me ?',
  choices: ['une erreur', 'null', 'l’utilisateur quand même'],
  expected: 'null'
};

// me avec un jeton (ou sans) : l'id de l'utilisateur reconnu, ou null ; une erreur fait échouer le check.
async function me(gql, token, situation) {
  let result;
  try {
    result = await gql('{ me { id name } }', { token });
  } catch (error) {
    // Une exception dans la fonction context fait répondre HTTP 500 à toute la requête.
    if (/HTTP 500/.test(error.message))
      throw new Error(
        `me ${situation} fait planter la requête (HTTP 500) : le contexte laisse-t-il jwt.verify lever son erreur ? Un jeton invalide doit donner null.`
      );
    throw error;
  }
  const error = result.errors?.[0]?.message;
  if (error)
    throw new Error(
      schemaError(error) ??
        `me ${situation} répond par une erreur (« ${error} ») : un visiteur non reconnu n'est pas une erreur, seulement personne.`
    );
  return result.data.me;
}

// Le jeton et l'id de Bilal ; l'étape login doit être faite.
async function bilal(gql) {
  const result = await login(gql, 'bilal@othila.test');
  assert(!result.errors, 'login de bilal@othila.test échoue : regarde d’abord l’étape login.');
  assert(
    result.data.login.token.split('.').length === 3,
    'Le jeton de Bilal n’est pas un JWT : regarde le check login-ok.'
  );
  return result.data.login;
}

export const checks = [
  {
    id: 'me-anonyme',
    label: 'me sans jeton renvoie null',
    run: async ({ gql }) => {
      const user = await me(gql, undefined, 'sans jeton');
      assert(
        user === null,
        `me sans jeton renvoie ${user?.name} : sans jeton, personne n'est connecté.`
      );
    }
  },
  {
    id: 'me-connecte',
    label: 'me avec le jeton de Bilal renvoie Bilal',
    run: async ({ gql }) => {
      const { token, user } = await bilal(gql);
      const found = await me(gql, token, 'avec le jeton de Bilal');
      assert(
        found,
        'me renvoie null avec un jeton valide : le contexte lit-il l’en-tête authorization (en minuscules dans req.headers), et retire-t-il « Bearer » ?'
      );
      assert(
        found.id === user.id,
        `me renvoie ${found.name} avec le jeton de Bilal : quel identifiant mets-tu dans le jeton, et lequel relis-tu ?`
      );
    }
  },
  {
    id: 'me-falsifie',
    label: 'me avec un jeton falsifié ou illisible renvoie null, sans erreur',
    run: async ({ gql }) => {
      const { token } = await bilal(gql);
      // L'attaquant garde la signature de Bilal mais se fait passer pour Alice : la signature ne correspond plus.
      const [header, payload, signature] = token.split('.');
      const claims = JSON.parse(Buffer.from(payload, 'base64url').toString());
      const forged = Buffer.from(JSON.stringify({ ...claims, sub: 'u1', id: 'u1' })).toString(
        'base64url'
      );
      const user = await me(gql, `${header}.${forged}.${signature}`, 'avec un jeton falsifié');
      assert(
        user === null,
        `Un jeton falsifié est accepté (me renvoie ${user?.name}) : vérifies-tu la signature avec jwt.verify, et non jwt.decode ?`
      );
      const garbage = await me(gql, 'pas-un-jeton', 'avec un jeton illisible');
      assert(
        garbage === null,
        'Un jeton illisible fait reconnaître quelqu’un : que renvoie le contexte quand jwt.verify échoue ?'
      );
    }
  }
];

export const hints = [
  'Chaque résolveur reçoit un troisième argument, construit une fois par requête.',
  'context: async ({ req }) => ({ user: … }) dans les options de startStandaloneServer ; me lit context.user.',
  'me: (_parent, _args, { user }) => user ; dans le contexte, jwt.verify dans un try/catch qui renvoie null.'
];
