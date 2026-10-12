# Cours GraphQL · Othila Academy

Un projet fil rouge, une plateforme d'évènements étudiants, construit **lab après lab** : chaque lab fait apprendre une notion de GraphQL en l'ajoutant à ton projet, sur ton propre code.

## Pour l'apprenant

Tout le parcours est dans [`docs/LABS.md`](docs/LABS.md) : cloner, `npm install`, `npx lab join`, `npx lab init`, puis un lab après l'autre avec `npx lab start`, `check`, `hint` et `submit`. Les nouveaux labs arrivent par `npx lab update`.

## Organisation du dépôt

- `.othila-lab/` : la formation (`formation.json` : séances et ordre des labs) et les labs (`labs/<lab>/`) ; `local/`, ton état, n'est jamais commité.
- `packages/` : le projet fil rouge (serveur, client), à venir avec le starter.
- `docs/`, `slides.pdf`, `scripts/` : supports du cours.

## La chaîne de labs

`main` est une chaîne d'états de référence : `base`, le starter, puis `solution/<lab>` pour chaque lab, dans l'ordre de `formation.json`. Le départ d'un lab est la solution du lab précédent. Pour écrire un lab : le [guide d'écriture des labs](https://github.com/othila-academy/lab-cli/blob/main/docs/ecrire-un-lab.md) du paquet `@othila-academy/lab`.

## Les anciennes séances

Les branches de séance (`session-1` à `session-5-final`) et les premiers essais de labs sont archivés sous des tags `archive/*` : `git checkout archive/session-3` pour les consulter. Les tags de palier `s3-*` et `s4-*` sont conservés.
