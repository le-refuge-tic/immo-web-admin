import { describe, expect, it } from 'vitest';
import { ACTION_LABELS, libelleStatutRetrait, virementManuelComplet } from './retraitStatut';

describe('libelleStatutRetrait', () => {
  it('statuts en cours regroupés sous « En cours d’envoi »', () => {
    expect(libelleStatutRetrait('en_attente')).toBe('En cours d\'envoi');
    expect(libelleStatutRetrait('approuve')).toBe('En cours d\'envoi');
    expect(libelleStatutRetrait('en_cours')).toBe('En cours d\'envoi');
  });

  it('autres statuts', () => {
    expect(libelleStatutRetrait('envoye')).toBe('Envoyé');
    expect(libelleStatutRetrait('echoue')).toBe('Échec');
    expect(libelleStatutRetrait('rejete')).toBe('Rejeté');
    expect(libelleStatutRetrait('en_attente_fonds')).toBe('En attente de fonds FedaPay');
  });

  it('statut inconnu ou vide', () => {
    expect(libelleStatutRetrait('autre')).toBe('autre');
    expect(libelleStatutRetrait(null)).toBe('—');
  });

  it('libellés des actions du journal', () => {
    expect(ACTION_LABELS.marquer_envoye).toBe('Marqué envoyé');
    expect(ACTION_LABELS.rejeter).toBe('Rejeté');
  });
});

describe('virementManuelComplet', () => {
  const complet = { reference: 'MP241124.1532', moyen: 'Mobile Money manuel', commentaire: 'FedaPay en panne' };

  it('les trois champs remplis', () => {
    expect(virementManuelComplet(complet)).toBe(true);
  });

  it('un champ vide ou fait d’espaces suffit à bloquer', () => {
    expect(virementManuelComplet({ ...complet, reference: '' })).toBe(false);
    expect(virementManuelComplet({ ...complet, moyen: '   ' })).toBe(false);
    expect(virementManuelComplet({ ...complet, commentaire: '' })).toBe(false);
  });
});
