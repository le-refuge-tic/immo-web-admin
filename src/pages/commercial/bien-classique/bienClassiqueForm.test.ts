import { describe, expect, it } from 'vitest'
import {
  TYPES_BIEN, MIN_PHOTOS,
  derives, prixPrincipal, montantIntegration, commissionAgence, manquesEtape,
  construireAmenites, construirePieces, construirePayload,
  libellesEtapes,
  type BienClassiqueForm,
} from './bienClassiqueForm'
import { choixDepuisBien } from '../../../shared/biens/referentielTypes'

const formulaire = (o: Partial<BienClassiqueForm> = {}): BienClassiqueForm => ({
  typeBien: 'chambre_salon', typeTransaction: 'location', prix: '50000', prixPromo: '',
  estMeuble: false, etatMeubleMaison: 'non_meuble', etatConstructionMaison: null,
  standing: null, standingAutre: '',
  prixLongSejour: '', prixSejourRestreint: '', prixHeure: '', tarifsAutres: [],
  ville: 'Cotonou', quartier: 'Akpakpa', arrondissement: '1er', indicationAdresse: '',
  latitude: null, longitude: null,
  chambres: 1, salons: 1, cuisines: 1, douches: 1,
  typeCuisine: 'separee_douche', cuisineAutre: '', chambreACouloir: false,
  typeCour: 'commune', nbVoisins: 0, accesVehicule: null, nbVehicules: 1,
  avanceMois: 0, echeanceMois: 5, loyerPrepayeMois: 0,
  cautionEau: '', cautionElec: '', electricite: 'non', electriciteAutre: '',
  eau: 'non', eauAutre: '', forageGestion: null, prixForage: '',
  equipementsBonus: [], equipementsAutre: '', alentours: [], alentoursAutre: '',
  disponibilite: 'immediate', disponibleA: '',
  titreTerrain: '', superficieTerrain: '', superficieUnite: 'm2', documentTerrain: [], documentAutreDetail: '',
  positionTerrain: 'bord_goudron', angleRue: false, permissionConstruire: false, descriptionConstruction: '',
  estLoti: null, detailsSupplementaires: [],
  typeVoie: 'goudron', visibiliteBoutique: 'directe', parkingClients: 'aucun',
  description: '', autresFrais: [],
  ...o,
})

const meuble = (typeBien: string, o: Partial<BienClassiqueForm> = {}) =>
  formulaire({ typeBien, estMeuble: true, etatMeubleMaison: 'meuble', prix: '', ...o })

describe('derives — couple type / sous-type envoyé à l’API, pour chaque type', () => {
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
  ])('%s (meublé : %s) → %s / %s', (typeBien, estMeuble, type, sousType) => {
    const d = derives({ typeBien, estMeuble, etatMeubleMaison: estMeuble ? 'meuble' : 'non_meuble' })
    expect([d.typeBackend, d.sousType]).toEqual([type, sousType])
  })

  it('chaque type proposé à la création a un couple valide', () => {
    for (const { key } of TYPES_BIEN) {
      const d = derives({ typeBien: key, estMeuble: false, etatMeubleMaison: 'non_meuble' })
      expect(['maison', 'appart_vide', 'appart_meuble', 'terrain']).toContain(d.typeBackend)
      expect(d.sousType).toBeTruthy()
    }
  })

  it('seuls appartement, villa, duplex et maison peuvent être meublés', () => {
    const meublables = TYPES_BIEN.map(t => t.key)
      .filter(k => derives({ typeBien: k, estMeuble: true, etatMeubleMaison: 'meuble' }).isMeuble)
    expect(meublables).toEqual(['appartement', 'villa', 'duplex', 'maison'])
  })

  it('maison : meublé selon l’état du meuble, semi-meublée comprise', () => {
    expect(derives({ typeBien: 'maison', estMeuble: false, etatMeubleMaison: 'semi_meuble' }).isMeuble).toBe(true)
    expect(derives({ typeBien: 'maison', estMeuble: true, etatMeubleMaison: 'non_meuble' }).isMeuble).toBe(false)
  })

  it('boutique et bureau : local professionnel, sans pièces', () => {
    for (const typeBien of ['boutique', 'bureau']) {
      const d = derives({ typeBien, estMeuble: false, etatMeubleMaison: 'non_meuble' })
      expect(d.isLocalPro).toBe(true)
      expect(d.showPieces).toBe(false)
    }
  })

  it('libellé de l’étape 3 selon le type', () => {
    expect(libellesEtapes('terrain')[2]).toBe('Terrain')
    expect(libellesEtapes('boutique')[2]).toBe('Boutique')
    expect(libellesEtapes('bureau')[2]).toBe('Bureau')
    expect(libellesEtapes('villa')[2]).toBe('Confort')
  })
})

describe('prixPrincipal — prix envoyé à l’API', () => {
  it('non meublé : le champ Prix', () => {
    expect(prixPrincipal(formulaire({ typeBien: 'villa', prix: '300 000' }))).toBe(300000)
  })

  it.each(['appartement', 'villa', 'duplex', 'maison'])('%s meublé : le tarif mensuel passe avant la nuit', typeBien => {
    const f = meuble(typeBien, { prixSejourRestreint: '25000', prixLongSejour: '400000' })
    expect(prixPrincipal(f)).toBe(400000)
  })

  it('meublé sans tarif mensuel : la nuit', () => {
    expect(prixPrincipal(meuble('villa', { prixSejourRestreint: '25000', prixHeure: '5000' }))).toBe(25000)
  })

  it('meublé avec seulement un tarif mensuel', () => {
    expect(prixPrincipal(meuble('villa', { prixLongSejour: '400000' }))).toBe(400000)
  })

  it('meublé avec seulement un tarif personnalisé', () => {
    expect(prixPrincipal(meuble('appartement', { tarifsAutres: [{ label: 'Semaine', prix: '120000' }] }))).toBe(120000)
  })

  it('meublé : le champ Prix est ignoré (il n’est pas affiché)', () => {
    expect(prixPrincipal(meuble('villa', { prix: '999', prixHeure: '5000' }))).toBe(5000)
  })
})

describe('commission et montant à l’intégration', () => {
  it('location : commission de 50 % du loyer', () => {
    expect(commissionAgence(formulaire({ prix: '100000' }))).toBe(50000)
  })

  it('vente et terrain : pas de commission d’agence', () => {
    expect(commissionAgence(formulaire({ typeBien: 'villa', typeTransaction: 'vente', prix: '20000000' }))).toBe(0)
    expect(commissionAgence(formulaire({ typeBien: 'terrain', prix: '100000' }))).toBe(0)
  })

  it('avance, loyers prépayés, cautions, autres frais et commission', () => {
    const f = formulaire({
      prix: '100000', avanceMois: 3, loyerPrepayeMois: 1,
      cautionEau: '10000', cautionElec: '15000', autresFrais: [{ label: 'Peinture', prix: '5000' }],
    })
    expect(montantIntegration(f)).toBe(100000 * 4 + 10000 + 15000 + 5000 + 50000)
  })

  it('villa meublée : calculé sur le tarif meublé (ne vaut plus 0)', () => {
    const f = meuble('villa', { prixLongSejour: '400000', avanceMois: 2 })
    expect(montantIntegration(f)).toBe(400000 * 2 + 200000)
  })
})

describe('manquesEtape', () => {
  it('étape 0 : prix obligatoire pour un bien non meublé', () => {
    expect(manquesEtape(0, formulaire({ prix: '' }), 0)).toEqual(['Veuillez entrer le prix'])
  })

  it('étape 0 : meublé sans aucun tarif refusé, avec un tarif accepté', () => {
    expect(manquesEtape(0, meuble('villa'), 0)).toHaveLength(1)
    expect(manquesEtape(0, meuble('villa', { prixHeure: '5000' }), 0)).toEqual([])
  })

  it('étape 0 : prix promo d’un terrain à vendre inférieur au prix', () => {
    const f = formulaire({ typeBien: 'terrain', typeTransaction: 'vente', prix: '5000000', prixPromo: '6000000' })
    expect(manquesEtape(0, f, 0)).toEqual(['Le prix promo doit être inférieur au prix de vente'])
    expect(manquesEtape(0, { ...f, prixPromo: '4500000' }, 0)).toEqual([])
  })

  it('étape 1 : quartier obligatoire', () => {
    expect(manquesEtape(1, formulaire({ quartier: ' ' }), 0)).toEqual(['Veuillez sélectionner un quartier'])
  })

  it('étape 2 : nom et superficie d’un terrain facultatifs ; rien n’est exigé', () => {
    expect(manquesEtape(2, formulaire({ typeBien: 'terrain' }), 0)).toEqual([])
    expect(manquesEtape(2, formulaire({ typeBien: 'bureau' }), 0)).toEqual([])
  })

  it(`étape 4 : au moins ${MIN_PHOTOS} photos`, () => {
    expect(manquesEtape(4, formulaire(), MIN_PHOTOS - 1)).toHaveLength(1)
    expect(manquesEtape(4, formulaire(), MIN_PHOTOS)).toEqual([])
  })
})

describe('construirePieces', () => {
  it('entrée-coucher : une chambre et une entrée', () => {
    expect(construirePieces(formulaire({ typeBien: 'entree_coucher' })).map(p => p.nom)).toEqual(['Chambre', 'Entrée'])
  })

  it('chambre-salon : chambres et salons seulement', () => {
    const noms = construirePieces(formulaire({ typeBien: 'chambre_salon', chambres: 2, salons: 1 })).map(p => p.nom)
    expect(noms).toEqual(['Chambre', 'Chambre', 'Salon'])
  })

  it('villa : chambres, salons, cuisines et salles de bain', () => {
    const p = construirePieces(formulaire({ typeBien: 'villa', chambres: 3, salons: 1, cuisines: 1, douches: 2 }))
    expect(p).toHaveLength(7)
  })

  it.each(['terrain', 'boutique', 'bureau'])('%s : aucune pièce', typeBien => {
    expect(construirePieces(formulaire({ typeBien }))).toEqual([])
  })
})

describe('construireAmenites', () => {
  it('logement : chambres envoyées (classement 2 pièces / 3 pièces et plus)', () => {
    expect(construireAmenites(formulaire({ typeBien: 'appartement', chambres: 3 })).chambres).toBe(3)
  })

  it('meublé : tarifs_meuble envoyés (reconnaissance du meublé côté backend)', () => {
    const a = construireAmenites(meuble('villa', { prixLongSejour: '400000', prixHeure: '5000' }))
    expect(a.tarifs_meuble).toEqual({ prix_long_sejour: 400000, prix_heure: 5000 })
  })

  it('local professionnel : voie, visibilité, parking ; ni cuisine ni cour', () => {
    const a = construireAmenites(formulaire({ typeBien: 'bureau' }))
    expect(a).toMatchObject({ sous_type: 'bureau', type_voie: 'goudron', visibilite: 'directe', parking_clients: 'aucun' })
    expect(a.type_cuisine).toBeUndefined()
    expect(a.chambres).toBeUndefined()
  })

  it('vente : pas de conditions de location (avance, échéance, commission)', () => {
    const a = construireAmenites(formulaire({ typeBien: 'villa', typeTransaction: 'vente' }))
    expect(a.avance_mois).toBeUndefined()
    expect(a.commission_agence).toBeUndefined()
  })

  it('terrain : documents, position et détails ; titre foncier déduit des documents', () => {
    const a = construireAmenites(formulaire({
      typeBien: 'terrain', documentTerrain: ['titre_foncier', 'autre'], documentAutreDetail: 'ADC',
      detailsSupplementaires: [{ label: 'Clôture', valeur: 'Oui' }, { label: '', valeur: 'x' }],
    }))
    expect(a).toMatchObject({ document: 'titre_foncier', titre_foncier: true, document_autre_detail: 'ADC' })
    expect(a.details_supplementaires).toEqual([{ label: 'Clôture', valeur: 'Oui' }])
  })

  it('maison : état du meuble et de construction', () => {
    const a = construireAmenites(formulaire({ typeBien: 'maison', etatConstructionMaison: 'totalement_construite' }))
    expect(a).toMatchObject({ etat_meuble: 'non_meuble', etat_construction: 'totalement_construite' })
  })
})

describe('construirePayload', () => {
  it('prix, frais de visite, localisation par défaut et pièces', () => {
    const b = construirePayload(formulaire({ typeBien: 'chambre_salon', chambres: 1, salons: 1 }))
    expect(b).toMatchObject({ type: 'appart_vide', transaction: 'location', prix: 50000, frais_visite: 500 })
    expect(b.localisation).toMatchObject({ quartier: 'Akpakpa', latitude: 6.3654, longitude: 2.4183 })
    expect(b.pieces).toHaveLength(2)
    expect(b.details_appart).toEqual({ entree_personnelle: false })
  })

  it('villa meublée : prix = tarif meublé, plus jamais 0', () => {
    expect(construirePayload(meuble('villa', { prixLongSejour: '400000' })).prix).toBe(400000)
  })

  it('terrain à vendre : superficie en m², prix promo et titre en tête de description', () => {
    const b = construirePayload(formulaire({
      typeBien: 'terrain', typeTransaction: 'vente', prix: '5000000', prixPromo: '4500000',
      titreTerrain: 'Parcelle Calavi', superficieTerrain: '0,05', superficieUnite: 'ha', description: 'Belle vue',
    }))
    expect(b).toMatchObject({ type: 'terrain', prix_promo: 4500000, details_terrain: { superficie: 500, cloture: false } })
    expect(b.description).toBe('Parcelle Calavi\n\nBelle vue')
    expect(b.pieces).toBeUndefined()
  })

  it('terrain sans nom ni superficie : titre « Terrain à <quartier> », pas de détails terrain', () => {
    const b = construirePayload(formulaire({ typeBien: 'terrain', titreTerrain: ' ', superficieTerrain: '', description: 'Plat' }))
    expect(b.description).toBe('Terrain à Akpakpa\n\nPlat')
    expect(b.details_terrain).toBeUndefined()
  })

  it('en finition : la date de disponibilité est envoyée', () => {
    expect(construirePayload(formulaire({ disponibilite: 'en_finition', disponibleA: '2026-12-01' })).disponible_a).toBe('2026-12-01')
    expect(construirePayload(formulaire({ disponibleA: '2026-12-01' })).disponible_a).toBeUndefined()
  })

  it('bureau : type maison, sous-type bureau, sans pièces ni détails d’appartement', () => {
    const b = construirePayload(formulaire({ typeBien: 'bureau' }))
    expect(b.type).toBe('maison')
    expect((b.amenites as Record<string, unknown>).sous_type).toBe('bureau')
    expect(b.pieces).toBeUndefined()
    expect(b.details_appart).toBeUndefined()
  })
})

describe('lot 2 — création et modification lisent le même référentiel', () => {
  it.each(TYPES_BIEN.map(t => [t.key]))('%s : le couple créé est relu comme le même choix', cle => {
    for (const meuble of [false, true]) {
      const d = derives({ typeBien: cle, estMeuble: meuble, etatMeubleMaison: meuble ? 'meuble' : 'non_meuble' })
      const amenites = d.isMeuble && d.typeBackend === 'maison' ? { etat_meuble: 'meuble' } : {}
      expect(choixDepuisBien(d.typeBackend, d.sousType, amenites)).toEqual({ cle, meuble: d.isMeuble })
    }
  })

  it('local commercial : parcours boutique, type maison', () => {
    const d = derives({ typeBien: 'local_commercial', estMeuble: false, etatMeubleMaison: 'non_meuble' })
    expect(d).toMatchObject({ isLocalPro: true, typeBackend: 'maison', sousType: 'local_commercial', peutEtreMeuble: false })
  })

  it('guesthouse et salle de fêtes ne sont pas des types du formulaire classique', () => {
    expect(TYPES_BIEN.map(t => t.key)).not.toContain('guesthouse')
    expect(TYPES_BIEN.map(t => t.key)).not.toContain('salle_fete')
  })
})
