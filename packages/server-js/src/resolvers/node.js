// Le résolveur de node renvoie un objet JavaScript : __resolveType dit à GraphQL quel type concret il porte.
export const Node = {
  __resolveType: (obj) => ('organizerId' in obj ? 'Event' : 'User')
};
