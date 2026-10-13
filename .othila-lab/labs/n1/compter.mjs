import { assert } from '@othila-academy/lab';
import { callsOf, steady } from './calls.mjs';

export const title = 'Compter les accès aux données';
export const instructions = `Avant d'optimiser, on mesure. Crée packages/server-js/src/data/repository.js : un dépôt dont chaque
fonction de lecture compte ses appels. Fais-y passer les lectures de Query.events, Query.eventsCount, Query.event
et des champs de Event (organizer, participants, participantsCount). Puis écris un plugin Apollo qui ajoute
le compte de chaque requête à sa réponse, dans extensions.repositoryCalls.`;

export const prediction = {
  promptId: 'n1-liste-seule',
  question: 'Combien d’accès aux données pour { events(limit: 10) { title } } ?',
  choices: ['1', '10', '11'],
  expected: '1'
};

const LIST = '{ events(limit: 10) { title } }';

export const checks = [
  {
    id: 'compteur-present',
    label: 'toute réponse porte extensions.repositoryCalls, un entier',
    run: async ({ gql }) => {
      await callsOf(gql, '{ hello }');
      await callsOf(gql, LIST);
    }
  },
  {
    id: 'compteur-remis',
    label: 'deux requêtes identiques donnent le même compte',
    run: async ({ gql }) => {
      const first = (await callsOf(gql, LIST, 'compteur-present')).calls;
      const second = (await callsOf(gql, LIST, 'compteur-present')).calls;
      assert(
        second === first,
        `Le compte change d'une requête à l'autre (${first}, puis ${second}) : remets le compteur à zéro au début de chaque requête.`
      );
    }
  },
  {
    id: 'liste-seule',
    label: '{ events(limit: 10) { title } } compte 1 accès',
    run: async ({ gql }) => {
      await steady(gql);
      const { calls } = await callsOf(gql, LIST, 'compteur-present');
      assert(
        calls !== 0,
        'La liste seule compte 0 accès : Query.events lit-il le dépôt (listEvents) ?'
      );
      assert(
        calls === 1,
        `La liste seule compte ${calls} accès : events lit-il le dépôt une seule fois, et title (un champ simple) passe-t-il par le dépôt ?`
      );
    }
  },
  {
    id: 'evenement-seul',
    label: '{ event(id: "1") { title } } compte 1 accès',
    run: async ({ gql }) => {
      await steady(gql);
      const { calls } = await callsOf(gql, '{ event(id: "1") { title } }', 'compteur-present');
      assert(
        calls === 1,
        `event(id: "1") compte ${calls} accès : Query.event passe-t-il par le dépôt (findEventById), une seule fois ?`
      );
    }
  }
];

export const hints = [
  'Pour compter, il faut un passage obligé.',
  'Un module dépôt dont chaque fonction incrémente un compteur ; un plugin requestDidStart / willSendResponse qui l’écrit dans response.body.singleResult.extensions.',
  'requestDidStart remet le compteur à zéro ; willSendResponse fait response.body.singleResult.extensions = { ...response.body.singleResult.extensions, repositoryCalls: takeCalls() } ; new ApolloServer({ …, plugins: [repositoryCallsPlugin] }).'
];
