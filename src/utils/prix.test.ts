import { describe, expect, it } from 'vitest'
import { libellePrix, prixAvecUnite, suffixeUnite } from './prix'

/** toLocaleString('fr-FR') sépare les milliers par une espace fine insécable (U+202F). */
const ESPACE_FINE = String.fromCharCode(0x202f)
const n = (s: string) => s.split(ESPACE_FINE).join(' ')

describe('prix avec unité', () => {
  it('utilise unite_prix renvoyé par l’API', () => {
    expect(n(prixAvecUnite({ prix: '25000.00', unite_prix: 'nuit' }))).toBe('25 000 FCFA / nuit')
    expect(n(prixAvecUnite({ prix: 35000, unite_prix: 'mois' }))).toBe('35 000 FCFA / mois')
    expect(n(prixAvecUnite({ prix: 9000000, unite_prix: 'total' }))).toBe('9 000 000 FCFA')
  })
  it('repli si l’API ne renvoie pas unite_prix : déduit du type et de la transaction', () => {
    expect(suffixeUnite({ type: 'guesthouse', transaction: 'location' })).toBe(' / nuit')
    expect(suffixeUnite({ type: 'appart_vide', transaction: 'location' })).toBe(' / mois')
    expect(suffixeUnite({ type: 'terrain', transaction: 'vente' })).toBe('')
  })
})

describe('libellePrix', () => {
  it('nuit / mois / vente', () => {
    expect(libellePrix({ unite_prix: 'nuit' })).toBe('Prix par nuit')
    expect(libellePrix({ type: 'appart_vide', transaction: 'location' })).toBe('Loyer mensuel')
    expect(libellePrix({ type: 'terrain', transaction: 'vente' })).toBe('Prix de vente')
  })
})

describe('salle de fêtes : prix à l’heure', () => {
  const salle = (duree?: number) => ({
    prix: 45000,
    unite_prix: 'heure',
    type: 'salle_fete',
    details_salle_fete: duree === undefined ? undefined : { duree_heures: duree },
  })

  it('le prix couvre plusieurs heures : « 45 000 FCFA / 8 h »', () => {
    expect(n(prixAvecUnite(salle(8)))).toBe('45 000 FCFA / 8 h')
  })

  it('une seule heure, ou durée inconnue : « / heure »', () => {
    expect(n(prixAvecUnite(salle(1)))).toBe('45 000 FCFA / heure')
    expect(n(prixAvecUnite(salle()))).toBe('45 000 FCFA / heure')
    expect(n(prixAvecUnite({ prix: 45000, unite_prix: 'heure', details_salle_fete: null }))).toBe('45 000 FCFA / heure')
  })

  it('ne s’affiche jamais comme un loyer ni comme un prix de vente', () => {
    expect(suffixeUnite(salle(8))).not.toContain('mois')
    expect(libellePrix(salle(8))).not.toBe('Prix de vente')
    expect(libellePrix(salle(8))).not.toBe('Loyer mensuel')
  })

  it('libellé : « Prix pour 8 h », « Prix à l’heure » pour une heure', () => {
    expect(libellePrix(salle(8))).toBe('Prix pour 8 h')
    expect(libellePrix(salle(1))).toBe('Prix à l’heure')
  })

  it('repli si l’API ne renvoie pas unite_prix : déduit du type', () => {
    expect(suffixeUnite({ type: 'salle_fete', transaction: 'location', details_salle_fete: { duree_heures: 6 } })).toBe(' / 6 h')
  })
})
