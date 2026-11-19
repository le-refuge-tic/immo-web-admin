import { describe, expect, it } from 'vitest'
import { valider } from '../shared/saisie/validation'
import {
  schemaBonus,
  schemaChangementMotDePasse,
  schemaCodeOtp,
  schemaConnexion,
  schemaFraisModeration,
  schemaFraisVisite,
  schemaLiaison,
  schemaMotifRefus,
  schemaNouveauCompte,
  schemaProfil,
  schemaProprietaire,
} from './schemas'

const champsEnErreur = (r: ReturnType<typeof valider>) => (r.ok ? [] : Object.keys(r.erreurs))

describe('schémas de l’administration (lot 15)', () => {
  it('propriétaire : téléphone béninois exact, e-mail facultatif', () => {
    expect(valider(schemaProprietaire, { prenom: 'Koffi', nom: 'Adjovi', telephone: '0197000000', email: '' })).toEqual({
      ok: true, data: { prenom: 'Koffi', nom: 'Adjovi', telephone: '+2290197000000', email: undefined },
    })
    expect(champsEnErreur(valider(schemaProprietaire, { prenom: 'K', nom: '', telephone: '97000000', email: 'x@' })))
      .toEqual(['prenom', 'nom', 'telephone', 'email'])
    expect(champsEnErreur(valider(schemaProprietaire, { prenom: 'Koffi', nom: 'Adjovi', telephone: '01970000000', email: '' })))
      .toEqual(['telephone'])
  })

  it('nouveau compte : DTO (2 à 100, e-mail, 8 caractères) et confirmation', () => {
    const ok = { nom: 'Dupont', prenom: 'Jean', email: 'Jean@Refuge.bj', password: 'motdepasse', confirm: 'motdepasse' }
    const r = valider(schemaNouveauCompte, ok)
    expect(r.ok && r.data.email).toBe('jean@refuge.bj')
    expect(champsEnErreur(valider(schemaNouveauCompte, { ...ok, password: 'court', confirm: 'court' }))).toEqual(['password'])
    expect(champsEnErreur(valider(schemaNouveauCompte, { ...ok, confirm: 'autre' }))).toEqual(['confirm'])
    expect(champsEnErreur(valider(schemaNouveauCompte, { ...ok, email: 'jean' }))).toEqual(['email'])
  })

  it('bonus : montant entier ≥ 1, motif de 3 à 255 caractères', () => {
    expect(valider(schemaBonus, { montant: '5000', motif: 'Très bon mois' })).toEqual({ ok: true, data: { montant: 5000, motif: 'Très bon mois' } })
    expect(champsEnErreur(valider(schemaBonus, { montant: '0', motif: 'ok' }))).toEqual(['montant', 'motif'])
    expect(champsEnErreur(valider(schemaBonus, { montant: 'abc', motif: 'Bravo' }))).toEqual(['montant'])
    expect(champsEnErreur(valider(schemaBonus, { montant: '-5', motif: 'Bravo' }))).toEqual(['montant'])
  })

  it('frais : visite 0 à 100 000, modération 0 à 999 999', () => {
    expect(valider(schemaFraisVisite, { montant: '0' }).ok).toBe(true)
    expect(valider(schemaFraisVisite, { montant: '100001' }).ok).toBe(false)
    expect(valider(schemaFraisVisite, { montant: '' }).ok).toBe(false)
    expect(valider(schemaFraisModeration, { frais: '2000' })).toEqual({ ok: true, data: { frais: 2000 } })
    expect(valider(schemaFraisModeration, { frais: '1000000' }).ok).toBe(false)
  })

  it('motif de refus : 5 à 500 caractères', () => {
    expect(valider(schemaMotifRefus, { motif: 'Flou' }).ok).toBe(false)
    expect(valider(schemaMotifRefus, { motif: 'Photos floues' }).ok).toBe(true)
    expect(valider(schemaMotifRefus, { motif: 'x'.repeat(501) }).ok).toBe(false)
  })

  it('liaison : date requise, échéance 1 à 28, prépayé 0 à 12', () => {
    const ok = { date_debut: '2026-12-01', jour_echeance: '10', loyer_prepaye_mois: '0', notes: '' }
    expect(valider(schemaLiaison, ok)).toEqual({ ok: true, data: { date_debut: '2026-12-01', jour_echeance: 10, loyer_prepaye_mois: 0, notes: undefined } })
    expect(champsEnErreur(valider(schemaLiaison, { ...ok, date_debut: '', jour_echeance: '29', loyer_prepaye_mois: '13' })))
      .toEqual(['date_debut', 'jour_echeance', 'loyer_prepaye_mois'])
  })

  it('connexion, code SMS et changement de mot de passe', () => {
    expect(champsEnErreur(valider(schemaConnexion, { email: 'admin', password: '' }))).toEqual(['email', 'password'])
    expect(valider(schemaConnexion, { email: 'a@b.bj', password: 'x' }).ok).toBe(true)
    expect(valider(schemaCodeOtp, { code: '12345' }).ok).toBe(false)
    expect(valider(schemaCodeOtp, { code: '123456' }).ok).toBe(true)
    expect(champsEnErreur(valider(schemaChangementMotDePasse, { actuel: '', nouveau: 'court', confirmation: 'court' }))).toEqual(['actuel', 'nouveau'])
    expect(champsEnErreur(valider(schemaChangementMotDePasse, { actuel: 'a', nouveau: 'longueur8', confirmation: 'autre' }))).toEqual(['confirmation'])
  })

  it('profil : nom réel (lettres, 2 au moins), comme le backend', () => {
    expect(valider(schemaProfil, { nom: 'Hounssou', prenom: 'Jean-Marc', email: '' }).ok).toBe(true)
    expect(valider(schemaProfil, { nom: "N'Dah", prenom: 'Aïcha', email: '' }).ok).toBe(true)
    expect(champsEnErreur(valider(schemaProfil, { nom: 'X1', prenom: '12', email: '' }))).toEqual(['nom', 'prenom'])
  })
})
