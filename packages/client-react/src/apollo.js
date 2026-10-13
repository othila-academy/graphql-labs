import { ApolloClient, ApolloLink, HttpLink, InMemoryCache } from '@apollo/client';
import { SetContextLink } from '@apollo/client/link/context';
import { offsetLimitPagination } from '@apollo/client/utilities';

// L'URL du serveur vient de l'environnement (VITE_GRAPHQL_URL), avec celle du serveur local par défaut.
const uri = import.meta.env.VITE_GRAPHQL_URL ?? 'http://localhost:4000/graphql';

// Chaque requête emporte le jeton gardé à la connexion, s'il y en a un.
const auth = new SetContextLink(({ headers }) => {
  const token = localStorage.getItem('token');
  return { headers: { ...headers, ...(token ? { authorization: `Bearer ${token}` } : {}) } };
});

// Les pages d'events se mettent bout à bout ; une catégorie a sa propre liste.
const cache = new InMemoryCache({
  typePolicies: { Query: { fields: { events: offsetLimitPagination(['category']) } } }
});

export const client = new ApolloClient({
  link: ApolloLink.from([auth, new HttpLink({ uri })]),
  cache
});
