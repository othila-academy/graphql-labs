import { assert } from '@othila-academy/lab';
import { codeOf, codeText, session } from '../../shared/auth.mjs';
import { schemaError } from '../../shared/errors.mjs';
import { dataOf } from '../../shared/query.mjs';
import { DELETE, UPDATE, cleanup, createAs } from '../../shared/probes.mjs';

export const title = 'Chacun ses évènements';
export const instructions = `Bilal ne doit pas modifier l'évènement d'Alice. updateEvent et deleteEvent ne sont permis
qu'à l'organisateur de l'évènement, ou à un ADMIN ; sinon, code FORBIDDEN.`;

export const prediction = {
  promptId: 'autorisations-code-interdit',
  question: 'Bilal, connecté, tente de supprimer l’évènement d’Alice : quel code ?',
  choices: ['UNAUTHENTICATED', 'FORBIDDEN', 'NOT_FOUND'],
  expected: 'FORBIDDEN'
};

// Le message d'une mutation refusée à tort, ou null si elle a réussi.
const refusal = (result) => {
  const error = result.errors?.[0]?.message;
  return error ? (schemaError(error) ?? `${codeOf(result)} : « ${error} »`) : null;
};

export const checks = [
  {
    id: 'proprietaire',
    label: 'Bilal modifie un évènement qu’il a créé',
    passesOnStart: true,
    run: async ({ gql }) => {
      const bilal = await session(gql, 'bilal');
      const event = await createAs(bilal);
      try {
        const result = await bilal.gql(UPDATE, {
          variables: { id: event.id, input: { title: `${event.title}-modifié` } }
        });
        const refused = refusal(result);
        assert(
          !refused,
          `Bilal ne peut pas modifier son propre évènement (${refused}) : compares-tu event.organizerId à user.id ?`
        );
      } finally {
        await cleanup(bilal, event.id);
      }
    }
  },
  {
    id: 'interdit',
    label:
      'Chloé ne peut ni modifier ni supprimer l’évènement de Bilal : FORBIDDEN, et l’évènement est intact',
    run: async ({ gql }) => {
      const bilal = await session(gql, 'bilal');
      const chloe = await session(gql, 'chloe');
      const event = await createAs(bilal);
      try {
        const update = await chloe.gql(UPDATE, {
          variables: { id: event.id, input: { title: 'modifié par Chloé' } }
        });
        const remove = await chloe.gql(DELETE, { variables: { id: event.id } });
        for (const [result, what] of [
          [update, 'modifié'],
          [remove, 'supprimé']
        ]) {
          assert(
            result.errors,
            `Chloé a ${what} l'évènement de Bilal : compares-tu l'organisateur de l'évènement à l'utilisateur connecté ?`
          );
          assert(
            codeOf(result) === 'FORBIDDEN',
            `Chloé est refusée ${codeText(result)} : elle est connectée, mais n'a pas le droit. Quel code le dit ?`
          );
        }
        const { event: after } = await dataOf(
          gql,
          `{ event(id: "${event.id}") { title } }`,
          'event'
        );
        assert(
          after?.title === event.title,
          'Chloé est refusée, mais l’évènement de Bilal a quand même changé : vérifie les droits avant d’écrire.'
        );
      } finally {
        await cleanup(bilal, event.id);
      }
    }
  },
  {
    id: 'admin',
    label: 'Alice (ADMIN) supprime l’évènement de Bilal',
    passesOnStart: true,
    run: async ({ gql }) => {
      const alice = await session(gql, 'alice');
      const bilal = await session(gql, 'bilal');
      const event = await createAs(bilal);
      const result = await alice.gql(DELETE, { variables: { id: event.id } });
      const refused = refusal(result);
      if (refused) await cleanup(bilal, event.id);
      assert(
        !refused,
        `Alice (ADMIN) ne peut pas supprimer l'évènement de Bilal (${refused}) : la règle laisse-t-elle passer un administrateur ?`
      );
    }
  },
  {
    id: 'ordre',
    label: 'un id inconnu donne NOT_FOUND, même pour Chloé',
    passesOnStart: true,
    run: async ({ gql }) => {
      const chloe = await session(gql, 'chloe');
      for (const [query, variables, name] of [
        [UPDATE, { id: '999', input: { title: 'x' } }, 'updateEvent'],
        [DELETE, { id: '999' }, 'deleteEvent']
      ]) {
        const code = codeOf(await chloe.gql(query, { variables }));
        assert(
          code === 'NOT_FOUND',
          code === 'FORBIDDEN'
            ? `Chloé reçoit FORBIDDEN de ${name} pour un évènement qui n'existe pas : cherche l'évènement avant de vérifier les droits.`
            : `${name}(id: "999") répond ${code ? `avec le code ${code}` : 'sans code'} pour Chloé : un évènement absent donne NOT_FOUND.`
        );
      }
    }
  }
];

export const hints = [
  'Authentifier ne suffit pas : qui a le droit de toucher à cet évènement-là ?',
  'Après avoir trouvé l’évènement, compare event.organizerId à user.id, sauf pour un ADMIN.',
  "export function requireOwnerOrAdmin(user, event) { if (user.role !== 'ADMIN' && event.organizerId !== user.id) throw new GraphQLError(\"tu n'organises pas cet évènement\", { extensions: { code: 'FORBIDDEN' } }); }"
];
