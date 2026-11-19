import { describe, expect, it } from 'vitest'
import { ajouterPage, resteAPrendre } from './historiquePagine'

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
