# Cours GraphQL · Othila Academy

Un projet fil rouge, une plateforme d'évènements étudiants, construit **lab après lab** : chaque lab fait apprendre une notion de GraphQL en l'ajoutant à ton projet, sur ton propre code.

## Pour l'apprenant

Tout le parcours est dans [`docs/LABS.md`](docs/LABS.md) : cloner, `npm install`, `npx lab join`, `npx lab init`, le tutoriel de la commande (`npx lab start prise-en-main`), puis un lab après l'autre avec `npx lab start`, `check`, `hint` et `submit`. Les nouveaux labs arrivent par `npx lab update`.

## Organisation du dépôt

- `.othila-lab/` : la formation (`formation.json` : séances et ordre des labs) et les labs (`labs/<lab>/`) ; `local/`, ton état, n'est jamais commité.
- `packages/` : le projet fil rouge, `server-js` (le serveur GraphQL), et `client-react` (le client, à partir du lab client-apollo).
- `docs/`,  `scripts/` : supports du cours.

## La chaîne de labs

`main` est une chaîne d'états de référence : `base`, le starter, puis `solution/<lab>` pour chaque lab, dans l'ordre de `formation.json`. Le départ d'un lab est la solution du lab précédent. Pour écrire un lab : le [guide d'écriture des labs](https://github.com/othila-academy/lab-cli/blob/main/docs/ecrire-un-lab.md) du paquet `@othila-academy/lab`.

## Les anciennes séances

L'ancienne version du cours, avec ses branches de séance (`session-1` à `session-5-final`), reste consultable dans [othila-academy/graphql-course](https://github.com/othila-academy/graphql-course)