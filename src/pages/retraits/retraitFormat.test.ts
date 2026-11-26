import { describe, expect, it } from 'vitest'
import { fmtTelephone, initiales, libelleOperateur } from './retraitFormat'

describe('fmtTelephone', () => {
  it('groupe un numéro local par paires', () => {
    expect(fmtTelephone('0166000001')).toBe('01 66 00 00 01')
  })

  it("sépare l'indicatif du Bénin", () => {
    expect(fmtTelephone('+2290100000102')).toBe('+229 01 00 00 01 02')
  })

  it('ignore les espaces déjà présents', () => {
    expect(fmtTelephone('01 66 00 00 01')).toBe('01 66 00 00 01')
  })

  it('laisse tel quel un format inconnu, tiret si vide', () => {
    expect(fmtTelephone('+33 6 12')).toBe('+33 6 12')
    expect(fmtTelephone(null)).toBe('—')
  })
})

describe('libellés', () => {
  it("initiales à partir du nom, point d'interrogation sinon", () => {
    expect(initiales('Jude KOSSOU')).toBe('JK')
    expect(initiales('')).toBe('?')
  })

  it('opérateur', () => {
    expect(libelleOperateur('mtn')).toBe('MTN')
    expect(libelleOperateur('moov')).toBe('Moov')
    expect(libelleOperateur(null)).toBe('—')
  })
})
