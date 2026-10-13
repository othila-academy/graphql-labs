import { GraphQLError, Kind } from 'graphql';

export const MAX_DEPTH = 6;

// La profondeur d'une sélection : un champ compte un niveau, feuilles comprises ({ events { title } } : 2).
// Les champs d'introspection (__schema, __type, __typename) ne comptent pas. seen : les fragments déjà
// suivis sur ce chemin, pour qu'une boucle de fragments ne fasse pas tourner la règle sans fin.
function depth(selectionSet, fragments, level = 1, seen = new Set()) {
  if (!selectionSet) return level - 1;
  return Math.max(
    ...selectionSet.selections.map((sel) => {
      if (sel.kind === Kind.FIELD)
        return sel.name.value.startsWith('__')
          ? 0
          : depth(sel.selectionSet, fragments, level + 1, seen);
      if (sel.kind === Kind.INLINE_FRAGMENT) return depth(sel.selectionSet, fragments, level, seen);
      const name = sel.name.value;
      // NoFragmentCycles, une règle standard, signale déjà la boucle.
      if (seen.has(name)) return 0;
      return depth(fragments[name]?.selectionSet, fragments, level, new Set(seen).add(name));
    })
  );
}

// Une règle de validation : elle parcourt la requête avant toute exécution, et la refuse au-delà de max.
export const depthLimit =
  (max = MAX_DEPTH) =>
  (context) => ({
    OperationDefinition(node) {
      const fragments = Object.fromEntries(
        context
          .getDocument()
          .definitions.filter((d) => d.kind === Kind.FRAGMENT_DEFINITION)
          .map((d) => [d.name.value, d])
      );
      const d = depth(node.selectionSet, fragments);
      if (d > max)
        context.reportError(
          new GraphQLError(`requête trop profonde : ${d} niveaux, ${max} au plus`, {
            nodes: [node]
          })
        );
    }
  });
