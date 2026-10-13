import { componentTest } from '@othila-academy/lab';

export const title = 'Afficher les évènements';
export const instructions = `Écris packages/client-react/src/EventsList.jsx (export par défaut) : une requête nommée EventsList
demande chaque évènement avec son id, son titre, sa date de début et le nom de son organisateur, et le composant
les affiche. Branche ApolloProvider dans main.jsx, puis lance le serveur et le client ensemble
(npm run start:server-js, npm run start:client) pour voir la page sur http://localhost:5173.`;

export const prediction = {
  promptId: 'client-apollo-categorie',
  question:
    'Ton composant demande id, title et organizer { name }. Le client reçoit-il aussi la catégorie ?',
  choices: ['oui', 'non'],
  expected: 'non'
};

export const checks = [
  componentTest({
    id: 'liste-titres',
    label: 'EventsList affiche le titre de chaque évènement renvoyé par events',
    file: 'tests/afficher.test.jsx'
  }),
  componentTest({
    id: 'liste-organisateurs',
    label:
      'EventsList affiche le nom de l’organisateur de chaque évènement qui en a un, sans planter sur l’évènement orphelin',
    file: 'tests/afficher.test.jsx'
  }),
  componentTest({
    id: 'cache-normalise',
    label: 'après l’affichage, le cache range l’évènement et son organisateur par type et id',
    file: 'tests/afficher.test.jsx'
  })
];

export const hints = [
  'Quel composant rend le client Apollo disponible à toute l’application ?',
  'ApolloProvider autour de l’application, puis useQuery dans EventsList ; pense à loading et error.',
  'const { data, loading, error } = useQuery(EVENTS_LIST) ; if (loading) … ; data.events.map((e) => <li key={e.id}>{e.title} · {e.organizer?.name}</li>)'
];
