import { describe, expect, it } from 'vitest'
import { primeValidationCommerciale } from './commissionCommerciale'
import cas from './cas-grille-primes.json'

/**
 * Lot 16 — parité de la grille des primes avec le backend : les cas de référence sont générés
 * par immo-backend (src/users/__fixtures__/generer-cas-grille.ts) et copiés ici à l'identique
 * (`npm run check:grille` vérifie la copie quand les deux dépôts sont côte à côte).
 */
describe('grille des primes : parité avec le backend', () => {
  it(`${cas.length} cas de référence : même prime qu’au backend`, () => {
    const ecarts = cas
      .map(c => ({ ...c, front: primeValidationCommerciale(c.type, c.sous_type, c.transaction, c.prix, c.amenites) }))
      .filter(c => c.front !== c.prime)
    expect(ecarts.slice(0, 10)).toEqual([])
  })
})
