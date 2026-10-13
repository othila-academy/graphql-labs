import { takeCalls } from '../data/repository.js';

// Un plugin Apollo : chaque réponse dit combien d'accès aux données la requête a coûté.
// Le compteur est global : deux requêtes simultanées mêleraient leurs comptes.
export const repositoryCallsPlugin = {
  async requestDidStart() {
    takeCalls();
    return {
      async willSendResponse({ response }) {
        if (response.body.kind === 'single')
          response.body.singleResult.extensions = {
            ...response.body.singleResult.extensions,
            repositoryCalls: takeCalls()
          };
      }
    };
  }
};
