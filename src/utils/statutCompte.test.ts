import { describe, it, expect } from 'vitest';
import { badgeStatutCompte, dateCourte } from './statutCompte';

describe('badgeStatutCompte', () => {
  it('compte actif', () => {
    expect(badgeStatutCompte({ statut_compte: 'actif' })).toEqual({ libelle: 'Actif', ton: 'vert' });
  });

  it('suppression programmée avec la date prévue au format JJ/MM/AAAA', () => {
    const b = badgeStatutCompte({
      statut_compte: 'suppression_programmee',
      suppression_effective_le: '2026-12-03T12:00:00.000Z',
    });
    expect(b).toEqual({ libelle: 'Suppression le 03/12/2026', ton: 'orange' });
  });

  it('suppression programmée sans date', () => {
    expect(badgeStatutCompte({ statut_compte: 'suppression_programmee', suppression_effective_le: null }))
      .toEqual({ libelle: 'Suppression programmée', ton: 'orange' });
  });

  it('compte supprimé', () => {
    expect(badgeStatutCompte({ statut_compte: 'supprime' })).toEqual({ libelle: 'Supprimé', ton: 'rouge' });
  });

  it('champ absent ou inconnu : aucun badge', () => {
    expect(badgeStatutCompte({})).toBeNull();
    expect(badgeStatutCompte(null)).toBeNull();
    expect(badgeStatutCompte({ statut_compte: 'autre' })).toBeNull();
  });
});

describe('dateCourte', () => {
  it('date invalide ou vide', () => {
    expect(dateCourte(null)).toBeNull();
    expect(dateCourte('pas une date')).toBeNull();
  });
});
