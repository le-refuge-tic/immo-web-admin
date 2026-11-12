/**
 * Biens classiques (logements, locaux professionnels, terrains) : règles du
 * formulaire, sans React — sur le modèle de guesthouseForm / salleFeteForm.
 *
 * Seule source de vérité pour la création (PublierBienPage) et la
 * modification (AnnonceEditPage) : correspondance type / sous-type, meublé,
 * prix principal, montant à l'intégration, champs manquants par étape et
 * corps envoyé à l'API.
 */
import { prixPrincipalDuplex } from '../duplexCalculs'
import { SOUS_TYPES_BIENS, coupleBackend } from '../../../shared/biens/referentielTypes'

export type Transaction = 'location' | 'vente'
export type TarifCustom = { label: string; prix: string }
export type DetailCustom = { label: string; valeur: string }
export type EtatMeubleMaison = 'non_meuble' | 'semi_meuble' | 'meuble'

/** Photos par bien : plafond commun à tous les types (contrôlé aussi par l'API). */
export const MAX_PHOTOS = 8
/** Minimum exigé pour publier (l'approbation est refusée en dessous). */
export const MIN_PHOTOS = 2
export const FRAIS_VISITE = 500
/** Commission de l'agence sur une location : 50 % du loyer mensuel. */
export const TAUX_COMMISSION_AGENCE = 0.5
/** Position par défaut (Cotonou) quand l'adresse n'a pas été géolocalisée. */
const POSITION_PAR_DEFAUT = { latitude: 6.3654, longitude: 2.4183 }

// Lot 2 : types et sous-types viennent du référentiel unique (src/shared/biens).
const CLASSIQUES = SOUS_TYPES_BIENS.filter(s => s.formulaire === 'classique')

/** Sous-types du formulaire de bien classique (clé et libellé). */
export const TYPES_BIEN = CLASSIQUES.map(s => ({ key: s.cle, label: s.libelle }))

export type TypeBienCle = string

const MEUBLABLES: readonly string[] = CLASSIQUES.filter(s => s.meuble).map(s => s.cle)
const AVEC_PIECES: readonly string[] = ['appartement', 'villa', 'duplex', 'maison', 'chambre_salon']
/** Locaux professionnels (boutique, bureau, local commercial) : parcours boutique. */
export const LOCAUX_PRO: readonly string[] = CLASSIQUES.filter(s => s.categorie === 'commercial').map(s => s.cle)

export const parsePrix = (t: string | undefined | null): number | undefined => {
  const c = (t ?? '').trim().replace(/\s/g, '').replace(',', '')
  if (!c) return undefined
  const n = Number(c)
  return Number.isFinite(n) ? n : undefined
}

/** Champs du formulaire nécessaires aux règles (sous-ensemble du brouillon). */
export interface BienClassiqueForm {
  typeBien: string
  typeTransaction: Transaction
  prix: string
  prixPromo: string
  estMeuble: boolean
  etatMeubleMaison: EtatMeubleMaison
  etatConstructionMaison: 'semi_construite' | 'totalement_construite' | null
  standing: string | null
  standingAutre: string
  prixLongSejour: string
  prixSejourRestreint: string
  prixHeure: string
  tarifsAutres: TarifCustom[]
  ville: string
  quartier: string
  arrondissement: string
  indicationAdresse: string
  latitude: number | null
  longitude: number | null
  chambres: number
  salons: number
  cuisines: number
  douches: number
  typeCuisine: string
  cuisineAutre: string
  chambreACouloir: boolean
  typeCour: string
  nbVoisins: number
  accesVehicule: boolean | null
  nbVehicules: number
  avanceMois: number
  echeanceMois: number
  loyerPrepayeMois: number
  cautionEau: string
  cautionElec: string
  electricite: string
  electriciteAutre: string
  eau: string
  eauAutre: string
  forageGestion: string | null
  prixForage: string
  equipementsBonus: string[]
  equipementsAutre: string
  alentours: string[]
  alentoursAutre: string
  disponibilite: 'immediate' | 'en_finition'
  disponibleA: string
  titreTerrain: string
  superficieTerrain: string
  superficieUnite: 'm2' | 'ha'
  documentTerrain: string[]
  documentAutreDetail: string
  positionTerrain: string
  angleRue: boolean
  permissionConstruire: boolean
  descriptionConstruction: string
  estLoti: 'lotie' | 'non_lotie' | 'autre' | null
  detailsSupplementaires: DetailCustom[]
  typeVoie: string
  visibiliteBoutique: string
  parkingClients: string
  description: string
  autresFrais: TarifCustom[]
}

export type Derives = ReturnType<typeof derives>

/** Ce que le type choisi implique : parcours, meublé, couple type / sous-type en base. */
export function derives(f: Pick<BienClassiqueForm, 'typeBien' | 'estMeuble' | 'etatMeubleMaison'>) {
  const t = f.typeBien
  const isTerrain = t === 'terrain'
  const isBoutique = t === 'boutique'
  const isLocalPro = LOCAUX_PRO.includes(t)
  const peutEtreMeuble = MEUBLABLES.includes(t)
  const isMeuble = peutEtreMeuble && (t === 'maison' ? f.etatMeubleMaison !== 'non_meuble' : f.estMeuble)
  const couple = coupleBackend({ cle: t, meuble: isMeuble })
  const typeBackend = couple?.type ?? 'appart_vide'
  const sousType = couple?.sous_type ?? t
  return {
    isTerrain,
    isBoutique,
    isLocalPro,
    isSmallUnit: t === 'entree_coucher' || t === 'chambre_salon',
    peutEtreMeuble,
    isMeuble,
    showPieces: AVEC_PIECES.includes(t),
    typeBackend,
    sousType,
  }
}

export const libelleEtapeDetails = (typeBien: string): string =>
  typeBien === 'terrain' ? 'Terrain'
    : typeBien === 'boutique' ? 'Boutique'
    : typeBien === 'bureau' ? 'Bureau'
    : 'Confort'

export const libellesEtapes = (typeBien: string): string[] =>
  ['Type & Prix', 'Localisation', libelleEtapeDetails(typeBien), 'Honoraires', 'Photos']

export function superficieM2(f: Pick<BienClassiqueForm, 'superficieTerrain' | 'superficieUnite'>): number | undefined {
  const n = parseFloat(f.superficieTerrain.replace(',', '.'))
  if (isNaN(n)) return undefined
  return Math.round(f.superficieUnite === 'ha' ? n * 10000 : n)
}

const tarifsDe = (f: BienClassiqueForm) => ({
  prix_long_sejour: f.prixLongSejour,
  prix_sejour_restreint: f.prixSejourRestreint,
  prix_heure: f.prixHeure,
  autres: f.tarifsAutres,
})

/** Vrai si au moins un tarif meublé (nuit, mois, heure ou personnalisé) est renseigné. */
export const aUnTarifMeuble = (f: BienClassiqueForm): boolean =>
  prixPrincipalDuplex(tarifsDe(f), parsePrix) > 0

/**
 * Prix principal du bien (champ `prix` de l'API) : pour un meublé, le premier
 * tarif renseigné parmi nuit, mois, heure puis personnalisé ; sinon le champ Prix.
 */
export function prixPrincipal(f: BienClassiqueForm): number {
  return derives(f).isMeuble
    ? prixPrincipalDuplex(tarifsDe(f), parsePrix)
    : (parsePrix(f.prix) ?? 0)
}

export function commissionAgence(f: BienClassiqueForm): number {
  const d = derives(f)
  return !d.isTerrain && f.typeTransaction === 'location' ? prixPrincipal(f) * TAUX_COMMISSION_AGENCE : 0
}

/** Montant minimum à verser avant l'intégration (location) : avance, loyers prépayés, cautions, frais, commission. */
export function montantIntegration(f: BienClassiqueForm): number {
  const loyer = prixPrincipal(f)
  const autres = f.autresFrais.reduce((a, x) => a + (parsePrix(x.prix) ?? 0), 0)
  return loyer * (f.avanceMois + f.loyerPrepayeMois)
    + (parsePrix(f.cautionEau) ?? 0) + (parsePrix(f.cautionElec) ?? 0)
    + autres + commissionAgence(f)
}

/** Messages bloquants de l'étape (vide = étape complète). */
export function manquesEtape(etape: number, f: BienClassiqueForm, nbPhotos: number): string[] {
  const d = derives(f)
  const manques: string[] = []
  if (etape === 0) {
    if (d.isMeuble) {
      if (!aUnTarifMeuble(f)) manques.push('Renseignez au moins un tarif (nuit, mois ou heure)')
    } else {
      const principal = parsePrix(f.prix)
      if (!principal) manques.push('Veuillez entrer le prix')
      const cash = parsePrix(f.prixPromo)
      if (d.isTerrain && f.typeTransaction === 'vente' && principal && cash !== undefined && cash >= principal) {
        manques.push('Le prix promo doit être inférieur au prix de vente')
      }
    }
  }
  if (etape === 1 && !f.quartier.trim()) manques.push('Veuillez sélectionner un quartier')
  if (etape === 4 && nbPhotos < MIN_PHOTOS) {
    manques.push(`Ajoutez au moins ${MIN_PHOTOS} photos (${nbPhotos} pour l’instant)`)
  }
  return manques
}

function construireTarifsMeuble(f: BienClassiqueForm) {
  const t: Record<string, unknown> = {}
  const lus: [string, string][] = [
    ['prix_long_sejour', f.prixLongSejour],
    ['prix_sejour_restreint', f.prixSejourRestreint],
    ['prix_heure', f.prixHeure],
  ]
  for (const [cle, valeur] of lus) {
    const p = parsePrix(valeur)
    if (p !== undefined) t[cle] = p
  }
  const autres = f.tarifsAutres.filter(x => parsePrix(x.prix) !== undefined)
  if (autres.length) t.autres = autres.map(x => ({ label: x.label.trim() || 'Autre', prix: parsePrix(x.prix) }))
  return t
}

const avecAutre = (liste: string[], autre: string) =>
  [...liste, ...(autre.trim() ? [autre.trim()] : [])]

function amenitesTerrain(f: BienClassiqueForm, a: Record<string, unknown>) {
  if (f.documentTerrain.length) {
    a.document = f.documentTerrain[0]
    a.documents = f.documentTerrain
  }
  if (f.documentTerrain.includes('autre') && f.documentAutreDetail.trim()) a.document_autre_detail = f.documentAutreDetail.trim()
  a.position = f.positionTerrain
  a.angle_rue = f.angleRue
  a.permission_construire = f.permissionConstruire
  if (f.permissionConstruire && f.descriptionConstruction.trim()) a.description_construction = f.descriptionConstruction.trim()
  if (f.estLoti !== null) a.loti = f.estLoti
  a.titre_foncier = f.documentTerrain.includes('titre_foncier')
  const details = f.detailsSupplementaires.filter(x => x.label.trim() && x.valeur.trim())
  if (details.length) a.details_supplementaires = details.map(x => ({ label: x.label.trim(), valeur: x.valeur.trim() }))
  return a
}

function amenitesLogement(f: BienClassiqueForm, d: Derives, a: Record<string, unknown>) {
  if (f.typeTransaction === 'location') {
    a.type_cuisine = f.typeCuisine
    if (f.typeCuisine === 'autre' && f.cuisineAutre.trim()) a.cuisine_autre_detail = f.cuisineAutre.trim()
    a.type_cour = f.typeCour
    if (f.typeCour === 'commune') a.nb_voisins = f.nbVoisins
    if (f.typeCour === 'commune' && f.accesVehicule !== null) a.acces_vehicule = f.accesVehicule
    if (f.typeCour === 'commune' && f.accesVehicule === true) a.nb_vehicules = f.nbVehicules
    if (f.typeBien === 'chambre_salon') a.chambre_couloir = f.chambreACouloir
    a.avance_mois = f.avanceMois
    if (f.loyerPrepayeMois > 0) a.loyer_prepaye_mois = f.loyerPrepayeMois
    a.echeance_mois = f.echeanceMois
    a.commission_agence = commissionAgence(f)
  }
  // Le backend classe l'appartement (2 pièces ou 3+) d'après amenites.chambres.
  if (d.showPieces) a.chambres = f.chambres
  const cEau = parsePrix(f.cautionEau) ?? 0
  const cElec = parsePrix(f.cautionElec) ?? 0
  if (cEau > 0) a.caution_eau = cEau
  if (cElec > 0) a.caution_elec = cElec
  a.electricite = f.electricite
  if (f.electricite === 'autre' && f.electriciteAutre.trim()) a.electricite_autre = f.electriciteAutre.trim()
  a.eau = f.eau
  if (f.eau === 'autre' && f.eauAutre.trim()) a.eau_autre = f.eauAutre.trim()
  if (f.eau === 'forage' && parsePrix(f.prixForage) !== undefined) a.prix_forage = parsePrix(f.prixForage)
  if (f.eau === 'forage' && f.forageGestion) a.forage_gestion = f.forageGestion
  if (d.isMeuble) a.tarifs_meuble = construireTarifsMeuble(f)
}

export function construireAmenites(f: BienClassiqueForm, proprietaireInfo?: unknown): Record<string, unknown> {
  const d = derives(f)
  const a: Record<string, unknown> = { sous_type: d.sousType }
  if (proprietaireInfo) a.proprietaire_info = proprietaireInfo
  if (d.isTerrain) return amenitesTerrain(f, a)

  if (f.standing) a.standing = f.standing
  if (f.standing === 'autre' && f.standingAutre.trim()) a.standing_autre = f.standingAutre.trim()
  if (f.typeBien === 'maison') {
    a.etat_meuble = f.etatMeubleMaison
    if (f.etatConstructionMaison) a.etat_construction = f.etatConstructionMaison
  }
  a.disponibilite = f.disponibilite
  if (f.equipementsBonus.length || f.equipementsAutre.trim()) a.equipements = avecAutre(f.equipementsBonus, f.equipementsAutre)
  if (f.alentours.length || f.alentoursAutre.trim()) a.voisinage = avecAutre(f.alentours, f.alentoursAutre)

  if (d.isLocalPro) {
    a.type_voie = f.typeVoie
    a.visibilite = f.visibiliteBoutique
    a.parking_clients = f.parkingClients
  } else {
    amenitesLogement(f, d, a)
  }

  const frais = f.autresFrais.filter(x => parsePrix(x.prix) !== undefined)
  if (frais.length) a.autres_frais = frais.map(x => ({ label: x.label.trim() || 'Autre frais', montant: parsePrix(x.prix) }))
  return a
}

export function construirePieces(f: BienClassiqueForm): { nom: string; surface: number }[] {
  const d = derives(f)
  if (d.isTerrain || d.isLocalPro) return []
  if (f.typeBien === 'entree_coucher') return [{ nom: 'Chambre', surface: 0 }, { nom: 'Entrée', surface: 0 }]
  const repete = (nom: string, n: number) => Array.from({ length: n }, () => ({ nom, surface: 0 }))
  if (f.typeBien === 'chambre_salon') return [...repete('Chambre', f.chambres), ...repete('Salon', f.salons)]
  return [
    ...repete('Chambre', f.chambres),
    ...repete('Salon', f.salons),
    ...repete('Cuisine', f.cuisines),
    ...repete('Salle de bain', f.douches),
  ]
}

/** Nom donné à un terrain enregistré sans nom. */
export const titreTerrainParDefaut = (quartier: string): string =>
  quartier.trim() ? `Terrain à ${quartier.trim()}` : 'Terrain'

/** Corps de POST /biens pour un bien classique. */
export function construirePayload(f: BienClassiqueForm, proprietaireInfo?: unknown): Record<string, unknown> {
  const d = derives(f)
  const notes = f.description.trim()
  // Nom et superficie d'un terrain sont facultatifs : sans nom, « Terrain à <quartier> ».
  const titre = d.isTerrain ? (f.titreTerrain.trim() || titreTerrainParDefaut(f.quartier)) : ''
  const description = titre ? (notes ? `${titre}\n\n${notes}` : titre) : notes
  const promo = parsePrix(f.prixPromo)

  const body: Record<string, unknown> = {
    type: d.typeBackend,
    transaction: f.typeTransaction,
    prix: prixPrincipal(f),
    ...(d.isTerrain && f.typeTransaction === 'vente' && promo !== undefined ? { prix_promo: promo } : {}),
    frais_visite: FRAIS_VISITE,
    description: description || undefined,
    localisation: {
      adresse: f.indicationAdresse.trim() || [f.quartier, f.arrondissement].filter(Boolean).join(', ') || f.quartier,
      ville: f.ville || f.quartier || undefined,
      quartier: f.quartier || undefined,
      arrondissement: f.arrondissement || undefined,
      latitude: f.latitude ?? POSITION_PAR_DEFAUT.latitude,
      longitude: f.longitude ?? POSITION_PAR_DEFAUT.longitude,
    },
    amenites: construireAmenites(f, proprietaireInfo),
    ...(f.disponibilite === 'en_finition' && f.disponibleA ? { disponible_a: f.disponibleA } : {}),
  }

  const superficie = superficieM2(f)
  if (d.isTerrain && superficie !== undefined) {
    body.details_terrain = { superficie, cloture: false }
  } else if (d.typeBackend === 'appart_vide' || d.typeBackend === 'appart_meuble') {
    body.details_appart = { entree_personnelle: f.typeCour === 'entree_personnelle' }
  }
  const pieces = construirePieces(f)
  if (pieces.length) body.pieces = pieces
  return body
}
