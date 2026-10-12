// Les erreurs du serveur que les labs du cours traduisent en question pour l'apprenant.

// Un champ, ou un argument, que la requête utilise et que le schéma ne déclare pas : null si ce n'est pas le cas.
export function unknownField(message) {
  const field = /Cannot query field "(\w+)" on type "(\w+)"/.exec(message);
  if (field)
    return `${field[2]} n'a pas de champ ${field[1]} : l'as-tu déclaré dans le schéma, et as-tu relancé ton serveur ?`;
  const arg = /Unknown argument "(\w+)" on field "(\w+\.\w+)"/.exec(message);
  if (arg)
    return `${arg[2]} n'a pas d'argument ${arg[1]} : l'as-tu déclaré dans le schéma, et as-tu relancé ton serveur ?`;
  return null;
}

// Un champ non nul resté vide : le résolveur par défaut n'a pas trouvé la propriété du même nom.
export function nullField(message, type) {
  const match = new RegExp(`non-nullable field ${type}\\.(\\w+)`).exec(message);
  return match ? match[1] : null;
}
