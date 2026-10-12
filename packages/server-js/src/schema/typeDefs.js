// /* GraphQL */ : l'éditeur colore le schéma et Prettier le met en forme.
export const typeDefs = /* GraphQL */ `
  enum EventCategory {
    ATELIER
    CONFERENCE
    HACKATHON
    SOIREE
  }

  interface Node {
    id: ID!
  }

  type User implements Node {
    id: ID!
    name: String!
    organizedEvents: [Event!]!
    participations: [Event!]!
  }

  type Event implements Node {
    id: ID!
    title: String!
    date: String!
    category: EventCategory!
    organizer: User
    participants: [User!]!
    participantsCount: Int!
  }

  union SearchResult = User | Event

  type Query {
    hello: String!
    events(category: EventCategory): [Event!]!
    users: [User!]!
    event(id: ID!): Event
    user(id: ID!): User
    node(id: ID!): Node
    search(text: String!): [SearchResult!]!
  }
`;
