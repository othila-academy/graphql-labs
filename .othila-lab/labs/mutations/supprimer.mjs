import { assert } from '@othila-academy/lab';
import { schemaError } from '../../shared/errors.mjs';
import { dataOf } from '../../shared/query.mjs';
import { codeOf, createProbe, mutate } from './shared.mjs';

export const title = 'Supprimer';
export const instructions = `Ajoute deleteEvent(id), qui renvoie l'id supprimé. Un id inconnu donne une erreur NOT_FOUND.
Une suppression retire aussi les inscriptions de l'évènement.`;

export const prediction = {
  promptId: 'mutations-inscriptions-oubliees',
  question:
    'Si deleteEvent retire l’évènement mais oublie ses inscriptions, que répond ensuite { users { participations { title } } } ?',
  choices: ['les participations, sans l’évènement supprimé', 'une erreur'],
  expected: 'une erreur'
};

const DELETE = 'mutation ($id: ID!) { deleteEvent(id: $id) }';

export const checks = [
  {
    id: 'delete',
    label:
      'deleteEvent renvoie l’id, puis event(id:) rend null et l’évènement n’est plus dans events',
    run: async ({ gql }) => {
      const created = await createProbe(gql);
      const { deleteEvent } = await mutate(gql, DELETE, 'deleteEvent', { id: created.id });
      assert(
        deleteEvent === created.id,
        `deleteEvent renvoie ${JSON.stringify(deleteEvent)} : renvoie l'id de l'évènement supprimé (${created.id}).`
      );
      const { events, event } = await dataOf(
        gql,
        `{ events { id } event(id: "${created.id}") { id } }`,
        'events'
      );
      assert(
        event === null && !events.some((e) => e.id === created.id),
        "L'évènement supprimé répond encore à event(id:) ou figure dans events : l'as-tu retiré du tableau que lisent events et event ?"
      );
    }
  },
  {
    id: 'delete-absent',
    label: 'deleteEvent(id: "999") échoue avec le code NOT_FOUND',
    run: async ({ gql }) => {
      const result = await gql(DELETE, { variables: { id: '999' } });
      const error = result.errors?.[0]?.message;
      if (error && schemaError(error)) throw new Error(schemaError(error));
      const code = codeOf(result);
      assert(
        error,
        'deleteEvent(id: "999") répond sans erreur : supprimer ce qui n’existe pas est-il un succès ?'
      );
      assert(
        code === 'NOT_FOUND',
        `deleteEvent(id: "999") répond avec le code ${code} : un évènement absent mérite le code NOT_FOUND.`
      );
    }
  }
];

export const hints = [
  'Supprimer un évènement, c’est le retirer de chaque tableau qui le référence.',
  'findIndex, sinon NOT_FOUND ; splice dans events ; puis retire les inscriptions dont eventId est cet id.',
  'events.splice(index, 1) ; registrations est importé (const) : modifie-le sur place, par exemple en parcourant le tableau à l’envers avec splice.'
];
