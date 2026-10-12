import { assert, expectData } from '@othila-academy/lab';

export const title = 'Servir les données';
export const instructions = `Le schéma promet une liste d'évènements : tiens la promesse. Écris au moins trois évènements
dans src/data/events.js, puis le résolveur de Query.events dans resolvers/query.js,
réuni par resolvers/index.js. Relance ton serveur.`;

export const prediction = {
  promptId: 'premier-type-champs-demandes',
  question:
    'Ton résolveur renvoie des objets complets (id, title, date). Si tu demandes { events { title } }, que reçoit le client ?',
  choices: ['tous les champs', 'seulement title', 'title et id'],
  expected: 'seulement title'
};

// La liste des évènements. En cas d'erreur, le premier check montre celle du serveur, les suivants renvoient vers lui.
async function events(gql, { first = false } = {}) {
  const result = await gql('{ events { id title date } }');
  const error = result.errors?.[0]?.message;
  if (!error) return result.data.events;
  if (!first) throw new Error('events ne répond pas encore : regarde le premier échec de l’étape.');
  // Un champ non nul resté vide : le résolveur par défaut n'a pas trouvé la propriété du même nom.
  const missing = /non-nullable field Event\.(\w+)/.exec(error);
  if (missing)
    throw new Error(
      `Event.${missing[1]} vaut null pour un évènement : les noms des propriétés de tes données sont-ils exactement ceux du schéma ?`
    );
  throw new Error(`events répond « ${error} » : qui a tort, la requête ou le serveur ?`);
}

export const checks = [
  {
    id: 'hello-toujours',
    label: 'hello répond toujours',
    passesOnStart: true,
    run: async ({ gql }) => {
      const data = expectData(await gql('{ hello }'), 'hello');
      assert(
        typeof data.hello === 'string' && data.hello !== '',
        'hello ne répond plus : en réorganisant les résolveurs, as-tu gardé hello dans Query ?'
      );
    }
  },
  {
    id: 'events-liste',
    label: 'events renvoie au moins trois évènements',
    run: async ({ gql }) => {
      const list = await events(gql, { first: true });
      assert(
        list.length >= 3,
        `events renvoie ${list.length} évènement(s) : combien en contient ton tableau ?`
      );
    }
  },
  {
    id: 'events-champs',
    label: 'chaque évènement a un id, un title et une date non vides',
    run: async ({ gql }) => {
      const list = await events(gql);
      list.forEach((event, i) => {
        for (const name of ['id', 'title', 'date']) {
          assert(
            event[name],
            `L'évènement n°${i + 1} n'a pas de ${name} : les noms des propriétés de tes données sont-ils exactement ceux du schéma ?`
          );
        }
      });
    }
  },
  {
    id: 'events-ids-uniques',
    label: 'les id sont tous différents',
    run: async ({ gql }) => {
      const seen = new Set();
      for (const event of await events(gql)) {
        assert(
          !seen.has(event.id),
          `Deux évènements partagent l'id ${event.id} : un identifiant ne désigne qu'un objet.`
        );
        seen.add(event.id);
      }
    }
  }
];

export const hints = [
  'Le schéma dit ce qui existe. Qui dit d’où viennent les valeurs ?',
  'Un résolveur est une fonction rangée sous le nom du type, puis du champ : Query, puis events. Elle renvoie ton tableau.',
  "Dans resolvers/query.js : export const Query = { hello: () => 'Bonjour GraphQL', events: () => events } ; dans resolvers/index.js : export const resolvers = { Query }"
];
