// /* GraphQL */ : l'éditeur colore le schéma et Prettier le met en forme.
export const typeDefs = /* GraphQL */ `
  enum EventCategory {
    ATELIER
    CONFERENCE
    HACKATHON
    SOIREE
  }

  "Réserve un champ aux utilisateurs connectés ; requires: ADMIN le réserve aux administrateurs."
  directive @auth(requires: Role = MEMBER) on FIELD_DEFINITION

  enum Role {
    MEMBER
    ADMIN
  }

  interface Node {
    id: ID!
  }

  type User implements Node {
    id: ID!
    name: String!
    email: String!
    role: Role!
    organizedEvents: [Event!]!
    participations: [Event!]!
  }

  type DateRange {
    start: String!
    end: String!
  }

  type Event implements Node {
    id: ID!
    title: String!
    date: String! @deprecated(reason: "Utilise period.start.")
    period: DateRange!
    category: EventCategory!
    organizer: User
    participants: [User!]!
    participantsCount: Int!
  }

  type Stats {
    eventsCount: Int!
    usersCount: Int!
    registrationsCount: Int!
  }

  type AuthPayload {
    token: String!
    user: User!
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
    "L'utilisateur connecté."
    me: User @auth
    stats: Stats! @auth(requires: ADMIN)
  }

  input CreateEventInput {
    title: String!
    start: String!
    "Facultatif : sans fin, l'évènement dure un jour."
    end: String
    category: EventCategory!
  }

  "Tous les champs sont facultatifs : seuls ceux fournis changent."
  input UpdateEventInput {
    title: String
    start: String
    end: String
    category: EventCategory
  }

  type Mutation {
    createEvent(input: CreateEventInput!): Event! @auth
    updateEvent(id: ID!, input: UpdateEventInput!): Event! @auth
    "Renvoie l'id de l'évènement supprimé."
    deleteEvent(id: ID!): ID! @auth
    login(email: String!, password: String!): AuthPayload!
  }
`;
