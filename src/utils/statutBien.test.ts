import { describe, it, expect } from 'vitest';
import { estBienMasque, libelleStatutBien, messageBienMasque, INFO_BULLE_BIEN_MASQUE } from './statutBien';

describe('estBienMasque', () => {
  it('reconnaît les deux statuts masqués', () => {
    expect(estBienMasque({ statut: 'masque_suppression_en_cours' })).toBe(true);
    expect(estBienMasque({ statut: 'masque_proprietaire_supprime' })).toBe(true);
  });
  it('un bien actif, sans statut ou absent n’est pas masqué', () => {
    expect(estBienMasque({ statut: 'actif' })).toBe(false);
    expect(estBienMasque({})).toBe(false);
    expect(estBienMasque(null)).toBe(false);
  });
});

describe('libelleStatutBien', () => {
  it('libellés des statuts masqués', () => {
    expect(libelleStatutBien('masque_suppression_en_cours')).toBe('Masqué – suppression du propriétaire en cours');
    expect(libelleStatutBien('masque_proprietaire_supprime')).toBe('Masqué – propriétaire supprimé');
  });
  it('statut inconnu ou vide', () => {
    expect(libelleStatutBien('autre')).toBe('autre');
    expect(libelleStatutBien(null)).toBe('—');
  });
});

describe('messageBienMasque', () => {
  const erreur = (status: number, data: unknown) => ({ response: { status, data } });

  it('renvoie le message du serveur pour un 403 BIEN_MASQUE', () => {
    expect(messageBienMasque(erreur(403, { code: 'BIEN_MASQUE', message: 'Ce bien est masqué.' }))).toBe('Ce bien est masqué.');
  });
  it('message de repli si le serveur n’en donne pas', () => {
    expect(messageBienMasque(erreur(403, { code: 'BIEN_MASQUE' }))).toBe(INFO_BULLE_BIEN_MASQUE);
  });
  it('ignore les autres erreurs', () => {
    expect(messageBienMasque(erreur(403, { message: 'Accès refusé' }))).toBeNull();
    expect(messageBienMasque(erreur(400, { code: 'BIEN_MASQUE' }))).toBeNull();
    expect(messageBienMasque(new Error('x'))).toBeNull();
    expect(messageBienMasque(null)).toBeNull();
  });
});
