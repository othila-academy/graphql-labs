import { gql } from '@apollo/client';
import { expect, test, vi } from 'vitest';
import * as apollo from '@client/src/apollo.js';

const exported = () =>
  expect(
    typeof apollo.client?.query,
    "src/apollo.js n'exporte pas client : export const client = new ApolloClient(…) ?"
  ).toBe('function');

test('client-exporte', () => {
  exported();
});

test('client-joint-serveur', async () => {
  exported();
  const calls = vi.spyOn(globalThis, 'fetch');
  const result = await apollo.client
    .query({
      query: gql`
        query Ping {
          __typename
        }
      `,
      fetchPolicy: 'network-only'
    })
    .catch((error) => ({ error }));
  const urls = calls.mock.calls.map(([url]) => String(url));
  calls.mockRestore();
  expect(
    result.error,
    `client.query n'atteint pas le serveur (« ${result.error?.message} ») : l'URL vient-elle de import.meta.env.VITE_GRAPHQL_URL ?`
  ).toBeUndefined();
  expect(
    urls.some((url) => url.includes('depuis=env')),
    `client.query appelle ${urls[0]} : l'URL est-elle écrite en dur au lieu de venir de import.meta.env.VITE_GRAPHQL_URL ?`
  ).toBe(true);
});
