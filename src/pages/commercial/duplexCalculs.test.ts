import { describe, expect, it } from 'vitest'
import { prixPrincipalDuplex } from './duplexCalculs'

const parsePrix = (valeur: string) => {
  const nombre = Number(valeur.replace(/\s/g, '').replace(',', '.'))
  return Number.isFinite(nombre) && nombre > 0 ? nombre : undefined
}

describe('Calculs du prix principal du duplex meublé', () => {
  it('privilégie le long séjour mensuel', () => {
    expect(prixPrincipalDuplex({
      prix_long_sejour: '350 000',
      prix_sejour_restreint: '45 000',
      prix_heure: '5 000',
    }, parsePrix)).toBe(350000)
  })

  it('utilise le court séjour si le tarif mensuel est absent', () => {
    expect(prixPrincipalDuplex({
      prix_sejour_restreint: '45000',
      prix_heure: '5000',
    }, parsePrix)).toBe(45000)
  })

  it('retourne zéro sans tarif valide', () => {
    expect(prixPrincipalDuplex({ prix_long_sejour: '' }, parsePrix)).toBe(0)
  })
})
