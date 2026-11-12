import { describe, expect, it } from 'vitest'
import { heuresDisponibles, montant, totauxGuesthouse, totauxSalle } from './calculsTarifs'

describe('montant', () => {
  it('entier saisi avec espaces, vide, invalide', () => {
    expect(montant('25 000')).toBe(25000)
    expect(montant(0)).toBe(0)
    expect(montant('')).toBeNull()
    expect(montant('12,5')).toBeNull()
    expect(montant(undefined)).toBeNull()
  })
})

describe('totaux d’une guesthouse', () => {
  it('séjour minimum, ménage, caution, total à l’arrivée', () => {
    expect(totauxGuesthouse({ prixNuitee: '25000', nuiteesMin: 2, caution: '10000', fraisMenage: '5000' })).toMatchObject({
      prixNuit: 25000, sejourMinimum: 50000, fraisMenage: 5000, caution: 10000, totalArrivee: 65000,
    })
  })

  it('caution vide et ménage vide : non précisés, comptés 0', () => {
    expect(totauxGuesthouse({ prixNuitee: 25000, nuiteesMin: 1, caution: '', fraisMenage: null })).toMatchObject({
      caution: null, fraisMenage: null, sejourMinimum: 25000, totalArrivee: 25000,
    })
  })

  it('nuitées minimum 1 (ou absentes) : une seule nuit', () => {
    expect(totauxGuesthouse({ prixNuitee: 18000, nuiteesMin: 1 })?.sejourMinimum).toBe(18000)
    expect(totauxGuesthouse({ prixNuitee: 18000, nuiteesMin: 0 })?.nuiteesMin).toBe(1)
  })

  it('tarifs semaine et mois : réduction implicite', () => {
    const t = totauxGuesthouse({ prixNuitee: 25000, nuiteesMin: 1, prixSemaine: '150000', prixMois: '525000' })!
    expect(t.semaine).toEqual({ prix: 150000, reference: 175000, reductionPct: 14 })
    expect(t.mois).toEqual({ prix: 525000, reference: 750000, reductionPct: 30 })
  })

  it('tarif semaine plus cher que 7 nuits : réduction négative (signalée, pas masquée)', () => {
    expect(totauxGuesthouse({ prixNuitee: 10000, nuiteesMin: 1, prixSemaine: 80000 })?.semaine?.reductionPct).toBe(-14)
  })

  it('sans prix par nuit : pas de totaux', () => {
    expect(totauxGuesthouse({ prixNuitee: '', nuiteesMin: 2 })).toBeNull()
    expect(totauxGuesthouse({ prixNuitee: '0', nuiteesMin: 2 })).toBeNull()
  })
})

describe('totaux d’une salle de fêtes', () => {
  it('prix pour 8 h, 4 h minimum : coût de la durée minimum et total', () => {
    expect(totauxSalle({ prix: '45000', dureeHeures: 8, heuresMin: 4, caution: '20000', fraisMenage: '10000' })).toMatchObject({
      prixHeure: 5625, coutDureeMinimum: 22500, totalMinimum: 52500,
    })
  })

  it('durée 1 h : prix à l’heure = prix affiché', () => {
    expect(totauxSalle({ prix: 7000, dureeHeures: 1, heuresMin: 3 })).toMatchObject({
      prixHeure: 7000, coutDureeMinimum: 21000, caution: null, totalMinimum: 21000,
    })
  })

  it('arrondi une seule fois (pas d’erreur cumulée)', () => {
    // 10 000 / 3 h × 2 h = 6 666,67 → 6 667 (et non 3 333 × 2 = 6 666)
    expect(totauxSalle({ prix: 10000, dureeHeures: 3, heuresMin: 2 })?.coutDureeMinimum).toBe(6667)
  })

  it('forfaits journée et week-end facultatifs', () => {
    expect(totauxSalle({ prix: 45000, dureeHeures: 8, heuresMin: 4, forfaitJournee: '120000', forfaitWeekend: '' })).toMatchObject({
      forfaitJournee: 120000, forfaitWeekend: null,
    })
  })

  it('sans prix : pas de totaux', () => {
    expect(totauxSalle({ prix: '', dureeHeures: 8, heuresMin: 4 })).toBeNull()
  })
})

describe('heures disponibles', () => {
  it('même jour, et fin de soirée après minuit (lendemain)', () => {
    expect(heuresDisponibles('08:00', '23:00')).toBe(15)
    expect(heuresDisponibles('18:00', '02:00')).toBe(8)
    expect(heuresDisponibles('20:30', '01:00')).toBe(4.5)
  })
  it('même heure : 24 h ; heure invalide : null', () => {
    expect(heuresDisponibles('10:00', '10:00')).toBe(24)
    expect(heuresDisponibles('25:00', '10:00')).toBeNull()
  })
})
