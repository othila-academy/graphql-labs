import { assert } from '@othila-academy/lab';
import { codeOf, codeText, session } from '../../shared/auth.mjs';
import { schemaError } from '../../shared/errors.mjs';
import { CREATE, UPDATE, cleanup, createAs, eventInput } from '../../shared/probes.mjs';

export const title = 'Remplacer les gardes';
export const instructions = `Pose @auth sur les trois mutations et sur me, et retire les requireUser devenus inutiles
des résolveurs. Les règles de propriétaire (FORBIDDEN sur l'évènement d'un autre) restent dans les résolveurs.
me sans jeton répond désormais UNAUTHENTICATED au lieu de null.`;

export const prediction = {
  promptId: 'directive-auth-proprietaire',
  question: 'Pourquoi la règle « seul l’organisateur modifie » ne peut-elle pas tenir dans @auth ?'
};

export const checks = [
  {
    id: 'me-protege',
    label: 'me sans jeton échoue avec UNAUTHENTICATED, et me avec un jeton renvoie l’utilisateur',
    run: async ({ gql }) => {
      const anonymous = await gql('{ me { id } }');
      const error = anonymous.errors?.[0]?.message;
      if (error && schemaError(error)) throw new Error(schemaError(error));
      assert(error, 'me rend encore null sans jeton : as-tu posé @auth sur me ?');
      assert(
        codeOf(anonymous) === 'UNAUTHENTICATED',
        `me sans jeton échoue ${codeText(anonymous)} : le client attend UNAUTHENTICATED.`
      );
      const bilal = await session(gql, 'bilal');
      const result = await bilal.gql('{ me { id } }');
      assert(
        result.data?.me?.id === bilal.user.id,
        'me ne reconnaît plus Bilal avec son jeton : le transformateur appelle-t-il encore le résolveur d’origine ?'
      );
    }
  },
  {
    id: 'mutations-protegees',
    label: 'createEvent sans jeton : UNAUTHENTICATED',
    passesOnStart: true,
    run: async ({ gql }) => {
      const alice = await session(gql, 'alice');
      const result = await gql(CREATE, {
        variables: { input: await eventInput(gql, alice.user.id) }
      });
      const created = result.data?.createEvent;
      if (created) await cleanup(alice, created.id);
      assert(
        !created,
        'createEvent répond sans jeton : en retirant requireUser, as-tu posé @auth sur la mutation ?'
      );
      assert(
        codeOf(result) === 'UNAUTHENTICATED',
        `createEvent sans jeton échoue ${codeText(result)} : le client attend UNAUTHENTICATED.`
      );
    }
  },
  {
    id: 'proprietaire-garde',
    label: 'Chloé modifie l’évènement de Bilal : FORBIDDEN',
    passesOnStart: true,
    run: async ({ gql }) => {
      const bilal = await session(gql, 'bilal');
      const chloe = await session(gql, 'chloe');
      const event = await createAs(bilal);
      try {
        const result = await chloe.gql(UPDATE, {
          variables: { id: event.id, input: { title: 'modifié par Chloé' } }
        });
        assert(
          codeOf(result) === 'FORBIDDEN',
          result.errors
            ? `Chloé est refusée ${codeText(result)} : la règle du propriétaire doit répondre FORBIDDEN.`
            : 'Chloé a modifié l’évènement de Bilal : la règle du propriétaire a disparu avec les gardes, elle doit rester dans le résolveur.'
        );
      } finally {
        await cleanup(bilal, event.id);
      }
    }
  }
];

export const hints = [
  'Qu’est-ce qui, dans tes gardes, dépend seulement de l’utilisateur, et qu’est-ce qui dépend aussi de l’évènement ?',
  '@auth sur les champs ; requireOwnerOrAdmin reste dans updateEvent et deleteEvent.',
  'me: User @auth ; createEvent(input: CreateEventInput!): Event! @auth ; et de même pour updateEvent et deleteEvent.'
];
