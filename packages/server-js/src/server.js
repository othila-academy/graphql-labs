import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { resolvers } from "./resolvers/index.js";
import { typeDefs } from "./schema/typeDefs.js";

const server = new ApolloServer({ typeDefs, resolvers });

// PORT: lab replay lance plusieurs serveurs côte à côte ; 4000 par défaut
const { url } = await startStandaloneServer(server, {
    listen: {
        port: Number(process.env.PORT ?? 4000)
    }
});

console.log(`Serveur prêt sur ${url}graphql`);
