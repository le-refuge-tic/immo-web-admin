import { describe, expect, it } from 'vitest';
import { nomFichierExport } from '../api/historiqueApi';
import {
  basculerTri,
  bornesPeriode,
  ecrireUrl,
  filtresEffectifs,
  jourBenin,
  libelle,
  LIBELLES_TYPE,
  lireUrl,
  nombrePages,
  ongletsPour,
  peutVoirHistorique,
  typesProposes,
  versParams,
  type EtatHistorique,
} from './historiqueTransactions';

const etat = (e: Partial<EtatHistorique> = {}): EtatHistorique => ({
  onglet: 'tous', periode: 'tout', filtres: {}, tri: { cle: 'date', ordre: 'desc' }, page: 1, ...e,
});

describe('périodes en heure du Bénin', () => {
  it('23 h 30 UTC le 31/10 est déjà le 1er novembre au Bénin (UTC+1)', () => {
    expect(jourBenin(new Date('2026-10-31T23:30:00Z'))).toBe('2026-11-01');
  });

  it('raccourcis : aujourd’hui, 7 jours, mois en cours, mois précédent', () => {
    const t = new Date('2026-11-17T10:00:00Z');
    expect(bornesPeriode('aujourdhui', t)).toEqual({ du: '2026-11-17', au: '2026-11-17' });
    expect(bornesPeriode('7j', t)).toEqual({ du: '2026-11-11', au: '2026-11-17' });
    expect(bornesPeriode('mois', t)).toEqual({ du: '2026-11-01', au: '2026-11-17' });
    expect(bornesPeriode('mois_precedent', t)).toEqual({ du: '2026-10-01', au: '2026-10-31' });
    expect(bornesPeriode('mois_precedent', new Date('2026-03-05T10:00:00Z'))).toEqual({ du: '2026-02-01', au: '2026-02-28' });
    expect(bornesPeriode('mois_precedent', new Date('2027-01-10T10:00:00Z'))).toEqual({ du: '2026-12-01', au: '2026-12-31' });
    expect(bornesPeriode('tout', t)).toEqual({});
  });
});

describe('onglets', () => {
  it('l’admin ne voit pas les onglets de paiements clients', () => {
    expect(ongletsPour(false).map(o => o.id)).toEqual(['tous', 'moi', 'admins', 'commerciaux', 'demarcheurs']);
    expect(ongletsPour(true).map(o => o.id)).toContain('loyers');
    expect(typesProposes(false)).not.toContain('loyer');
    expect(typesProposes(true)).toContain('frais_visite');
  });

  it('lien « Voir son historique » : clients réservés au super admin', () => {
    expect(peutVoirHistorique('commercial', false)).toBe(true);
    expect(peutVoirHistorique('demarcheur', false)).toBe(true);
    expect(peutVoirHistorique('proprietaire', false)).toBe(false);
    expect(peutVoirHistorique('super_admin', false)).toBe(false);
    expect(peutVoirHistorique('proprietaire', true)).toBe(true);
  });

  it('l’onglet prime sur la saisie ; la période remplace du/au sauf en personnalisé', () => {
    const t = new Date('2026-11-17T10:00:00Z');
    expect(filtresEffectifs(etat({ onglet: 'moi', filtres: { utilisateur_id: 9, sens: 'debit' } }), 4, t))
      .toEqual({ utilisateur_id: 4, sens: 'debit' });
    expect(filtresEffectifs(etat({ onglet: 'loyers', filtres: { types: ['retrait'] } }), 4, t)).toEqual({ types: ['loyer'] });
    expect(filtresEffectifs(etat({ periode: 'aujourdhui', filtres: { du: '2020-01-01' } }), 4, t))
      .toEqual({ du: '2026-11-17', au: '2026-11-17' });
    expect(filtresEffectifs(etat({ periode: 'perso', filtres: { du: '2026-01-01', types: [] } }), 4, t))
      .toEqual({ du: '2026-01-01' });
  });
});

describe('URL ↔ état', () => {
  it('aller-retour sans perte, valeurs par défaut absentes de l’URL', () => {
    const e = etat({
      onglet: 'commerciaux',
      periode: 'perso',
      filtres: { du: '2026-11-01', au: '2026-11-15', types: ['retrait', 'bonus_admin'], montant_min: 500, sens: 'credit' },
      tri: { cle: 'montant', ordre: 'asc' },
      page: 3,
    });
    const sp = ecrireUrl(e);
    expect(sp.get('types')).toBe('retrait,bonus_admin');
    expect(lireUrl(sp, false)).toEqual(e);
    expect(ecrireUrl(etat()).toString()).toBe('');
  });

  it('valeurs invalides ou hors périmètre ignorées', () => {
    const e = lireUrl(new URLSearchParams('onglet=loyers&tri=DROP&page=-2&du=hier&utilisateur_id=abc&types=loyer,%27x&sens=tout&montant_min=-5'), false);
    expect(e).toEqual(etat({ filtres: { types: ['loyer'] } })); // seul le jeton malformé est écarté
    expect(lireUrl(new URLSearchParams('onglet=loyers'), true).onglet).toBe('loyers');
  });

  it('du/au ignorés hors période personnalisée', () => {
    expect(ecrireUrl(etat({ periode: 'mois', filtres: { du: '2026-01-01' } })).toString()).toBe('periode=mois');
  });
});

describe('divers', () => {
  it('tri, pages, paramètres et libellés', () => {
    expect(basculerTri({ cle: 'date', ordre: 'desc' }, 'date')).toEqual({ cle: 'date', ordre: 'asc' });
    expect(basculerTri({ cle: 'date', ordre: 'asc' }, 'utilisateur')).toEqual({ cle: 'utilisateur', ordre: 'asc' });
    expect(basculerTri({ cle: 'date', ordre: 'asc' }, 'montant')).toEqual({ cle: 'montant', ordre: 'desc' });
    expect(nombrePages(0)).toBe(1);
    expect(nombrePages(41, 20)).toBe(3);
    expect(versParams({ roles: ['admin', 'super_admin'], bien_id: 3, statut: '' })).toEqual({ roles: 'admin,super_admin', bien_id: 3 });
    expect(libelle(LIBELLES_TYPE, 'portefeuille_validation')).toBe('Prime de validation');
    expect(libelle(LIBELLES_TYPE, 'commission_plateforme')).toBe('Commission plateforme');
    expect(libelle(LIBELLES_TYPE, null)).toBe('—');
    expect(nomFichierExport('attachment; filename="historique-transactions-2026-11-17-10-00.xlsx"', 'xlsx'))
      .toBe('historique-transactions-2026-11-17-10-00.xlsx');
    expect(nomFichierExport(undefined, 'csv')).toBe('historique-transactions.csv');
  });
});
