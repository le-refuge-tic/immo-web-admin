import { describe, expect, it } from 'vitest'
import { getPriceFieldLabel, shouldShowLocationSpecificFields } from './bienFormRules'

describe('bienFormRules', () => {
  it('utilise le bon libellé selon la transaction', () => {
    expect(getPriceFieldLabel('location')).toBe('Loyer mensuel (FCFA)')
    expect(getPriceFieldLabel('vente')).toBe('Prix de vente (FCFA)')
  })

  it('n’affiche les champs de location que pour une transaction de location', () => {
    expect(shouldShowLocationSpecificFields('location')).toBe(true)
    expect(shouldShowLocationSpecificFields('vente')).toBe(false)
  })
})
