import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { makeExecutableSchema } from '@graphql-tools/schema';
import DataLoader from 'dataloader';
import { userFromHeader } from './auth/jwt.js';
import { repository } from './data/repository.js';
import { authDirective } from './directives/auth.js';
import { resolvers } from './resolvers/index.js';
import { typeDefs } from './schema/typeDefs.js';
import { repositoryCallsPlugin } from './trace/repositoryCalls.js';

// Le schéma exécutable, puis le transformateur qui applique @auth.
const schema = authDirective(makeExecutableSchema({ typeDefs, resolvers }));

// Les erreurs gardent leur code, mais plus la pile d'appels du serveur ; chaque réponse compte ses accès aux données.
const server = new ApolloServer({
  schema,
  includeStacktraceInErrorResponses: false,
  plugins: [repositoryCallsPlugin]
});

// PORT: lab replay lance plusieurs serveurs côte à côte ; 4000 par défaut
const { url } = await startStandaloneServer(server, {
  listen: {
    port: Number(process.env.PORT ?? 4000)
  },
  // Construit une fois par requête : chaque résolveur le reçoit en troisième argument.
  // Les loaders aussi : leur cache ne doit pas survivre à la requête.
  context: async ({ req }) => ({
    user: userFromHeader(req.headers.authorization),
    loaders: { userById: new DataLoader(async (ids) => repository.findUsersByIds(ids)) }
  })
});

console.log(`Serveur prêt sur ${url}graphql`);
