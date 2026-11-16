import { describe, expect, it } from 'vitest'
import {
  CATEGORIES_BIENS, FILTRES_TYPE, SOUS_TYPES_BIENS, categoriesAvec, choixDepuisBien, correspondAuFiltre,
  coupleBackend, libelleBien, parametresFiltre, sousTypesDe,
} from './referentielTypes'

// Mêmes cas que le backend (src/biens/referentiel/referentiel-types-biens.spec.ts).
describe('référentiel des types de biens', () => {
  it('5 catégories, 12 sous-types, clés uniques, chaque catégorie remplie', () => {
    expect(CATEGORIES_BIENS).toHaveLength(5)
    expect(SOUS_TYPES_BIENS).toHaveLength(12)
    expect(new Set(SOUS_TYPES_BIENS.map(s => s.cle)).size).toBe(12)
    for (const c of CATEGORIES_BIENS) expect(sousTypesDe(c.cle).length).toBeGreaterThan(0)
  })

  it('photos minimum : 4 pour guesthouse et salle de fêtes, 2 sinon', () => {
    for (const st of SOUS_TYPES_BIENS) expect(st.photos_min).toBe(st.type === 'guesthouse' || st.type === 'salle_fete' ? 4 : 2)
  })

  it.each([
    ['entree_coucher', false, 'appart_vide', 'entree_coucher'],
    ['chambre_salon', false, 'appart_vide', 'chambre_salon'],
    ['appartement', false, 'appart_vide', 'appartement'],
    ['appartement', true, 'appart_meuble', 'appart_meuble'],
    ['villa', false, 'maison', 'villa'],
    ['villa', true, 'maison', 'villa'],
    ['duplex', true, 'maison', 'duplex'],
    ['maison', false, 'maison', 'maison_individuelle'],
    ['terrain', false, 'terrain', 'terrain'],
    ['boutique', false, 'maison', 'boutique'],
    ['bureau', false, 'maison', 'bureau'],
    ['local_commercial', false, 'maison', 'local_commercial'],
    ['guesthouse', false, 'guesthouse', 'guesthouse'],
    ['salle_fete', false, 'salle_fete', 'salle_fete'],
  ])('%s (meublé : %s) → %s / %s', (cle, meuble, type, sous_type) => {
    expect(coupleBackend({ cle: cle as string, meuble: meuble as boolean })).toEqual({ type, sous_type })
  })

  it('aller-retour : un couple créé est relu comme le même choix', () => {
    for (const st of SOUS_TYPES_BIENS) {
      for (const meuble of st.meuble ? [false, true] : [false]) {
        const c = coupleBackend({ cle: st.cle, meuble })!
        const amenites = meuble && c.type === 'maison' ? { etat_meuble: 'meuble' } : {}
        expect(choixDepuisBien(c.type, c.sous_type, amenites)).toEqual({ cle: st.cle, meuble })
      }
    }
  })

  it.each([
    ['appart_meuble', null, { cle: 'appartement', meuble: true }],
    ['appart_vide', null, { cle: 'appartement', meuble: false }],
    ['appart_vide', 'boutique', { cle: 'boutique', meuble: false }],
    ['maison', null, { cle: 'maison', meuble: false }],
    ['maison', 'villa_maison', { cle: 'villa', meuble: false }],
    ['maison', 'showroom', { cle: 'local_commercial', meuble: false }],
    ['maison', 'chateau', null],
  ])('ancienne valeur %s / %s', (type, sousType, attendu) => {
    expect(choixDepuisBien(type as string, sousType as string | null)).toEqual(attendu)
  })

  it('formulaire de bien classique : sans guesthouse ni salle (catégories masquées)', () => {
    const cats = categoriesAvec(['classique']).map(c => c.cle)
    expect(cats).toEqual(['residentiel', 'terrain', 'commercial'])
    expect(sousTypesDe('residentiel', ['classique']).map(s => s.cle))
      .toEqual(['entree_coucher', 'chambre_salon', 'appartement', 'villa', 'duplex', 'maison'])
  })

  it('libellés lisibles', () => {
    expect(libelleBien('appart_meuble', 'appart_meuble')).toBe('Appartement meublé')
    expect(libelleBien('maison', 'villa', { etat_meuble: 'meuble' })).toBe('Villa meublée')
    expect(libelleBien('maison', 'boutique')).toBe('Boutique')
    expect(libelleBien('inconnu', null)).toBe('inconnu')
  })
})

describe('filtres de type (accueil, recherche)', () => {
  const bien = (type: string, sous_type?: string, extra: Record<string, unknown> = {}) => ({ type, amenites: { sous_type, ...extra } })

  it('« Appartement » couvre appart_vide et appart_meuble, pas la chambre-salon', () => {
    expect(correspondAuFiltre('appartement', bien('appart_vide', 'appartement'))).toBe(true)
    expect(correspondAuFiltre('appartement', bien('appart_meuble', 'appart_meuble'))).toBe(true)
    expect(correspondAuFiltre('appartement', bien('appart_meuble'))).toBe(true)
    expect(correspondAuFiltre('appartement', bien('appart_vide', 'chambre_salon'))).toBe(false)
  })

  it('« Maison / Villa » exclut les locaux commerciaux ; « Commerce » les regroupe', () => {
    expect(correspondAuFiltre('maison', bien('maison', 'villa'))).toBe(true)
    expect(correspondAuFiltre('maison', bien('maison'))).toBe(true)
    expect(correspondAuFiltre('maison', bien('maison', 'boutique'))).toBe(false)
    expect(correspondAuFiltre('commerce', bien('maison', 'boutique'))).toBe(true)
    expect(correspondAuFiltre('commerce', bien('maison', 'local_commercial'))).toBe(true)
    expect(correspondAuFiltre('commerce', bien('maison', 'villa'))).toBe(false)
  })

  it('« Tous » ou filtre inconnu : tout passe', () => {
    expect(correspondAuFiltre('', bien('terrain'))).toBe(true)
    expect(correspondAuFiltre('nimporte', bien('terrain'))).toBe(true)
  })

  it('paramètres serveur en listes', () => {
    expect(parametresFiltre('appartement')).toEqual({ type: 'appart_vide,appart_meuble', sous_type: 'appartement,appart_meuble' })
    expect(parametresFiltre('commerce')).toEqual({ sous_type: 'boutique,bureau,local_commercial,showroom' })
    expect(parametresFiltre('')).toEqual({})
  })

  it('chaque filtre a une clé unique, « Tous » en premier', () => {
    expect(FILTRES_TYPE[0].cle).toBe('')
    expect(new Set(FILTRES_TYPE.map(f => f.cle)).size).toBe(FILTRES_TYPE.length)
  })
})
