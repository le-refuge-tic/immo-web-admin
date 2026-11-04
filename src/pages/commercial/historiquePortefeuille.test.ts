import { describe, it, expect } from 'vitest'
import { expliquerMouvement } from './historiquePortefeuille'
import type { WalletTransaction } from '../../api/getWallet'

const tx = (o: Partial<WalletTransaction>): WalletTransaction => ({
  id: 1, wallet_id: 1, type: 'depot', amount: 0, balance_before: 0, balance_after: 0,
  reference: null, description: '', status: 'ok', metadata: null, initiated_by: null,
  created_at: '2026-11-04T10:00:00Z', ...o,
})

describe('expliquerMouvement', () => {
  it('prime détaillée : catégorie, meublé, majoration du 11e, rang', () => {
    const e = expliquerMouvement(tx({
      amount: 3500,
      metadata: {
        type: 'portefeuille_validation', bien_id: 7, categorie: 'villa_maison',
        categorie_libelle: 'Villa / maison à louer', prime_bien: 2000, bonus_meuble: 500,
        bonus_11e_bien: 1000, rang_categorie: 12, rang_semaine: 15, plafond_exceptionnel: false,
      },
    }))
    expect(e.titre).toBe('Prime de validation — bien #7')
    expect(e.details).toEqual([
      'Villa / maison à louer : prime 2 000 FCFA',
      'Logement meublé : +500 FCFA',
      '12e bien de cette catégorie cette semaine (dès le 11e : +50 %) : +1 000 FCFA',
      '15e bien validé de la semaine',
    ])
    expect(e.montant).toBe(3500)
  })

  it('palier de 20 biens : explique le complément jusqu’à 50 000', () => {
    const e = expliquerMouvement(tx({
      amount: 20000,
      metadata: {
        type: 'portefeuille_validation', bien_id: 9, categorie: 'boutique',
        categorie_libelle: 'Boutique / magasin', prime_bien: 1000, bonus_meuble: 0,
        bonus_11e_bien: 500, rang_categorie: 20, rang_semaine: 20, plafond_exceptionnel: true,
      },
    }))
    expect(e.details.at(-1)).toContain('palier de 20 biens atteint, semaine portée à 50 000 FCFA (crédit 20 000 FCFA)')
  })

  it('ancien crédit sans détail : le signale', () => {
    const e = expliquerMouvement(tx({
      amount: 5000, description: 'Gain validation bien #13 (guesthouse, 3e bien cette semaine)',
      metadata: { type: 'portefeuille_validation', bien_id: 13, rang_semaine: 3 },
    }))
    expect(e.details).toEqual(['3e bien validé de la semaine', 'Calculée avec l’ancienne grille (avant le 4 novembre 2026)'])
  })

  it('bonus du staff, retrait et remboursement', () => {
    expect(expliquerMouvement(tx({ amount: 5000, metadata: { type: 'bonus_admin', motif: 'Meilleur agent' } })))
      .toMatchObject({ genre: 'bonus', titre: 'Bonus accordé par l’équipe Refuge', details: ['Motif : Meilleur agent'] })
    expect(expliquerMouvement(tx({ type: 'retrait', amount: 5000 }))).toMatchObject({ genre: 'retrait', montant: -5000 })
    expect(expliquerMouvement(tx({ amount: 5000, description: 'Retrait rejeté : numéro invalide' })))
      .toMatchObject({ genre: 'remboursement', titre: 'Retrait annulé — montant rendu' })
  })

  it('prime de résultat en binôme : commission, 10 % et part', () => {
    const e = expliquerMouvement(tx({
      amount: 22500,
      metadata: {
        type: 'prime_resultat', bien_id: 5, nature: 'vente', commission: 450000, montant_prime: 45000,
        date_conclusion: '2026-11-04', pot_equipe: true, part: 22500, auteur: false,
      },
    }))
    expect(e.titre).toBe('Prime de résultat — bien #5')
    expect(e.details).toEqual([
      'Bien vendu le 04/11/2026',
      'Commission encaissée par Refuge : 450 000 FCFA',
      '10 % de la commission : 45 000 FCFA',
      'Binôme (bien publié par votre binôme) : pot de 45 000 FCFA partagé 50/50, votre part 22 500 FCFA',
    ])
  })

  it('régularisation : dû, déjà reçu, complément', () => {
    const e = expliquerMouvement(tx({
      amount: 1000,
      metadata: { type: 'regularisation', bien_id: 16, categorie_libelle: 'Appartement 3 pièces et plus / haut standing', montant_du: 2500, montant_credite: 1500 },
    }))
    expect(e).toMatchObject({ genre: 'regularisation', titre: 'Régularisation — bien #16' })
    expect(e.details.at(-1)).toBe('Complément versé : 1 000 FCFA')
  })
})
