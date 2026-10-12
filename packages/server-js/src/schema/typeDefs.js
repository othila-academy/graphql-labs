// /* GraphQL */ : l'éditeur colore le schéma et Prettier le met en forme.
export const typeDefs = /* GraphQL */ `
  enum EventCategory {
    ATELIER
    CONFERENCE
    HACKATHON
    SOIREE
  }

  type User {
    id: ID!
    name: String!
    organizedEvents: [Event!]!
    participations: [Event!]!
  }

  type Event {
    id: ID!
    title: String!
    date: String!
    category: EventCategory!
    organizer: User
    participants: [User!]!
    participantsCount: Int!
  }

  type Query {
    hello: String!
    events(category: EventCategory): [Event!]!
    users: [User!]!
    event(id: ID!): Event
    user(id: ID!): User
  }
`;
