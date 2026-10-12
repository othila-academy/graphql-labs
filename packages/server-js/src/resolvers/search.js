// Comme pour Node : l'union ne sait pas seule quel type concret porte chaque résultat.
export const SearchResult = {
  __resolveType: (obj) => ('organizerId' in obj ? 'Event' : 'User')
};
