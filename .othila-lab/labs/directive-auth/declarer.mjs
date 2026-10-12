import { assert, expectData } from '@othila-academy/lab';
import { codeOf, codeText, session } from '../../shared/auth.mjs';
import { schemaError } from '../../shared/errors.mjs';
import { dataOf } from '../../shared/query.mjs';
import { cleanup, createAs } from '../../shared/probes.mjs';
import { sdl } from '../../shared/schema.mjs';

export const title = 'La directive et son transformateur';
export const instructions = `Les requireUser se répètent dans chaque mutation. Déclare une directive @auth(requires: Role = MEMBER),
écris le transformateur qui l'applique (mapSchema de @graphql-tools/utils), et protège un nouveau champ stats
(nombres d'évènements, d'utilisateurs et d'inscriptions : eventsCount, usersCount, registrationsCount)
réservé aux ADMIN. Installe @graphql-tools/schema et @graphql-tools/utils dans packages/server-js.`;

export const prediction = {
  promptId: 'directive-auth-introspection',
  question:
    'Une fois @auth posée sur stats, un client peut-il voir, par introspection, que stats est protégé ?',
  choices: ['oui', 'non'],
  expected: 'non'
};

const STATS = '{ stats { eventsCount usersCount registrationsCount } }';

// stats refusé : le code attendu, ou un message qui dit ce qui manque.
async function refused(gql, expected, who, why) {
  const result = await gql(STATS);
  const error = result.errors?.[0]?.message;
  if (error && schemaError(error)) throw new Error(schemaError(error));
  assert(error, `${who} lit stats : ${why}`);
  assert(
    codeOf(result) === expected,
    `stats refuse ${who} ${codeText(result)} : le client attend ${expected}.`
  );
}

export const checks = [
  {
    id: 'directive-declaree',
    label: 'le schéma déclare la directive auth, avec un argument requires de type Role',
    run: async ({ gql }) => {
      const { __schema } = expectData(
        await gql(`{ __schema { directives { name args { name defaultValue type { ...T } } } } }
          fragment T on __Type { kind name ofType { kind name } }`),
        'introspection des directives'
      );
      const auth = __schema.directives.find((d) => d.name === 'auth');
      assert(
        auth,
        'Le schéma ne déclare pas de directive auth : directive @auth(…) on FIELD_DEFINITION.'
      );
      const requires = auth.args.find((a) => a.name === 'requires');
      assert(
        requires,
        "La directive auth n'a pas d'argument requires : comment dire quel rôle est exigé ?"
      );
      const type = sdl(requires.type);
      assert(
        type === 'Role',
        `L'argument requires est de type ${type} : quel type liste les rôles ? Il est facultatif.`
      );
      assert(
        requires.defaultValue === 'MEMBER',
        `L'argument requires vaut ${requires.defaultValue ?? 'rien'} par défaut : sans précision, @auth exige un simple membre (MEMBER).`
      );
    }
  },
  {
    id: 'stats-anonyme',
    label: 'stats sans jeton : UNAUTHENTICATED',
    run: async ({ gql }) =>
      refused(
        gql,
        'UNAUTHENTICATED',
        'un visiteur sans jeton',
        'le transformateur enveloppe-t-il bien les champs qui portent @auth, et ApolloServer reçoit-il le schéma transformé ?'
      )
  },
  {
    id: 'stats-membre',
    label: 'stats avec le jeton de Bilal : FORBIDDEN',
    run: async ({ gql }) => {
      const bilal = await session(gql, 'bilal');
      await refused(
        bilal.gql,
        'FORBIDDEN',
        'Bilal (MEMBER)',
        'le transformateur compare-t-il le rôle demandé par requires à celui de l’utilisateur ?'
      );
    }
  },
  {
    id: 'stats-admin',
    label:
      'stats avec le jeton d’Alice renvoie des nombres cohérents avec events, users et les inscriptions',
    run: async ({ gql }) => {
      const alice = await session(gql, 'alice');
      const stats = async () =>
        (await dataOf(alice.gql, STATS, 'stats avec le jeton d’Alice')).stats;
      const before = await stats();
      const { events, users } = await dataOf(
        gql,
        '{ events { participantsCount } users { id } }',
        'events et users'
      );
      const registrations = events.reduce((sum, e) => sum + e.participantsCount, 0);
      for (const [name, got, expected] of [
        ['eventsCount', before.eventsCount, events.length],
        ['usersCount', before.usersCount, users.length],
        ['registrationsCount', before.registrationsCount, registrations]
      ]) {
        assert(
          got === expected,
          `stats annonce ${name} = ${got}, les données en comptent ${expected} : les nombres viennent-ils des mêmes tableaux ?`
        );
      }
      // Un évènement de plus, sans inscrit : seul eventsCount doit bouger.
      const event = await createAs(alice);
      try {
        const after = await stats();
        assert(
          after.eventsCount === before.eventsCount + 1,
          `Après une création, eventsCount passe de ${before.eventsCount} à ${after.eventsCount} : compte-t-il le tableau des évènements ?`
        );
        assert(
          after.registrationsCount === before.registrationsCount,
          `Un évènement sans inscrit fait passer registrationsCount de ${before.registrationsCount} à ${after.registrationsCount} : compte-t-il le tableau des inscriptions ?`
        );
      } finally {
        await cleanup(alice, event.id);
      }
    }
  }
];

export const hints = [
  'Une directive déclarée ne fait rien seule : qui lit le schéma et enveloppe les résolveurs ?',
  'makeExecutableSchema, puis mapSchema de @graphql-tools/utils : sur chaque champ (MapperKind.OBJECT_FIELD), getDirective(schema, field, "auth") dit si le champ la porte.',
  'field.resolve = (parent, args, ctx, info) => { const user = requireUser(ctx.user); if (auth.requires === "ADMIN" && user.role !== "ADMIN") throw … FORBIDDEN ; return resolve(parent, args, ctx, info); } ; puis new ApolloServer({ schema, … }).'
];
