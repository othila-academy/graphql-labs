// /* GraphQL */ : l'éditeur colore le schéma et Prettier le met en forme.
export const typeDefs = /* GraphQL */ `
  type Event {
    id: ID!
    title: String!
    date: String!
  }

  type Query {
    hello: String!
    events: [Event!]!
  }
`;
