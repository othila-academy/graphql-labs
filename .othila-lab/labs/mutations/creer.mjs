import { assert } from '@othila-academy/lab';
import { nullField, schemaError } from '../../shared/errors.mjs';
import { dataOf } from '../../shared/query.mjs';
import { expectField, typeOf } from '../../shared/schema.mjs';
import { cleanup, codeOf, create, createProbe, probeTitle } from './shared.mjs';

export const title = 'Créer un évènement';
export const instructions = `Jusqu'ici, ton API ne fait que lire. Déclare un input CreateEventInput (title, start,
end facultatif qui vaut start par défaut, category et organizerId) et une mutation createEvent qui ajoute
l'évènement aux données et le renvoie. Un titre vide (ou fait d'espaces) est refusé avec le code BAD_USER_INPUT.
Les checks créent des évènements check-… : ils disparaissent au redémarrage du serveur.`;

export const prediction = {
  promptId: 'mutations-apres-redemarrage',
  question:
    'Tu crées un évènement, puis tu relances le serveur. La requête events le voit-elle encore ?',
  choices: ['oui', 'non'],
  expected: 'non'
};

// Les champs attendus sur CreateEventInput, et le message quand le type n'est pas le bon.
const INPUT_FIELDS = [
  ['title', 'String!', 'un évènement sans titre a-t-il un sens ?'],
  ['start', 'String!', 'un évènement sans début a-t-il un sens ?'],
  ['end', 'String', 'la fin est facultative : sans elle, l’évènement dure un jour.'],
  ['category', 'EventCategory!', 'quel type n’accepte que les catégories prévues ?'],
  ['organizerId', 'ID!', 'qui organise ? Un identifiant a son propre scalaire.']
];

export const checks = [
  {
    id: 'create-input',
    label: 'CreateEventInput a title, start, end (facultatif), category et organizerId',
    run: async ({ gql }) => {
      const input = await typeOf(gql, 'CreateEventInput');
      assert(
        input,
        "Le schéma n'a pas d'input CreateEventInput : le nom tient compte des majuscules."
      );
      assert(
        input.kind === 'INPUT_OBJECT',
        `CreateEventInput est un type ${input.kind} : quel mot-clé déclare un type d'entrée ?`
      );
      for (const [name, expected, why] of INPUT_FIELDS)
        expectField(input, 'CreateEventInput', name, expected, why);
    }
  },
  {
    id: 'create-renvoie',
    label:
      'createEvent renvoie l’évènement créé, avec un id nouveau, son organisateur, et end = start par défaut',
    run: async ({ gql }) => {
      const before = (await dataOf(gql, '{ events { id } }', 'events')).events.map((e) => e.id);
      const title = probeTitle();
      const result = await create(gql, { title });
      const error = result.errors?.[0]?.message;
      if (error) {
        if (nullField(error, 'DateRange') === 'end')
          throw new Error(
            'Créé sans end, l’évènement a period.end à null : quelle fin donner à un évènement d’un seul jour ?'
          );
        throw new Error(
          schemaError(error) ??
            `createEvent répond « ${error} » : qui a tort, la requête ou le serveur ?`
        );
      }
      const event = result.data.createEvent;
      await cleanup(gql, event.id);
      assert(
        event.title === title,
        `createEvent renvoie le titre « ${event.title} » au lieu de « ${title} ».`
      );
      assert(
        !before.includes(event.id),
        `createEvent renvoie l'id ${event.id}, déjà pris par un autre évènement : comment calcules-tu le nouvel id ?`
      );
      assert(
        event.organizer?.id,
        'L’évènement créé n’a pas d’organisateur : as-tu gardé organizerId dans l’objet ajouté aux données ?'
      );
      assert(
        event.period.end === event.period.start,
        `Créé sans end, l'évènement finit le ${event.period.end} : sans fin donnée, il dure un jour.`
      );
    }
  },
  {
    id: 'create-visible',
    label: 'l’évènement créé apparaît ensuite dans events et dans event(id:)',
    run: async ({ gql }) => {
      const created = await createProbe(gql);
      const { events, event } = await dataOf(
        gql,
        `{ events { id } event(id: "${created.id}") { title } }`,
        'events'
      );
      await cleanup(gql, created.id);
      assert(
        events.some((e) => e.id === created.id),
        "L'évènement créé n'apparaît pas dans events : l'as-tu ajouté au tableau que lit events ?"
      );
      assert(
        event?.title === created.title,
        `event(id: "${created.id}") ne retrouve pas l'évènement créé : l'id renvoyé est-il celui rangé dans les données ?`
      );
    }
  },
  {
    id: 'titre-vide',
    label:
      'createEvent avec un titre « ␣␣ » échoue avec le code BAD_USER_INPUT, et rien n’est créé',
    run: async ({ gql }) => {
      const count = async () => (await dataOf(gql, '{ events { id } }', 'events')).events.length;
      const before = await count();
      const result = await create(gql, { title: '  ' });
      const created = result.data?.createEvent;
      if (created) await cleanup(gql, created.id);
      const error = result.errors?.[0]?.message;
      if (error && schemaError(error)) throw new Error(schemaError(error));
      assert(!created, 'createEvent accepte un titre vide : où contrôles-tu l’input ?');
      const code = codeOf(result);
      assert(
        code === 'BAD_USER_INPUT',
        `Le code reçu est ${code} : une GraphQLError avec extensions.code BAD_USER_INPUT dit au client ce qui ne va pas.`
      );
      assert(
        (await count()) === before,
        'createEvent refuse le titre vide, mais l’évènement a quand même été ajouté : contrôle l’input avant d’écrire.'
      );
    }
  }
];

export const hints = [
  'Une mutation se déclare comme une requête, dans un type racine à part. Et un argument riche ?',
  'input CreateEventInput { … } ; createEvent(input: CreateEventInput!): Event! ; le résolveur pousse dans events et renvoie l’objet.',
  "throw new GraphQLError('le titre ne peut pas être vide', { extensions: { code: 'BAD_USER_INPUT' } })"
];
