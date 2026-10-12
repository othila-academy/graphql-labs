import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { userFromHeader } from './auth/jwt.js';
import { authDirective } from './directives/auth.js';
import { resolvers } from './resolvers/index.js';
import { typeDefs } from './schema/typeDefs.js';

// Le schéma exécutable, puis le transformateur qui applique @auth.
const schema = authDirective(makeExecutableSchema({ typeDefs, resolvers }));

// Les erreurs gardent leur code, mais plus la pile d'appels du serveur.
const server = new ApolloServer({ schema, includeStacktraceInErrorResponses: false });

// PORT: lab replay lance plusieurs serveurs côte à côte ; 4000 par défaut
const { url } = await startStandaloneServer(server, {
  listen: {
    port: Number(process.env.PORT ?? 4000)
  },
  // Construit une fois par requête : chaque résolveur le reçoit en troisième argument.
  context: async ({ req }) => ({ user: userFromHeader(req.headers.authorization) })
});

console.log(`Serveur prêt sur ${url}graphql`);
