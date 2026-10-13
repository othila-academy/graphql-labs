import { gql } from '@apollo/client';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, test } from 'vitest';
import { client } from '@client/src/apollo.js';
import Login from '@client/src/Login.jsx';
import { crash, loginBilal, show } from './helpers.jsx';

beforeEach(() => client.clearStore());

// Remplit et envoie le formulaire avec le compte de Bilal.
function submitBilal() {
  show(client, Login, 'src/Login.jsx');
  const email = screen.queryByLabelText(/e-mail/i);
  const password = screen.queryByLabelText(/mot de passe/i);
  const button = screen.queryByRole('button', { name: /se connecter/i });
  expect(
    email,
    "Le formulaire n'a pas de champ étiqueté « E-mail » : relis la consigne."
  ).not.toBeNull();
  expect(
    password,
    "Le formulaire n'a pas de champ étiqueté « Mot de passe » : relis la consigne."
  ).not.toBeNull();
  expect(
    button,
    "Le formulaire n'a pas de bouton « Se connecter » : relis la consigne."
  ).not.toBeNull();
  fireEvent.change(email, { target: { value: 'bilal@othila.test' } });
  fireEvent.change(password, { target: { value: 'password123' } });
  fireEvent.click(button);
}

test('jeton-garde', async () => {
  submitBilal();
  await waitFor(
    () => {
      expect(crash(), `Login plante (« ${crash()} »).`).toBeNull();
      expect(
        localStorage.getItem('token'),
        'Aucun jeton dans localStorage (clé token) après la connexion : que fais-tu de data.login.token ?'
      ).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);
    },
    { timeout: 3000 }
  );
});

test('jeton-envoye', async () => {
  localStorage.setItem('token', await loginBilal());
  const result = await client
    .query({
      query: gql`
        query Me {
          me {
            name
          }
        }
      `,
      fetchPolicy: 'network-only'
    })
    .catch((error) => ({ error }));
  expect(
    result.error,
    `me est refusé (« ${result.error?.message} ») alors que le jeton est dans localStorage : un lien de contexte ajoute-t-il l'en-tête authorization ?`
  ).toBeUndefined();
  expect(result.data?.me?.name, 'me ne renvoie pas Bilal avec son jeton.').toBe('Bilal');
});

test('nom-affiche', async () => {
  submitBilal();
  await waitFor(
    () => {
      expect(crash(), `Login plante (« ${crash()} »).`).toBeNull();
      expect(
        screen.queryAllByText(/Bilal/).length,
        "Le nom de l'utilisateur connecté n'apparaît pas : Login interroge-t-il me une fois le jeton gardé ?"
      ).toBeGreaterThan(0);
    },
    { timeout: 3000 }
  );
});
