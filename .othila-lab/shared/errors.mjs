// Les erreurs du serveur que les labs du cours traduisent en question pour l'apprenant.

// Une erreur de validation qui vient du schéma (champ ou argument inconnu, argument obligatoire oublié) :
// la question à poser à l'apprenant, ou null si l'erreur est d'une autre nature.
export function schemaError(message) {
  const field = /Cannot query field "(\w+)" on type "(\w+)"/.exec(message);
  if (field)
    return `${field[2]} n'a pas de champ ${field[1]} : l'as-tu déclaré dans le schéma, et as-tu relancé ton serveur ?`;
  const arg = /Unknown argument "(\w+)" on field "(\w+\.\w+)"/.exec(message);
  if (arg)
    return `${arg[2]} n'a pas d'argument ${arg[1]} : l'as-tu déclaré dans le schéma, et as-tu relancé ton serveur ?`;
  const required = /Field "(\w+)" argument "(\w+)" of type "(.+?)" is required/.exec(message);
  if (required)
    return `${required[1]} exige l'argument ${required[2]} (${required[3]}) : une requête sans cet argument doit-elle vraiment être refusée ?`;
  const spread = /objects of type "(\w+)" can never be of type "(\w+)"/.exec(message);
  if (spread)
    return `Pour le schéma, un ${spread[1]} ne peut jamais être un ${spread[2]} : le champ renvoie-t-il une interface que ${spread[2]} implémente, ou une union qui le contient ?`;
  const abstract = /Abstract type "(\w+)" must resolve to an Object type/.exec(message);
  if (abstract)
    return `${abstract[1]} ne sait pas quel type concret porte chaque objet : qui le dit à GraphQL, et est-il réuni dans resolvers/index.js ?`;
  return null;
}

// Un champ non nul resté vide : le résolveur par défaut n'a pas trouvé la propriété du même nom.
export function nullField(message, type) {
  const match = new RegExp(`non-nullable field ${type}\\.(\\w+)`).exec(message);
  return match ? match[1] : null;
}
