import { describe, expect, it } from 'vitest'
import { erreurPrixCash, estTerrainEnVente, libelleReductionCash, prixCashDuBien, reductionCash } from './prixCash'

describe('prix cash (lot 11)', () => {
  it('ne concerne que les terrains en vente', () => {
    expect(estTerrainEnVente({ type: 'terrain', transaction: 'vente' })).toBe(true)
    expect(estTerrainEnVente({ type: 'terrain', transaction: 'location' })).toBe(false)
    expect(estTerrainEnVente({ type: 'maison', transaction: 'vente' })).toBe(false)
  })

  it('accepte l’absence de prix cash et un prix inférieur au prix normal', () => {
    expect(erreurPrixCash(5_000_000, null)).toBeNull()
    expect(erreurPrixCash(5_000_000, undefined)).toBeNull()
    expect(erreurPrixCash(5_000_000, 4_400_000)).toBeNull()
  })

  it('refuse un prix cash égal ou supérieur au prix normal, ou sous 100 FCFA', () => {
    expect(erreurPrixCash(5_000_000, 5_000_000)).toMatch(/inférieur/)
    expect(erreurPrixCash(5_000_000, 6_000_000)).toMatch(/inférieur/)
    expect(erreurPrixCash(5_000_000, 99)).toMatch(/au moins 100/)
  })

  it('calcule la remise en pourcentage et en francs', () => {
    expect(reductionCash(2_500_000, 2_200_000)).toEqual({ montant: 300_000, pourcentage: 12 })
  })

  it('ne propose pas de remise pour un prix cash invalide ou absent', () => {
    expect(reductionCash(5_000_000, 5_000_000)).toBeNull()
    expect(reductionCash(5_000_000, null)).toBeNull()
    expect(reductionCash(null, 100)).toBeNull()
    expect(reductionCash(0, 100)).toBeNull()
  })

  it('formate la remise avec le signe moins typographique', () => {
    expect(libelleReductionCash(2_500_000, 2_200_000)).toBe(`soit −12 % / −${(300_000).toLocaleString('fr-FR')} F`)
    expect(libelleReductionCash(2_500_000, 2_600_000)).toBe('')
  })

  it('lit le prix cash d’un bien renvoyé par l’API (nombres en chaîne compris)', () => {
    const terrain = { type: 'terrain', transaction: 'vente', prix: '5000000.00', prix_cash: '4400000.00' }
    expect(prixCashDuBien(terrain)).toBe(4_400_000)
    expect(prixCashDuBien({ ...terrain, prix_cash: null })).toBeNull()
    expect(prixCashDuBien({ ...terrain, type: 'maison' })).toBeNull()
    expect(prixCashDuBien({ ...terrain, prix_cash: '5000000.00' })).toBeNull()
  })
})
