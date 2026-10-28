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
