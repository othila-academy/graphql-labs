import { assert } from '@othila-academy/lab';
import { session } from '../../shared/auth.mjs';

export const title = 'Un serveur qui sait parler WebSocket';
export const instructions = `startStandaloneServer ne gère pas les WebSockets. Passe à Express 5 avec @as-integrations/express5,
sur un serveur HTTP que tu crées toi-même (http.createServer), au même port et au même chemin /graphql.
Ajoute une route GET /health qui répond { ok: true }. Tout ce qui marchait doit marcher encore, client React
compris : startStandaloneServer posait cors() et lisait le JSON pour toi.`;

export const prediction = {
  promptId: 'subscriptions-client-apres-migration',
  question: 'Après la migration, le client React doit-il changer quoi que ce soit ?',
  choices: ['oui, l’URL', 'non'],
  expected: 'non'
};

// Une requête comme celle du client React : une autre origine (le port de Vite), du JSON.
const FROM_CLIENT = {
  method: 'POST',
  headers: { 'content-type': 'application/json', origin: 'http://localhost:5173' },
  body: JSON.stringify({ query: '{ events(limit: 1) { id } }' })
};

export const checks = [
  {
    id: 'health',
    label: 'GET /health répond { ok: true }',
    run: async ({ url }) => {
      const res = await fetch(new URL('/health', url));
      const text = await res.text();
      assert(
        res.ok,
        `GET /health répond ${res.status} au lieu de { ok: true } : le serveur est-il passé à Express, avec app.get('/health', …) ?`
      );
      let body = null;
      try {
        body = JSON.parse(text);
      } catch {
        // pas du JSON : le message ci-dessous le montre
      }
      assert(
        body?.ok === true,
        `GET /health répond « ${text.slice(0, 80)} » au lieu de { ok: true } : res.json({ ok: true }).`
      );
    }
  },
  {
    id: 'rien-casse',
    label:
      'events, me (avec le jeton de Bilal), extensions.repositoryCalls et l’en-tête CORS répondent comme avant',
    passesOnStart: true,
    run: async ({ gql, url }) => {
      const res = await fetch(url, FROM_CLIENT);
      assert(
        res.status !== 500,
        'HTTP 500 sur /graphql : express.json() est-il avant expressMiddleware ?'
      );
      assert(
        res.headers.get('access-control-allow-origin'),
        "Pas d'en-tête Access-Control-Allow-Origin : le client React, sur un autre port, sera bloqué ; ajoute cors() avant expressMiddleware."
      );
      const body = await res.json();
      assert(
        !body.errors && body.data?.events,
        `events ne répond plus (« ${body.errors?.[0]?.message} ») : relis les options passées à ApolloServer.`
      );
      assert(
        Number.isInteger(body.extensions?.repositoryCalls),
        "Plus de repositoryCalls dans extensions : le plugin est-il toujours dans les plugins d'ApolloServer ?"
      );
      const bilal = await session(gql, 'bilal');
      const me = await bilal.gql('{ me { name } }');
      assert(
        me.data?.me?.name === bilal.user.name,
        'me répond null avec un jeton : le contexte est-il passé en option de expressMiddleware ?'
      );
    }
  }
];

export const hints = [
  'Apollo Server se branche dans une application Express comme un middleware.',
  'expressMiddleware(server, { context }) de @as-integrations/express5, après cors() et express.json(), sur un http.Server que tu crées toi-même.',
  "app.use('/graphql', cors(), express.json(), expressMiddleware(server, { context })) ; httpServer.listen(port) ; useServer viendra à l'étape suivante."
];
