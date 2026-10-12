import { assert, expectData } from '@othila-academy/lab';
import { schemaError } from '../../shared/errors.mjs';
import { expectField, typeOf } from '../../shared/schema.mjs';
import { login } from './shared.mjs';

export const title = 'Se connecter';
export const instructions = `Donne à chaque utilisateur un email (alice@othila.test, bilal@othila.test, chloe@othila.test),
un rôle (MEMBER ou ADMIN : Alice est ADMIN) et un mot de passe chiffré avec bcryptjs (password123 pour tous).
Ajoute une mutation login(email, password) qui vérifie le mot de passe et renvoie { token, user } :
un jeton JWT signé avec jsonwebtoken, et l'utilisateur. Installe les deux bibliothèques dans packages/server-js.`;

export const prediction = {
  promptId: 'login-jwt-session',
  question: 'Après login, où le serveur garde-t-il la trace que tu es connecté ?',
  choices: ['en mémoire, dans une session', 'dans un cookie', 'nulle part : le jeton suffit'],
  expected: 'nulle part : le jeton suffit'
};

export const checks = [
  {
    id: 'user-role',
    label: 'User a email: String! et role: Role!, et Role vaut MEMBER ou ADMIN',
    run: async ({ gql }) => {
      const user = await typeOf(gql, 'User');
      expectField(user, 'User', 'email', 'String!', 'un utilisateur inscrit a toujours un email.');
      expectField(
        user,
        'User',
        'role',
        'Role!',
        'quel type limite les valeurs à MEMBER et ADMIN ? Et un utilisateur a-t-il toujours un rôle ?'
      );
      const role = await typeOf(gql, 'Role');
      const values = role.enumValues?.map((v) => v.name).sort() ?? [];
      assert(
        values.join(',') === 'ADMIN,MEMBER',
        `Role vaut ${values.join(', ')} : il doit valoir MEMBER ou ADMIN.`
      );
    }
  },
  {
    id: 'login-ok',
    label: 'login(alice@othila.test, password123) renvoie un jeton JWT et Alice, de rôle ADMIN',
    run: async ({ gql }) => {
      const result = await login(gql, 'alice@othila.test');
      const error = result.errors?.[0];
      if (error) {
        const known = schemaError(error.message);
        if (known) throw new Error(known);
        throw new Error(
          error.extensions?.code === 'UNAUTHENTICATED'
            ? 'login refuse alice@othila.test avec password123 : l’email est-il le bon, et compares-tu le mot de passe à son hash avec bcrypt.compare ?'
            : `login répond « ${error.message} » : qui a tort, la requête ou le serveur ?`
        );
      }
      const { token, user } = result.data.login;
      assert(
        typeof token === 'string' && token.split('.').length === 3,
        `login renvoie le jeton « ${token} » : un JWT a trois parties séparées par des points. jwt.sign le fabrique.`
      );
      assert(
        user.role === 'ADMIN',
        `login renvoie ${user.name}, de rôle ${user.role} : Alice est ADMIN.`
      );
    }
  },
  {
    id: 'login-refuse',
    label:
      'un mauvais mot de passe et un email inconnu échouent avec UNAUTHENTICATED et le même message',
    run: async ({ gql }) => {
      const wrong = await login(gql, 'alice@othila.test', 'mauvais-mot-de-passe');
      const unknown = await login(gql, 'personne@othila.test');
      for (const [result, what] of [
        [wrong, 'un mauvais mot de passe'],
        [unknown, 'un email inconnu']
      ]) {
        const error = result.errors?.[0];
        if (error && schemaError(error.message)) throw new Error(schemaError(error.message));
        assert(error, `login accepte ${what} : vérifies-tu l’email et le mot de passe ?`);
        assert(
          error.extensions?.code === 'UNAUTHENTICATED',
          `login refuse ${what} avec le code ${error.extensions?.code} : le client attend UNAUTHENTICATED pour savoir qu’il doit se reconnecter.`
        );
      }
      assert(
        wrong.errors[0].message === unknown.errors[0].message,
        'Le message diffère selon que l’email existe ou non : un attaquant peut-il deviner les emails inscrits ?'
      );
    }
  },
  {
    id: 'pas-de-hash',
    label: 'aucun champ du schéma ne s’appelle password ni passwordHash',
    passesOnStart: true,
    run: async ({ gql }) => {
      const { __schema } = expectData(
        await gql('{ __schema { types { name fields { name } } } }'),
        'introspection'
      );
      for (const type of __schema.types) {
        const field = type.fields?.find((f) => /^password(hash)?$/i.test(f.name));
        assert(
          !field,
          `${type.name} expose ${field?.name} : le schéma ne montre que ce que le client a le droit de voir.`
        );
      }
    }
  }
];

export const hints = [
  'Un jeton signé prouve qui tu es sans que le serveur se souvienne de toi. Quelle bibliothèque signe et vérifie un JWT ?',
  'bcrypt.compare(password, user.passwordHash), puis jwt.sign({ sub: user.id }, SECRET).',
  "Si l’utilisateur n’existe pas ou si bcrypt.compare renvoie false : throw new GraphQLError('identifiants invalides', { extensions: { code: 'UNAUTHENTICATED' } }), le même dans les deux cas ; sinon return { token: jwt.sign({ sub: user.id }, SECRET), user }."
];
