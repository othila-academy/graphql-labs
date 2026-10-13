// La préparation des tests de composants du cours, chargée par lab check avant chaque fichier de test.
// Le client lit l'URL du serveur dans import.meta.env.VITE_GRAPHQL_URL : on lui donne celle du serveur vérifié,
// avec une marque (?depuis=env) qui prouve que l'URL vient bien de l'environnement.
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

vi.stubEnv('VITE_GRAPHQL_URL', `${process.env.LAB_GRAPHQL_URL}?depuis=env`);

afterEach(() => {
  cleanup();
  localStorage.clear();
});
