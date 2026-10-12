import { assert } from '@othila-academy/lab';
import { schemaError } from '../../shared/errors.mjs';
import { dataOf } from '../../shared/query.mjs';
import { argOf, fieldOf, sdl, typeOf } from '../../shared/schema.mjs';
import { FIELDS, cleanup, codeOf, createProbe, mutate } from './shared.mjs';

export const title = 'Modifier';
export const instructions = `Ajoute un input UpdateEventInput, dont tous les champs sont facultatifs, et updateEvent(id, input)
qui ne modifie que les champs fournis et renvoie l'évènement modifié. Un id inconnu donne une erreur NOT_FOUND.`;

export const prediction = {
  promptId: 'mutations-update-partiel',
  question:
    'updateEvent(id: "1", input: { title: "Nouveau" }) : que devient la catégorie de l’évènement 1 ?',
  choices: ['elle est effacée', 'elle ne change pas', 'une erreur'],
  expected: 'elle ne change pas'
};

const UPDATE = `mutation ($id: ID!, $input: UpdateEventInput!) { updateEvent(id: $id, input: $input) { ${FIELDS} } }`;

export const checks = [
  {
    id: 'update-input',
    label:
      'UpdateEventInput n’a que des champs facultatifs, et updateEvent prend id: ID! et input: UpdateEventInput!',
    run: async ({ gql }) => {
      const input = await typeOf(gql, 'UpdateEventInput');
      assert(
        input,
        "Le schéma n'a pas d'input UpdateEventInput : le nom tient compte des majuscules."
      );
      for (const name of ['title', 'start', 'end', 'category'])
        assert(
          fieldOf(input, name),
          `UpdateEventInput n'a pas de champ ${name} : que peut-on modifier ?`
        );
      const required = input.inputFields.find((f) => f.type.kind === 'NON_NULL');
      assert(
        !required,
        `UpdateEventInput.${required?.name} est obligatoire : comment modifier seulement la catégorie ?`
      );
      const update = fieldOf(await typeOf(gql, 'Mutation'), 'updateEvent');
      assert(update, "Mutation n'a pas de champ updateEvent.");
      for (const [name, expected] of [
        ['id', 'ID!'],
        ['input', 'UpdateEventInput!']
      ]) {
        const arg = argOf(update, name);
        assert(
          arg && sdl(arg.type) === expected,
          `updateEvent doit prendre ${name}: ${expected} : relis sa déclaration dans Mutation.`
        );
      }
    }
  },
  {
    id: 'update-partiel',
    label: 'updateEvent sur un évènement créé par le check ne change que le titre',
    run: async ({ gql }) => {
      const created = await createProbe(gql, { category: 'CONFERENCE' });
      try {
        const title = `${created.title}-modifié`;
        const { updateEvent } = await mutate(gql, UPDATE, 'updateEvent', {
          id: created.id,
          input: { title }
        });
        assert(updateEvent, 'updateEvent renvoie null : renvoie l’évènement modifié.');
        assert(
          updateEvent.title === title,
          `updateEvent renvoie le titre « ${updateEvent.title} » au lieu de « ${title} ».`
        );
        const { event } = await dataOf(
          gql,
          `{ event(id: "${created.id}") { ${FIELDS} } }`,
          'event'
        );
        assert(
          event.title === title,
          'updateEvent renvoie le bon titre, mais event(id:) lit encore l’ancien : modifies-tu l’objet rangé dans les données ?'
        );
        assert(
          event.category === created.category && event.period.start === created.period.start,
          'La catégorie ou la date a changé alors qu’on n’envoyait que le titre : ne copie que les champs fournis.'
        );
      } finally {
        await cleanup(gql, created.id);
      }
    }
  },
  {
    id: 'update-absent',
    label: 'updateEvent(id: "999") échoue avec le code NOT_FOUND',
    run: async ({ gql }) => {
      const result = await gql(UPDATE, { variables: { id: '999', input: { title: 'x' } } });
      const error = result.errors?.[0]?.message;
      if (error && schemaError(error)) throw new Error(schemaError(error));
      const code = codeOf(result);
      assert(
        code === 'NOT_FOUND',
        `updateEvent(id: "999") répond ${error ? `avec le code ${code}` : 'sans erreur'} : un évènement absent mérite un code que le client sait lire, NOT_FOUND.`
      );
    }
  }
];

export const hints = [
  'Dans UpdateEventInput, tous les champs sont facultatifs : que vaut un champ que le client n’a pas envoyé ?',
  'Cherche l’évènement, sinon NOT_FOUND ; ne recopie que les clés présentes dans input. Attention : un client peut envoyer title: null explicitement ; la clé est alors présente, et null finirait dans un champ String!.',
  'Object.assign(event, input) recopie les clés présentes ; refuse d’abord un title vide ou null avec BAD_USER_INPUT, comme à la création.'
];
