// Les aides des tests du lab client-apollo : interroger le serveur directement, et rendre un composant de
// l'étudiant dans son propre ApolloProvider, avec une limite d'erreur qui dit s'il a planté.
import { Component } from 'react';
import { render, screen } from '@testing-library/react';
import { ApolloProvider } from '@apollo/client/react';
import { expect } from 'vitest';

export async function server(query, variables, token) {
  const res = await fetch(process.env.LAB_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ query, variables })
  });
  return res.json();
}

export async function loginBilal() {
  const { data } = await server(
    'mutation ($email: String!, $password: String!) { login(email: $email, password: $password) { token } }',
    { email: 'bilal@othila.test', password: 'password123' }
  );
  return data.login.token;
}

class Limit extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) return <p data-testid="plantage">{this.state.error.message}</p>;
    return this.props.children;
  }
}

// name : le fichier attendu, pour un message clair si son export par défaut manque.
export function show(client, Component, name) {
  expect(
    typeof Component,
    `${name} n'exporte pas de composant par défaut : export default function …`
  ).toBe('function');
  return render(
    <ApolloProvider client={client}>
      <Limit>
        <Component />
      </Limit>
    </ApolloProvider>
  );
}

// Le message du plantage, s'il y en a eu un ; null sinon.
export const crash = () => screen.queryByTestId('plantage')?.textContent ?? null;
