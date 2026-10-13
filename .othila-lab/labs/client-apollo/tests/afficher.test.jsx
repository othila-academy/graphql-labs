import { screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, test } from 'vitest';
import { client } from '@client/src/apollo.js';
import EventsList from '@client/src/EventsList.jsx';
import { crash, server, show } from './helpers.jsx';

const EVENTS = '{ events { id title organizer { id name } } }';
const events = async () => (await server(EVENTS)).data.events;

beforeEach(() => client.clearStore());

const notCrashed = () =>
  expect(
    crash(),
    `EventsList plante (« ${crash()} ») : un évènement peut avoir un organisateur null.`
  ).toBeNull();

const visible = (text, message) =>
  waitFor(() => {
    notCrashed();
    expect(screen.queryAllByText(text, { exact: false }).length, message).toBeGreaterThan(0);
  });

test('liste-titres', async () => {
  const list = await events();
  show(client, EventsList, 'src/EventsList.jsx');
  for (const { title } of list) {
    await visible(
      title,
      `Le titre « ${title} » n'apparaît pas : le composant lit-il data.events une fois le chargement fini ?`
    );
  }
});

test('liste-organisateurs', async () => {
  const list = await events();
  show(client, EventsList, 'src/EventsList.jsx');
  for (const { organizer } of list.filter((e) => e.organizer)) {
    await visible(
      organizer.name,
      `Le nom « ${organizer.name} » n'apparaît pas : la requête demande-t-elle organizer { name } ?`
    );
  }
  await visible(list[list.length - 1].title, 'La liste n’est pas affichée en entier.');
});

test('cache-normalise', async () => {
  const list = await events();
  const event = list.find((e) => e.organizer);
  show(client, EventsList, 'src/EventsList.jsx');
  await visible(
    event.title,
    `Le titre « ${event.title} » n'apparaît pas : regarde le check liste-titres.`
  );
  const cache = client.cache.extract();
  expect(
    cache[`Event:${event.id}`],
    `Le cache ne contient pas Event:${event.id} : la requête demande-t-elle l'id de chaque évènement ?`
  ).toBeTruthy();
  expect(
    cache[`User:${event.organizer.id}`],
    `Le cache ne contient pas User:${event.organizer.id} : la requête demande-t-elle l'id de l'organisateur ?`
  ).toBeTruthy();
});
