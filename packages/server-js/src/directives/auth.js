import { MapperKind, getDirective, mapSchema } from '@graphql-tools/utils';
import { GraphQLError, defaultFieldResolver } from 'graphql';
import { requireUser } from '../auth/guards.js';

// Enveloppe le résolveur de chaque champ qui porte @auth : la règle est écrite une fois, dans le schéma.
export function authDirective(schema) {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (field) => {
      const auth = getDirective(schema, field, 'auth')?.[0];
      if (!auth) return field;
      const resolve = field.resolve ?? defaultFieldResolver;
      field.resolve = (parent, args, context, info) => {
        const user = requireUser(context.user);
        if (auth.requires === 'ADMIN' && user.role !== 'ADMIN')
          throw new GraphQLError('réservé aux administrateurs', {
            extensions: { code: 'FORBIDDEN' }
          });
        return resolve(parent, args, context, info);
      };
      return field;
    }
  });
}
