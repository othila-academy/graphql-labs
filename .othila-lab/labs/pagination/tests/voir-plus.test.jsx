import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import { client } from '@client/src/apollo.js';
import EventsList from '@client/src/EventsList.jsx';
import { crash, server, show } from '../../client-apollo/tests/helpers.jsx';

// Tous les évènements, dans l'ordre du serveur, et leur nombre.
async function events() {
  const { data, errors } = await server('{ events(limit: 50) { id title } eventsCount }');
  expect(
    errors?.[0]?.message ?? null,
    'Le serveur ne répond pas à events(limit: 50) et eventsCount : les étapes paginer et compter passent-elles ?'
  ).toBeNull();
  expect(
    data.eventsCount,
    `Avec ${data.eventsCount} évènement(s), il n'y a pas de deuxième page : regarde le check donnees.`
  ).toBeGreaterThan(10);
  return data;
}

beforeEach(() => client.clearStore());

const notCrashed = () => expect(crash(), `EventsList plante (« ${crash()} »).`).toBeNull();
const shown = (title) => screen.queryAllByText(title, { exact: false }).length > 0;
const button = () => screen.queryByRole('button', { name: /voir plus/i });

const visible = (title, message) =>
  waitFor(() => {
    notCrashed();
    expect(shown(title), message).toBe(true);
  });

// La première page affichée : les dix premiers titres.
async function firstPage(list) {
  show(client, EventsList, 'src/EventsList.jsx');
  for (const { title } of list.slice(0, 10)) {
    await visible(
      title,
      `Le titre « ${title} » n'apparaît pas sur la première page : EventsList demande-t-il offset 0 et limit 10 ?`
    );
  }
}

const NO_BUTTON =
  'Le bouton « Voir plus » n’apparaît pas : EventsList compare-t-il data.events.length à data.eventsCount ?';
const voirPlus = (message = NO_BUTTON) => waitFor(() => expect(button(), message).not.toBeNull());
const SEE_FIRST = 'Le bouton « Voir plus » n’apparaît pas : regarde le check premiere-page.';

// Les variables envoyées au serveur par chaque requête.
const sentVariables = (calls) =>
  calls.mock.calls.map(([, init]) => {
    try {
      return JSON.parse(init?.body ?? '{}').variables ?? {};
    } catch {
      return {};
    }
  });

test('premiere-page', async () => {
  const { events: list } = await events();
  await firstPage(list);
  await voirPlus();
});

test('page-suivante', async () => {
  const { events: list } = await events();
  const { data } = await server('{ events(offset: 10, limit: 10) { id } }');
  expect(
    data?.events?.map((e) => e.id).join(', '),
    'Le serveur ne renvoie pas la page suivante (offset 10, limit 10) : regarde l’étape paginer.'
  ).toBe(
    list
      .slice(10, 20)
      .map((e) => e.id)
      .join(', ')
  );
  await firstPage(list);
  await voirPlus(SEE_FIRST);
  const calls = vi.spyOn(globalThis, 'fetch');
  fireEvent.click(button());
  const next = list[10];
  try {
    await visible(next.title, 'aucun nouvel évènement');
  } catch {
    const asked = sentVariables(calls).some((v) => v.offset >= 10);
    calls.mockRestore();
    notCrashed();
    throw new Error(
      asked
        ? `Après « Voir plus », la page suivante est arrivée mais « ${next.title} » n'apparaît pas : sans politique de champ, le cache la range à part. Configure Query.events dans apollo.js (offsetLimitPagination).`
        : 'Après « Voir plus », aucune page suivante n’est demandée au serveur : fetchMore passe-t-il offset: data.events.length ?'
    );
  }
  calls.mockRestore();
  expect(
    shown(list[0].title),
    `Après « Voir plus », « ${list[0].title} » a disparu : le cache met-il les pages bout à bout (offsetLimitPagination) ?`
  ).toBe(true);
});

test('fin-de-liste', async () => {
  const { events: list, eventsCount } = await events();
  await firstPage(list);
  await voirPlus(SEE_FIRST);
  for (let page = 1; page * 10 < eventsCount; page++) {
    await voirPlus(
      `« Voir plus » disparaît après ${page * 10} évènements, il en reste ${eventsCount - page * 10} : compare data.events.length à data.eventsCount.`
    );
    fireEvent.click(button());
    const last = list[Math.min((page + 1) * 10, eventsCount) - 1];
    await visible(
      last.title,
      `Après « Voir plus », « ${last.title} » n'apparaît pas : regarde le check page-suivante.`
    );
  }
  for (const { title } of list) {
    expect(
      shown(title),
      `« ${title} » n'apparaît pas une fois toutes les pages chargées : regarde le check page-suivante.`
    ).toBe(true);
  }
  await waitFor(() =>
    expect(
      button(),
      `« Voir plus » reste affiché alors que les ${eventsCount} évènements sont là : compare data.events.length à data.eventsCount.`
    ).toBeNull()
  );
});
