import http from 'node:http';
import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { expressMiddleware } from '@as-integrations/express5';
import { makeExecutableSchema } from '@graphql-tools/schema';
import cors from 'cors';
import DataLoader from 'dataloader';
import express from 'express';
import { specifiedRules, validate } from 'graphql';
import { useServer } from 'graphql-ws/use/ws';
import { WebSocketServer } from 'ws';
import { userFromHeader } from './auth/jwt.js';
import { repository } from './data/repository.js';
import { authDirective } from './directives/auth.js';
import { resolvers } from './resolvers/index.js';
import { typeDefs } from './schema/typeDefs.js';
import { repositoryCallsPlugin } from './trace/repositoryCalls.js';
import { depthLimit } from './validation/depthLimit.js';

// Le schéma exécutable, puis le transformateur qui applique @auth.
const schema = authDirective(makeExecutableSchema({ typeDefs, resolvers }));

// Les loaders d'une opération : chaque requête HTTP, chaque abonnement a les siens, leur cache ne doit pas leur survivre.
const loaders = () => ({
  userById: new DataLoader(async (ids) => repository.findUsersByIds(ids))
});

// Un serveur HTTP créé à la main : Express y répond aux requêtes, le serveur WebSocket s'y branche
// pour les subscriptions, sur le même port et le même chemin.
const app = express();
const httpServer = http.createServer(app);
const wsServer = new WebSocketServer({ server: httpServer, path: '/graphql' });

// Une opération reçue par WebSocket ne passe ni par expressMiddleware ni par ApolloServer :
// son contexte et sa validation se donnent ici.
const serverCleanup = useServer(
  {
    schema,
    context: () => ({ loaders: loaders() }),
    validate: (schema, document) => validate(schema, document, [...specifiedRules, depthLimit()])
  },
  wsServer
);

// Les erreurs gardent leur code, mais plus la pile d'appels du serveur ; chaque réponse compte ses accès aux données ;
// une requête trop profonde est refusée avant d'être exécutée. À l'arrêt, le serveur finit les requêtes en cours
// et ferme les WebSockets.
const server = new ApolloServer({
  schema,
  includeStacktraceInErrorResponses: false,
  validationRules: [depthLimit()],
  plugins: [
    ApolloServerPluginDrainHttpServer({ httpServer }),
    repositoryCallsPlugin,
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose();
          }
        };
      }
    }
  ]
});
await server.start();

app.get('/health', (_req, res) => res.json({ ok: true }));
// startStandaloneServer posait cors() et lisait le JSON : c'est maintenant à nous.
app.use(
  '/graphql',
  cors(),
  express.json(),
  expressMiddleware(server, {
    // Construit une fois par requête : chaque résolveur le reçoit en troisième argument.
    context: async ({ req }) => ({
      user: userFromHeader(req.headers.authorization),
      loaders: loaders()
    })
  })
);

// PORT: lab replay lance plusieurs serveurs côte à côte ; 4000 par défaut
const port = Number(process.env.PORT ?? 4000);
httpServer.listen(port, () => console.log(`Serveur prêt sur http://localhost:${port}/graphql`));
