import { assert } from '@othila-academy/lab';
import { nullField, schemaError } from '../../shared/errors.mjs';

export const title = 'Un organisateur disparu';
export const instructions = `Un évènement importé d'une ancienne plateforme référence un organisateur qui n'existe plus.
Ajoute-le à src/data/events.js :
  { id: '4', title: 'Soirée des anciens', date: '2026-12-12', organizerId: 'u9' }
Relance le serveur, puis demande dans la Sandbox { events { title organizer { name } } }.
Lis toute la réponse : data, errors, et le path de l'erreur. Ne corrige rien pour l'instant.`;

export const prediction = {
  promptId: 'nullabilite-null-remonte',
  question:
    'Que répond { events { title organizer { name } } } quand un seul évènement n’a plus d’organisateur ?',
  choices: [
    'les quatre évènements, organizer null pour le dernier',
    'les trois évènements valides',
    'une erreur et data: null'
  ],
  expected: 'une erreur et data: null'
};

export const checks = [
  {
    id: 'evenement-4',
    label: 'event(id: "4") renvoie l’évènement importé (sans demander l’organisateur)',
    run: async ({ gql }) => {
      const result = await gql('{ event(id: "4") { id title } }');
      const error = result.errors?.[0]?.message;
      if (error)
        throw new Error(
          schemaError(error) ??
            `event(id: "4") répond « ${error} » : qui a tort, la requête ou le serveur ?`
        );
      assert(
        result.data.event,
        'event(id: "4") renvoie null : as-tu ajouté l’évènement 4 aux données, et relancé le serveur ?'
      );
    }
  },
  {
    id: 'organisateur-absent',
    label: 'l’organisateur de l’évènement 4 n’existe pas',
    run: async ({ gql }) => {
      const result = await gql('{ event(id: "4") { organizer { id } } }');
      const error = result.errors?.[0]?.message;
      // Tant que organizer est User!, l'organisateur introuvable devient cette erreur ; nullable, il vaut null.
      if (error) {
        assert(!schemaError(error), schemaError(error));
        assert(
          nullField(error, 'Event') === 'organizer',
          `event(id: "4") répond « ${error} » : qui a tort, la requête ou le serveur ?`
        );
        return;
      }
      const { event } = result.data;
      assert(event, 'Pas d’évènement 4 : regarde le premier check de l’étape.');
      assert(
        event.organizer === null,
        `L'organisateur de l'évènement 4 existe (${event.organizer?.id}) : la consigne demande un organisateur disparu (u9).`
      );
    }
  }
];

export const hints = [
  'Regarde le path de l’erreur : quel champ, de quel évènement ?',
  'organizer est déclaré User! : que fait GraphQL d’un null dans un champ qui promet de ne jamais l’être ?',
  'Le null remonte : Event! ne peut pas être null, alors la liste [Event!]! non plus, alors events non plus, et data devient null.'
];
