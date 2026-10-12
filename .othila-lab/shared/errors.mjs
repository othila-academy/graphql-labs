// Les erreurs du serveur que les labs du cours traduisent en question pour l'apprenant.

// Un champ que la requête demande et que le schéma ne déclare pas : null si ce n'est pas le cas.
export function unknownField(message) {
  const match = /Cannot query field "(\w+)" on type "(\w+)"/.exec(message);
  if (!match) return null;
  return `${match[2]} n'a pas de champ ${match[1]} : l'as-tu déclaré dans le schéma, et as-tu relancé ton serveur ?`;
}

// Un champ non nul resté vide : le résolveur par défaut n'a pas trouvé la propriété du même nom.
export function nullField(message, type) {
  const match = new RegExp(`non-nullable field ${type}\\.(\\w+)`).exec(message);
  return match ? match[1] : null;
}
