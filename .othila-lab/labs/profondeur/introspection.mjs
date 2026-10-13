import {
  DEPTH_7,
  DEPTH_7_TYPENAME,
  INTROSPECTION_8,
  expectAnswered,
  expectRefused
} from './requetes.mjs';

export const title = 'Ne pas casser les outils';
export const instructions = `La requête d'introspection de la Sandbox descend profond (ofType { ofType { … } }). Vérifie qu'elle
passe toujours : les champs qui commencent par __ ne comptent pas.`;

export const prediction = {
  promptId: 'profondeur-sandbox',
  question: 'Que devient la Sandbox si l’introspection est refusée ?',
  choices: ['rien', 'elle ne voit plus le schéma'],
  expected: 'elle ne voit plus le schéma'
};

export const checks = [
  {
    id: 'introspection-ok',
    label:
      'une introspection de 8 niveaux (__schema … ofType { ofType { ofType { name } } }) répond',
    passesOnStart: true,
    run: async ({ gql }) => {
      await expectAnswered(
        gql,
        INTROSPECTION_8,
        'L’introspection est refusée : les champs __ comptent-ils dans ta profondeur ?'
      );
    }
  },
  {
    id: 'limite-garde',
    label: 'une requête de 7 niveaux reste refusée, même avec __typename à chaque niveau',
    run: async ({ gql }) => {
      await expectRefused(gql, DEPTH_7, 'La requête de 7 niveaux passe : regarde l’étape limiter.');
      await expectRefused(
        gql,
        DEPTH_7_TYPENAME,
        'La requête de 7 niveaux passe maintenant : en excluant les champs __, as-tu exclu autre chose ?'
      );
    }
  }
];

export const hints = [
  'Qu’est-ce qui distingue un champ d’introspection d’un champ du schéma ?',
  'Leur nom commence par __.',
  "if (sel.name.value.startsWith('__')) return 0"
];
