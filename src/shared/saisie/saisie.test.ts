import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { curseurApresFormatage, formaterMilliers, lireNombre, nettoyerNombre, saisieNombre } from './nombres'
import { estTelephoneBenin, saisieTelephone, telephoneCanonique } from './telephone'
import { aujourdhui, zDate, zEmail, zMontant, zNombreFacultatif, zTelephone, zTelephoneFacultatif, zTexte } from './schemas'
import { erreursServeur, valider } from './validation'

describe('nombres', () => {
  it('ne garde que les chiffres, à la frappe comme au collage', () => {
    expect(nettoyerNombre('1e5')).toBe('15')
    expect(nettoyerNombre('-20')).toBe('20')
    expect(nettoyerNombre('+3')).toBe('3')
    expect(nettoyerNombre('150 000 FCFA')).toBe('150000')
    expect(nettoyerNombre('abc')).toBe('')
    expect(nettoyerNombre('12,5', { decimales: true })).toBe('12.5')
    expect(nettoyerNombre('1.2.3', { decimales: true })).toBe('1.23')
  })

  it('refuse la saisie au-delà du maximum et retire les zéros de tête', () => {
    expect(saisieNombre('0050')).toBe('50')
    expect(saisieNombre('0')).toBe('0')
    expect(saisieNombre('1001', { max: 1000 })).toBeNull()
    expect(saisieNombre('', { max: 1000 })).toBe('')
  })

  it('formate les milliers et relit la valeur', () => {
    expect(formaterMilliers('150000')).toBe('150 000')
    expect(formaterMilliers(1234567)).toBe('1 234 567')
    expect(formaterMilliers('12.5')).toBe('12,5')
    expect(formaterMilliers('')).toBe('')
    expect(lireNombre('150 000')).toBe(150000)
    expect(lireNombre('12,5')).toBe(12.5)
    expect(lireNombre('')).toBeNull()
  })

  it('garde le curseur derrière le même chiffre après reformatage', () => {
    // « 15000|0 » devient « 150 00|0 » : 5 chiffres à gauche.
    expect(curseurApresFormatage('150000', 5, '150 000')).toBe(6)
    expect(curseurApresFormatage('1500', 0, '1 500')).toBe(0)
    expect(curseurApresFormatage('1 5000', 6, '15 000')).toBe(6)
  })
})

describe('téléphone béninois', () => {
  it('10 chiffres nationaux ; indicatif collé retiré ; lettres refusées', () => {
    expect(saisieTelephone('+229 01 97 00 00 00')).toBe('0197000000')
    expect(saisieTelephone('0022901970000 00')).toBe('0197000000')
    expect(saisieTelephone('22901970000')).toBe('01970000') // indicatif retiré, numéro incomplet
    expect(saisieTelephone('01abc97')).toBe('0197')
    expect(saisieTelephone('019700000099')).toBe('0197000000')
  })

  it('valide 01 + 8 chiffres seulement', () => {
    expect(estTelephoneBenin('0197000000')).toBe(true)
    expect(estTelephoneBenin('+2290197000000')).toBe(true)
    expect(estTelephoneBenin('97000000')).toBe(false) // ancien format à 8 chiffres
    expect(estTelephoneBenin('019700000')).toBe(false) // 9 chiffres
    expect(estTelephoneBenin('0297000000')).toBe(false)
    expect(estTelephoneBenin('')).toBe(false)
    expect(telephoneCanonique('01 97 00 00 00')).toBe('+2290197000000')
  })
})

describe('briques zod', () => {
  it('montant : texte, négatif, vide, borne', () => {
    const s = zMontant({ max: 1_000_000 })
    expect(s.parse('150000')).toBe(150000)
    expect(s.parse(2500)).toBe(2500)
    expect(s.safeParse('').success).toBe(false)
    expect(s.safeParse('abc').success).toBe(false)
    expect(s.safeParse('-5').success).toBe(false)
    expect(s.safeParse('0').success).toBe(false)
    expect(s.safeParse('2000000').success).toBe(false)
    expect(s.safeParse('12.5').success).toBe(false)
  })

  it('nombre facultatif : vide → undefined, sinon validé', () => {
    const s = zNombreFacultatif({ min: 1 })
    expect(s.parse('')).toBeUndefined()
    expect(s.parse('3')).toBe(3)
    expect(s.safeParse('0').success).toBe(false)
  })

  it('téléphone : 8 ou 11 chiffres refusés, forme canonique renvoyée', () => {
    expect(zTelephone().parse('0197000000')).toBe('+2290197000000')
    expect(zTelephone().safeParse('97000000').success).toBe(false)
    expect(zTelephone().safeParse('01970000000').success).toBe(false)
    expect(zTelephone().safeParse('').success).toBe(false)
    expect(zTelephoneFacultatif().parse('')).toBeUndefined()
    expect(zTelephoneFacultatif().safeParse('123').success).toBe(false)
  })

  it('e-mail et texte borné', () => {
    expect(zEmail().parse(' Awa@Refuge.BJ ')).toBe('awa@refuge.bj')
    expect(zEmail().safeParse('awa@').success).toBe(false)
    expect(zTexte(5).safeParse('   ').success).toBe(false)
    expect(zTexte(5).safeParse('123456').success).toBe(false)
    expect(zTexte(100, 2).safeParse('A').success).toBe(false)
  })

  it('date : passée refusée seulement si demandé', () => {
    const t = new Date('2026-11-17T10:00:00')
    expect(aujourdhui(t)).toBe('2026-11-17')
    expect(zDate({ futur: true, maintenant: t }).safeParse('2026-11-16').success).toBe(false)
    expect(zDate({ futur: true, maintenant: t }).safeParse('2026-11-17').success).toBe(true)
    expect(zDate().safeParse('2020-01-01').success).toBe(true)
    expect(zDate().safeParse('17/11/2026').success).toBe(false)
  })
})

describe('validation et erreurs du serveur', () => {
  const schema = z.object({ montant: zMontant(), telephone: zTelephone() })

  it('une erreur par champ, dans l’ordre du schéma', () => {
    const r = valider(schema, { montant: 'x', telephone: '12' })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(Object.keys(r.erreurs)).toEqual(['montant', 'telephone'])
    expect(valider(schema, { montant: '500', telephone: '0197000000' })).toEqual({
      ok: true, data: { montant: 500, telephone: '+2290197000000' },
    })
  })

  it('messages du backend rattachés au champ, le reste global', () => {
    const err = { response: { data: { message: ['telephone must be a valid phone number', 'Solde insuffisant pour ce retrait', 'Erreur inconnue'] } } }
    expect(erreursServeur(err, { telephone: /numéro|téléphone/i, montant: /solde|montant/i })).toEqual({
      parChamp: { telephone: 'telephone must be a valid phone number', montant: 'Solde insuffisant pour ce retrait' },
      global: ['Erreur inconnue'],
    })
    expect(erreursServeur(new Error('réseau'), { montant: /x/ })).toEqual({ parChamp: {}, global: [] })
  })
})
