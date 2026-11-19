import { describe, expect, it } from 'vitest'
import { ajouterPage, CHOIX_PAR_DEFAUT, filtresPortefeuille, resteAPrendre, suiviEnTete } from './historiquePagine'

const m = (id: number) => ({ id })

describe('lot 16 : historique du portefeuille par pages', () => {
  it('ajoute une page sans doublon (un mouvement arrivé entre deux pages décale la suite)', () => {
    expect(ajouterPage([m(5), m(4)], [m(4), m(3)]).map(x => x.id)).toEqual([5, 4, 3])
  })
  it('reste à charger tant que le total n’est pas atteint', () => {
    expect(resteAPrendre(20, 45)).toBe(true)
    expect(resteAPrendre(45, 45)).toBe(false)
  })
})

describe('lot 17 : filtres de l’historique personnel', () => {
  const t = new Date('2026-11-17T10:00:00Z')
  it('par défaut : aucun paramètre (tout, plus récent d’abord)', () => {
    expect(filtresPortefeuille(CHOIX_PAR_DEFAUT, t)).toEqual({})
    expect(suiviEnTete(CHOIX_PAR_DEFAUT)).toBe(true)
  })
  it('période, sens et tri traduits pour le serveur', () => {
    expect(filtresPortefeuille({ periode: 'mois', sens: 'debit', tri: 'montant_desc' }, t)).toEqual({
      du: '2026-11-01', au: '2026-11-17', sens: 'debit', tri: 'montant', ordre: 'desc',
    })
    expect(filtresPortefeuille({ periode: 'tout', sens: 'credit', tri: 'ancien' }, t)).toEqual({ sens: 'credit', tri: 'date', ordre: 'asc' })
    expect(suiviEnTete({ ...CHOIX_PAR_DEFAUT, tri: 'montant_asc' })).toBe(false)
  })
})
