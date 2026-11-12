import { describe, expect, it } from 'vitest';
import { echeance } from './remboursementStatut';

const MAINTENANT = Date.parse('2026-11-12T08:00:00Z');
const dans = (heures: number) => new Date(MAINTENANT + heures * 3_600_000).toISOString();

describe('echeance', () => {
  it('compte les jours restants et signale les échéances proches', () => {
    expect(echeance({ statut: 'a_rembourser', echeance: dans(24 * 6 + 1) }, MAINTENANT))
      .toEqual({ texte: '6 jours restants', enRetard: false, proche: false });
    expect(echeance({ statut: 'a_rembourser', echeance: dans(24 * 2 + 1) }, MAINTENANT))
      .toEqual({ texte: '2 jours restants', enRetard: false, proche: true });
    expect(echeance({ statut: 'a_rembourser', echeance: dans(25) }, MAINTENANT))
      .toEqual({ texte: '1 jour restant', enRetard: false, proche: true });
    expect(echeance({ statut: 'a_rembourser', echeance: dans(5) }, MAINTENANT))
      .toEqual({ texte: "À verser aujourd'hui", enRetard: false, proche: true });
  });

  it('signale le retard, au moins un jour', () => {
    expect(echeance({ statut: 'a_rembourser', echeance: dans(-2) }, MAINTENANT))
      .toEqual({ texte: 'En retard de 1 jour', enRetard: true, proche: true });
    expect(echeance({ statut: 'a_rembourser', echeance: dans(-24 * 3 - 1) }, MAINTENANT))
      .toMatchObject({ texte: 'En retard de 3 jours', enRetard: true });
  });

  it("n'a plus d'échéance une fois traitée", () => {
    expect(echeance({ statut: 'rembourse', echeance: dans(-48) }, MAINTENANT)).toBeNull();
    expect(echeance({ statut: 'rejete', echeance: dans(48) }, MAINTENANT)).toBeNull();
  });
});
