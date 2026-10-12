import { GraphQLError } from 'graphql';

// Authentifier : qui es-tu ? Sans utilisateur connecté, UNAUTHENTICATED.
export function requireUser(user) {
  if (!user)
    throw new GraphQLError('connexion requise', { extensions: { code: 'UNAUTHENTICATED' } });
  return user;
}

// Autoriser : as-tu le droit ? Seuls l'organisateur de l'évènement et un ADMIN y touchent.
export function requireOwnerOrAdmin(user, event) {
  if (user.role !== 'ADMIN' && event.organizerId !== user.id)
    throw new GraphQLError("tu n'organises pas cet évènement", {
      extensions: { code: 'FORBIDDEN' }
    });
}
