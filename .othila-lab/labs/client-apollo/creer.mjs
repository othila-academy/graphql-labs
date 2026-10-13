import { componentTest } from '@othila-academy/lab';

export const title = 'Créer le client';
export const instructions = `Jusqu'ici, Apollo Sandbox jouait le rôle du client. Crée le tien, depuis la racine du cours :
  cd packages && npm create vite@latest client-react -- --template react --no-interactive && cd ..
  npm install
  npm install @apollo/client graphql rxjs -w client-react
  npm install -D vitest jsdom @testing-library/react @testing-library/dom -w client-react
  npm pkg set scripts.start:client="npm run dev --workspace client-react"
Puis écris packages/client-react/src/apollo.js, qui exporte client : un ApolloClient dont l'URL vient de
import.meta.env.VITE_GRAPHQL_URL (http://localhost:4000/graphql par défaut).`;

export const prediction = {
  promptId: 'client-apollo-cors',
  question:
    'Ton client et ton serveur tournent sur deux ports différents (5173 et 4000). Que faut-il pour que le navigateur accepte la réponse du serveur ?',
  choices: ['rien de particulier', 'que le serveur autorise l’origine du client (CORS)'],
  expected: 'que le serveur autorise l’origine du client (CORS)'
};

export const checks = [
  componentTest({
    id: 'client-exporte',
    label: 'src/apollo.js exporte client, un ApolloClient',
    file: 'tests/creer.test.jsx'
  }),
  componentTest({
    id: 'client-joint-serveur',
    label: 'client.query répond, sur l’URL donnée par VITE_GRAPHQL_URL',
    file: 'tests/creer.test.jsx'
  })
];

export const hints = [
  'Un client Apollo a besoin de deux choses : savoir où envoyer les requêtes, et où ranger les réponses.',
  'new ApolloClient({ link: new HttpLink({ uri }), cache: new InMemoryCache() }), avec uri lu dans import.meta.env.',
  "const uri = import.meta.env.VITE_GRAPHQL_URL ?? 'http://localhost:4000/graphql' ; export const client = new ApolloClient({ link: new HttpLink({ uri }), cache: new InMemoryCache() })"
];
