// /* GraphQL */ : l'éditeur colore le schéma et Prettier le met en forme.
export const typeDefs = /* GraphQL */ `
  type User {
    id: ID!
    name: String!
    organizedEvents: [Event!]!
  }

  type Event {
    id: ID!
    title: String!
    date: String!
    organizer: User
  }

  type Query {
    hello: String!
    events: [Event!]!
    users: [User!]!
    event(id: ID!): Event
    user(id: ID!): User
  }
`;
