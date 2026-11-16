/**
 * Lot 2 — référentiel unique des types de biens : catégorie, puis sous-type.
 * Copie typée de GET /referentiels/types-biens (backend : src/biens/referentiel),
 * couverte par les mêmes tests ; fichier identique dans immo-web-admin et immo-web-user.
 * Règle : on ne met jamais types et sous-types sur la même ligne de choix.
 */

export type TypeBackend = 'maison' | 'appart_vide' | 'appart_meuble' | 'terrain' | 'guesthouse' | 'salle_fete'
export type CategorieBien = 'residentiel' | 'terrain' | 'commercial' | 'court_sejour' | 'evenementiel'
export type FormulaireBien = 'classique' | 'guesthouse' | 'salle_fete'
export type TransactionBien = 'location' | 'vente'
export type UnitePrixLocation = 'mois' | 'nuit' | 'heure'

export interface CategorieReferentiel {
  cle: CategorieBien
  libelle: string
  /** Nom d'icône indicatif. */
  icone: string
}

export interface SousTypeReferentiel {
  /** Clé de choix dans les formulaires (« appartement », « villa »…). */
  cle: string
  libelle: string
  categorie: CategorieBien
  /** Type en base pour la version vide (non meublée). */
  type: TypeBackend
  /** `amenites.sous_type` enregistré pour la version vide. */
  sous_type: string
  /** Version meublée : type et sous-type en base ; null si non meublable. */
  meuble: { type: TypeBackend; sous_type: string } | null
  transactions: TransactionBien[]
  formulaire: FormulaireBien
  photos_min: number
  unite_prix: UnitePrixLocation
}

export const CATEGORIES_BIENS: readonly CategorieReferentiel[] = [
  { cle: 'residentiel', libelle: 'Résidentiel', icone: 'maison' },
  { cle: 'terrain', libelle: 'Terrain', icone: 'terrain' },
  { cle: 'commercial', libelle: 'Commercial', icone: 'boutique' },
  { cle: 'court_sejour', libelle: 'Court séjour', icone: 'lit' },
  { cle: 'evenementiel', libelle: 'Événementiel', icone: 'fete' },
]

/** Photos exigées (même règle que l'API) : 2 pour un bien classique, 4 pour guesthouse et salle de fêtes. */
export const PHOTOS_MIN_CLASSIQUE = 2
export const PHOTOS_MIN_GUESTHOUSE_SALLE = 4

const LOCATION_VENTE: TransactionBien[] = ['location', 'vente']
const LOCATION: TransactionBien[] = ['location']

function classique(
  cle: string,
  libelle: string,
  categorie: CategorieBien,
  type: TypeBackend,
  sous_type: string,
  meuble: SousTypeReferentiel['meuble'],
  transactions: TransactionBien[],
): SousTypeReferentiel {
  return { cle, libelle, categorie, type, sous_type, meuble, transactions, formulaire: 'classique', photos_min: PHOTOS_MIN_CLASSIQUE, unite_prix: 'mois' }
}

export const SOUS_TYPES_BIENS: readonly SousTypeReferentiel[] = [
  classique('entree_coucher', 'Entrée-coucher', 'residentiel', 'appart_vide', 'entree_coucher', null, LOCATION),
  classique('chambre_salon', 'Chambre-salon', 'residentiel', 'appart_vide', 'chambre_salon', null, LOCATION),
  classique('appartement', 'Appartement', 'residentiel', 'appart_vide', 'appartement', { type: 'appart_meuble', sous_type: 'appart_meuble' }, LOCATION_VENTE),
  classique('villa', 'Villa', 'residentiel', 'maison', 'villa', { type: 'maison', sous_type: 'villa' }, LOCATION_VENTE),
  classique('duplex', 'Duplex / Grande propriété', 'residentiel', 'maison', 'duplex', { type: 'maison', sous_type: 'duplex' }, LOCATION_VENTE),
  classique('maison', 'Maison', 'residentiel', 'maison', 'maison_individuelle', { type: 'maison', sous_type: 'maison_individuelle' }, LOCATION_VENTE),
  classique('terrain', 'Terrain / Parcelle', 'terrain', 'terrain', 'terrain', null, LOCATION_VENTE),
  classique('boutique', 'Boutique', 'commercial', 'maison', 'boutique', null, LOCATION_VENTE),
  classique('bureau', 'Bureau', 'commercial', 'maison', 'bureau', null, LOCATION_VENTE),
  classique('local_commercial', 'Local commercial / Showroom', 'commercial', 'maison', 'local_commercial', null, LOCATION_VENTE),
  {
    cle: 'guesthouse', libelle: 'Guesthouse', categorie: 'court_sejour', type: 'guesthouse', sous_type: 'guesthouse',
    meuble: null, transactions: LOCATION, formulaire: 'guesthouse', photos_min: PHOTOS_MIN_GUESTHOUSE_SALLE, unite_prix: 'nuit',
  },
  {
    cle: 'salle_fete', libelle: 'Salle de fêtes', categorie: 'evenementiel', type: 'salle_fete', sous_type: 'salle_fete',
    meuble: null, transactions: LOCATION, formulaire: 'salle_fete', photos_min: PHOTOS_MIN_GUESTHOUSE_SALLE, unite_prix: 'heure',
  },
]

export type ChoixType = { cle: string; meuble: boolean }

export const sousTypeParCle = (cle: string): SousTypeReferentiel | undefined => SOUS_TYPES_BIENS.find(s => s.cle === cle)

/** Sous-types d'une catégorie, dans l'ordre du référentiel (filtrables par formulaire). */
export function sousTypesDe(categorie: CategorieBien, formulaires?: readonly FormulaireBien[]): SousTypeReferentiel[] {
  return SOUS_TYPES_BIENS.filter(s => s.categorie === categorie && (!formulaires || formulaires.includes(s.formulaire)))
}

/** Catégories qui ont au moins un sous-type parmi les formulaires donnés. */
export function categoriesAvec(formulaires?: readonly FormulaireBien[]): CategorieReferentiel[] {
  return CATEGORIES_BIENS.filter(c => sousTypesDe(c.cle, formulaires).length > 0)
}

/** Couple { type, sous_type } en base pour un choix de formulaire (même règle que l'API). */
export function coupleBackend(choix: ChoixType): { type: TypeBackend; sous_type: string } | null {
  const st = sousTypeParCle(choix.cle)
  if (!st) return null
  if (choix.meuble && st.meuble) return { ...st.meuble }
  return { type: st.type, sous_type: st.sous_type }
}

/**
 * Choix de formulaire correspondant à un bien lu en base, y compris les anciennes valeurs
 * (appartement meublé sans sous-type, maison sans sous-type, « villa_maison », boutique en
 * appart_vide, showroom). Pour une villa, un duplex ou une maison, l'état meublé vient des
 * aménités (`etat_meuble`, `tarifs_meuble`). null : sous-type inconnu, à choisir.
 */
export function choixDepuisBien(type: string, sousType: string | null | undefined, amenites?: Record<string, unknown> | null): ChoixType | null {
  const s = (sousType ?? '').toString()
  if (type === 'guesthouse') return { cle: 'guesthouse', meuble: false }
  if (type === 'salle_fete') return { cle: 'salle_fete', meuble: false }
  if (type === 'terrain') return { cle: 'terrain', meuble: false }
  if (type === 'appart_meuble') {
    const petit = s === 'entree_coucher' || s === 'chambre_salon'
    return { cle: petit ? s : 'appartement', meuble: !petit }
  }
  if (type === 'maison') {
    const etat = amenites?.etat_meuble
    const meuble = (typeof etat === 'string' && etat !== 'non_meuble') || !!amenites?.tarifs_meuble
    if (!s || s === 'maison_individuelle' || s === 'maison') return { cle: 'maison', meuble }
    if (s === 'villa_maison') return { cle: 'villa', meuble }
    if (s === 'showroom') return { cle: 'local_commercial', meuble: false }
    const st = sousTypeParCle(s)
    return st && st.formulaire === 'classique' ? { cle: st.cle, meuble: !!st.meuble && meuble } : null
  }
  if (type === 'appart_vide') {
    if (!s) return { cle: 'appartement', meuble: false }
    if (s === 'appart_meuble') return { cle: 'appartement', meuble: true }
    const st = sousTypeParCle(s)
    return st && st.formulaire === 'classique' ? { cle: st.cle, meuble: false } : null
  }
  return null
}

/** Libellé lisible d'un bien (« Villa meublée », « Appartement »…), ou du type brut à défaut. */
export function libelleBien(type: string, sousType: string | null | undefined, amenites?: Record<string, unknown> | null): string {
  const choix = choixDepuisBien(type, sousType, amenites)
  const st = choix && sousTypeParCle(choix.cle)
  if (!st) return type
  if (!choix.meuble) return st.libelle
  return st.cle === 'villa' || st.cle === 'maison' ? `${st.libelle} meublée` : `${st.libelle} meublé`
}

// ── Filtres de recherche (accueil, page de recherche) ─────────────────────────────────────────
// La transaction (louer / acheter) se choisit à part ; ces filtres ne portent que sur le type.

export interface FiltreType {
  cle: string
  libelle: string
  /** Types en base acceptés (vide : tous). */
  types?: TypeBackend[]
  /** Sous-types acceptés (amenites.sous_type ; vide : tous). */
  sous_types?: string[]
}

export const FILTRES_TYPE: readonly FiltreType[] = [
  { cle: '', libelle: 'Tous' },
  { cle: 'maison', libelle: 'Maison / Villa', types: ['maison'], sous_types: ['villa', 'duplex', 'maison_individuelle', 'villa_maison'] },
  { cle: 'appartement', libelle: 'Appartement', types: ['appart_vide', 'appart_meuble'], sous_types: ['appartement', 'appart_meuble'] },
  { cle: 'chambre_salon', libelle: 'Chambre-salon', sous_types: ['chambre_salon', 'entree_coucher'] },
  { cle: 'commerce', libelle: 'Commerce', sous_types: ['boutique', 'bureau', 'local_commercial', 'showroom'] },
  { cle: 'terrain', libelle: 'Terrain', types: ['terrain'] },
  { cle: 'guesthouse', libelle: 'Guesthouse', types: ['guesthouse'] },
  { cle: 'salle_fete', libelle: 'Salle de fêtes', types: ['salle_fete'] },
]

/** Vrai si le bien entre dans le filtre (filtre inconnu ou « Tous » : toujours vrai). */
export function correspondAuFiltre(cle: string, bien: { type?: string | null; amenites?: Record<string, unknown> | null }): boolean {
  const f = FILTRES_TYPE.find(x => x.cle === cle)
  if (!f || !f.cle) return true
  const choix = choixDepuisBien(bien.type ?? '', bien.amenites?.sous_type as string | undefined, bien.amenites)
  const st = choix && sousTypeParCle(choix.cle)
  // On compare au sous-type normalisé : une maison sans sous-type compte comme « Maison ».
  const sousType = st ? coupleBackend({ cle: st.cle, meuble: false })!.sous_type : String(bien.amenites?.sous_type ?? '')
  const okType = !f.types || f.types.includes((bien.type ?? '') as TypeBackend)
  const okSousType = !f.sous_types || f.sous_types.includes(sousType) || (choix?.meuble === true && f.sous_types.includes('appart_meuble'))
  return okType && okSousType
}

/** Paramètres de GET /biens pour un filtre (listes séparées par des virgules). */
export function parametresFiltre(cle: string): { type?: string; sous_type?: string } {
  const f = FILTRES_TYPE.find(x => x.cle === cle)
  if (!f || !f.cle) return {}
  const p: { type?: string; sous_type?: string } = {}
  if (f.types) p.type = f.types.join(',')
  if (f.sous_types) p.sous_type = f.sous_types.join(',')
  return p
}
