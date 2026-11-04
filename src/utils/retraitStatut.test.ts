import { describe, expect, it } from 'vitest';
import {
  actionsDisponibles,
  compterATraiter,
  correspondAuFiltre,
  estEnCours,
  motifErreur,
  totalAttenteFonds,
} from './retraitStatut';

describe('actionsDisponibles', () => {
  it('en cours : seulement la resynchronisation, pour tout administrateur', () => {
    for (const superAdmin of [true, false]) {
      expect(actionsDisponibles({ statut: 'en_cours', fedapay_payout_id: '77' }, superAdmin)).toEqual({
        resynchroniser: true,
        relancer: false,
        secours: false,
      });
    }
  });

  it('en attente de fonds : relance et secours, réservés au super administrateur', () => {
    const r = { statut: 'en_attente_fonds', fedapay_payout_id: null };
    expect(actionsDisponibles(r, true)).toEqual({ resynchroniser: false, relancer: true, secours: true });
    expect(actionsDisponibles(r, false)).toEqual({ resynchroniser: false, relancer: false, secours: false });
  });

  it('échoué : relançable seulement s’il a été remboursé, jamais de secours', () => {
    expect(actionsDisponibles({ statut: 'echoue', fedapay_payout_id: '9', rembourse_le: '2026-10-01T10:00:00Z' }, true).relancer).toBe(true);
    expect(actionsDisponibles({ statut: 'echoue', fedapay_payout_id: '9', rembourse_le: null }, true).relancer).toBe(false);
    expect(actionsDisponibles({ statut: 'echoue', fedapay_payout_id: '9', rembourse_le: '2026-10-01T10:00:00Z' }, true).secours).toBe(false);
  });

  it('envoyé, rejeté : aucune action (pas de second payout)', () => {
    for (const statut of ['envoye', 'rejete']) {
      expect(actionsDisponibles({ statut, fedapay_payout_id: '9', rembourse_le: '2026-10-01T10:00:00Z' }, true)).toEqual({
        resynchroniser: false,
        relancer: false,
        secours: false,
      });
    }
  });

  it('ancienne demande en attente sans payout : relançable (remplace l’ancien « Valider ») et traitable en secours', () => {
    expect(actionsDisponibles({ statut: 'en_attente', fedapay_payout_id: null }, true)).toEqual({
      resynchroniser: false,
      relancer: true,
      secours: true,
    });
  });

  it('en attente avec un payout déjà créé : ni relance ni secours (risque de double paiement)', () => {
    const a = actionsDisponibles({ statut: 'en_attente', fedapay_payout_id: '12' }, true);
    expect(a.relancer).toBe(false);
    expect(a.secours).toBe(false);
  });
});

describe('regroupements', () => {
  const liste = [
    { statut: 'en_attente_fonds', montant: 4000 },
    { statut: 'en_attente_fonds', montant: '2500' },
    { statut: 'en_attente', montant: 1000 },
    { statut: 'en_cours', montant: 500 },
    { statut: 'envoye', montant: 700 },
    { statut: 'echoue', montant: 800 },
  ];

  it('« À traiter » = attente de fonds + en attente', () => {
    expect(liste.filter(r => correspondAuFiltre(r.statut, 'a_traiter'))).toHaveLength(3);
    expect(compterATraiter(liste)).toBe(3);
  });

  it('un filtre simple ne garde que son statut, « Tous » garde tout', () => {
    expect(liste.filter(r => correspondAuFiltre(r.statut, 'en_cours'))).toHaveLength(1);
    expect(liste.filter(r => correspondAuFiltre(r.statut, 'tous'))).toHaveLength(6);
  });

  it('le total à couvrir ne compte que l’attente de fonds, montants en texte compris', () => {
    expect(totalAttenteFonds(liste)).toBe(6500);
  });

  it('estEnCours', () => {
    expect(estEnCours('en_cours')).toBe(true);
    expect(estEnCours('envoye')).toBe(false);
  });
});

describe('motifErreur', () => {
  it('motif d’échec en priorité, sinon motif de rejet, sinon rien', () => {
    expect(motifErreur({ motif_echec: 'Solde FedaPay insuffisant', motif_rejet: 'x' })).toBe('Solde FedaPay insuffisant');
    expect(motifErreur({ motif_echec: null, motif_rejet: 'Numéro incorrect' })).toBe('Numéro incorrect');
    expect(motifErreur({})).toBeNull();
  });
});
