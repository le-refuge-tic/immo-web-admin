/**
 * Formulaire salle de fêtes : état, règles de chaque étape et corps de POST /biens.
 * Mêmes règles que le backend (voir API_SALLE_FETE.md) pour éviter les allers-retours.
 * Logique pure, sans React : testée dans salleFeteForm.test.ts.
 */
import {
  HEURE,
  amenitesProprietairePayload,
  descriptionPayload,
  entierFcfa,
  localisationPayload,
  manquesIdentite,
  manquesLocalisation,
  manquesPhotos,
  separerNomDescription,
  type ChampsIdentite,
  type ChampsLocalisation,
  type TextesIdentite,
} from '../guesthouse/guesthouseForm'
import { prixAvecUnite } from '../../../utils/prix'

export { entierFcfa, formatFcfa } from '../guesthouse/guesthouseForm'

export const ETAPES = [
  'Identité et contact',
  'Localisation',
  'Tarif et capacité',
  'Événements, équipements et règles',
  'Photos et récapitulatif',
] as const

export const TEXTES_IDENTITE: TextesIdentite = {
  titre: 'La salle de fêtes',
  libelleNom: 'Nom de la salle',
  placeholderNom: 'Ex. Salle Les Cocotiers',
  placeholderDescription: 'Ambiance, points forts, accès, proximité (hôtels, marché, grands axes…)',
}

export const DUREE_HEURES_MAX = 24
export const CAPACITE_MAX = 5000

export type Configuration = 'interieur' | 'plein_air' | 'mixte'
export type Traiteur = 'libre' | 'impose' | 'inclus'

export const CONFIGURATIONS: { value: Configuration; label: string }[] = [
  { value: 'interieur', label: 'Intérieur' },
  { value: 'plein_air', label: 'Plein air' },
  { value: 'mixte', label: 'Mixte' },
]

export const TRAITEURS: { value: Traiteur; label: string }[] = [
  { value: 'libre', label: 'Libre' },
  { value: 'impose', label: 'Imposé' },
  { value: 'inclus', label: 'Inclus' },
]

export const LIBELLES_CONFIGURATION = Object.fromEntries(CONFIGURATIONS.map(c => [c.value, c.label]))
export const LIBELLES_TRAITEUR: Record<Traiteur, string> = {
  libre: 'traiteur libre',
  impose: 'traiteur imposé',
  inclus: 'traiteur inclus',
}

export type SalleFeteForm = ChampsIdentite & ChampsLocalisation & {
  /** Montant en FCFA pour `dureeHeures` heures (texte saisi) */
  prix: string
  dureeHeures: number
  heuresMin: number
  caution: string
  fraisMenage: string
  capacite: string
  superficie: string
  /** null tant que le commercial n'a pas choisi */
  configuration: Configuration | null
  nbTables: string
  nbChaises: string
  evenements: string[]
  equipements: string[]
  /** null tant que le commercial n'a pas répondu Oui / Non */
  parking: boolean | null
  placesParking: string
  heureOuverture: string
  /** Peut dépasser minuit : ouverture 18:00, fin 02:00 = jusqu'à 2 h le lendemain */
  heureFinMax: string
  traiteur: Traiteur | null
  deco: boolean | null
  alcool: boolean | null
  insonorisee: boolean | null
  /** Vide = pas d'heure limite pour la musique */
  heureFinMusique: string
}

export function formulaireVide(proprio?: {
  prenom?: string
  nom?: string
  telephone?: string
  email?: string
} | null): SalleFeteForm {
  return {
    nom: '',
    description: '',
    proprioPrenom: proprio?.prenom ?? '',
    proprioNom: proprio?.nom ?? '',
    proprioTelephone: proprio?.telephone ?? '',
    proprioEmail: proprio?.email ?? '',
    ville: '',
    quartier: '',
    arrondissement: '',
    repere: '',
    latitude: null,
    longitude: null,
    prix: '',
    dureeHeures: 1,
    heuresMin: 4,
    caution: '',
    fraisMenage: '',
    capacite: '',
    superficie: '',
    configuration: null,
    nbTables: '',
    nbChaises: '',
    evenements: [],
    equipements: [],
    parking: null,
    placesParking: '',
    heureOuverture: '08:00',
    heureFinMax: '23:00',
    traiteur: null,
    deco: null,
    alcool: null,
    insonorisee: null,
    heureFinMusique: '',
  }
}

/** Une valeur facultative saisie est valide si vide, ou si c'est un entier (≥ 0, ou > 0 selon `zeroOk`). */
const facultatifInvalide = (v: string, zeroOk: boolean) => v.trim() !== '' && entierFcfa(v, zeroOk) === undefined

function manquesTarif(f: SalleFeteForm): string[] {
  const m: string[] = []
  if (entierFcfa(f.prix) === undefined) m.push('Prix (nombre entier de FCFA, supérieur à 0)')
  if (!Number.isInteger(f.dureeHeures) || f.dureeHeures < 1 || f.dureeHeures > DUREE_HEURES_MAX) {
    m.push(`Heures couvertes par le prix (de 1 à ${DUREE_HEURES_MAX})`)
  }
  if (!Number.isInteger(f.heuresMin) || f.heuresMin < 1) m.push('Durée minimum de location (au moins 1 heure)')
  if (facultatifInvalide(f.caution, true)) m.push('Caution (nombre entier de FCFA)')
  if (facultatifInvalide(f.fraisMenage, true)) m.push('Frais de ménage (nombre entier de FCFA)')
  const capacite = entierFcfa(f.capacite)
  if (capacite === undefined || capacite > CAPACITE_MAX) m.push(`Capacité (de 1 à ${CAPACITE_MAX.toLocaleString('fr-FR')} personnes)`)
  if (facultatifInvalide(f.superficie, false)) m.push('Superficie (nombre entier de m², supérieur à 0)')
  if (f.configuration === null) m.push('Configuration (intérieur, plein air ou mixte)')
  if (facultatifInvalide(f.nbTables, true)) m.push('Nombre de tables (nombre entier)')
  if (facultatifInvalide(f.nbChaises, true)) m.push('Nombre de chaises (nombre entier)')
  return m
}

function manquesRegles(f: SalleFeteForm): string[] {
  const m: string[] = []
  if (!f.evenements.length) m.push('Au moins un type d’événement accepté')
  if (f.parking === null) m.push('Parking : Oui ou Non')
  if (f.parking && entierFcfa(f.placesParking) === undefined) m.push('Nombre de places de parking (au moins 1)')
  if (!HEURE.test(f.heureOuverture)) m.push('Heure d’ouverture')
  if (!HEURE.test(f.heureFinMax)) m.push('Heure limite de fin')
  if (f.traiteur === null) m.push('Traiteur (libre, imposé ou inclus)')
  if (f.deco === null) m.push('Décoration autorisée : Oui ou Non')
  if (f.alcool === null) m.push('Alcool autorisé : Oui ou Non')
  if (f.insonorisee === null) m.push('Salle insonorisée : Oui ou Non')
  if (f.heureFinMusique.trim() && !HEURE.test(f.heureFinMusique)) m.push('Heure de fin de la musique')
  return m
}

/** Champs encore manquants ou invalides à l'étape donnée ; vide = on peut avancer. */
export function manquesEtape(etape: number, f: SalleFeteForm, nbPhotos: number): string[] {
  switch (etape) {
    case 0: return manquesIdentite(f, 'Nom de la salle (3 à 100 caractères)')
    case 1: return manquesLocalisation(f)
    case 2: return manquesTarif(f)
    case 3: return manquesRegles(f)
    case 4: return manquesPhotos(nbPhotos)
    default: return []
  }
}

/** Vrai si la fin tombe le lendemain de l'ouverture (ex. 18:00 → 02:00). */
export function finLendemain(ouverture: string, fin: string): boolean {
  return HEURE.test(ouverture) && HEURE.test(fin) && fin <= ouverture
}

export const libelleHoraires = (ouverture: string, fin: string) =>
  `${ouverture} → ${fin}${finLendemain(ouverture, fin) ? ' (lendemain)' : ''}`

/** « 45 000 FCFA / 8 h » et, si le prix couvre plusieurs heures, « 5 625 FCFA / heure » ; null si le prix est invalide. */
export function apercuPrix(prix: string, dureeHeures: number): { affiche: string; parHeure: string } | null {
  const montant = entierFcfa(prix)
  if (montant === undefined) return null
  const duree = Math.max(1, dureeHeures)
  const affiche = prixAvecUnite({ prix: montant, unite_prix: 'heure', details_salle_fete: { duree_heures: duree } })
  const parHeure = duree > 1
    ? prixAvecUnite({ prix: Math.round(montant / duree), unite_prix: 'heure', details_salle_fete: { duree_heures: 1 } })
    : ''
  return { affiche, parHeure }
}

/** Valeur entière facultative : absente si le champ est vide. */
const optionnel = <K extends string>(cle: K, v: string, zeroOk: boolean): { [P in K]?: number } => {
  const n = v.trim() ? entierFcfa(v, zeroOk) : undefined
  return (n !== undefined ? { [cle]: n } : {}) as { [P in K]?: number }
}

function detailsPayload(f: SalleFeteForm) {
  return {
    prix: entierFcfa(f.prix) ?? 0,
    duree_heures: f.dureeHeures,
    heures_min: f.heuresMin,
    ...optionnel('caution', f.caution, true),
    ...optionnel('frais_menage', f.fraisMenage, true),
    capacite: entierFcfa(f.capacite) ?? 0,
    ...optionnel('superficie_m2', f.superficie, false),
    configuration: f.configuration as Configuration,
    ...optionnel('nb_tables', f.nbTables, true),
    ...optionnel('nb_chaises', f.nbChaises, true),
    parking: f.parking === true,
    ...(f.parking ? optionnel('places_parking', f.placesParking, false) : {}),
    heure_ouverture: f.heureOuverture,
    heure_fin_max: f.heureFinMax,
    traiteur: f.traiteur as Traiteur,
    deco_autorisee: f.deco === true,
    alcool_autorise: f.alcool === true,
    insonorisee: f.insonorisee === true,
    ...(f.heureFinMusique.trim() ? { heure_fin_musique: f.heureFinMusique } : {}),
  }
}

/** Corps de POST /biens (type salle_fete). À n'appeler qu'une fois toutes les étapes valides. */
export function construirePayload(f: SalleFeteForm) {
  const details = detailsPayload(f)
  return {
    type: 'salle_fete' as const,
    transaction: 'location' as const,
    prix: details.prix,
    frais_visite: 500,
    description: descriptionPayload(f),
    localisation: localisationPayload(f),
    amenites: amenitesProprietairePayload(f),
    details_salle_fete: details,
    evenements: f.evenements,
    equipements: f.equipements,
  }
}

/** Bien renvoyé par GET /admin/biens/:id (champs utiles à l'éditeur). */
type BienLu = {
  prix?: number | string | null
  description?: string | null
  localisation?: { ville?: string | null; quartier?: string | null; adresse?: string | null } | null
  amenites?: { proprietaire_info?: { prenom?: string; nom?: string; telephone?: string; email?: string } } | null
  details_salle_fete?: {
    prix: number; duree_heures: number; heures_min: number; caution: number | null; frais_menage: number | null
    capacite: number; superficie_m2: number | null; configuration: Configuration
    nb_tables: number | null; nb_chaises: number | null; parking: boolean; places_parking: number | null
    heure_ouverture: string; heure_fin_max: string; traiteur: Traiteur
    deco_autorisee: boolean; alcool_autorise: boolean; heure_fin_musique: string | null
    insonorisee?: boolean
  } | null
  evenements?: { code: string }[]
  equipements_liste?: { code: string }[]
}

const texte = (n: number | null | undefined) => (n != null ? String(n) : '')

/**
 * Formulaire d'édition à partir d'un bien existant. Une salle sans détails
 * repart des valeurs par défaut, avec son prix, ses équipements et ses événements.
 */
export function depuisBien(b: BienLu): SalleFeteForm {
  const vide = formulaireVide(b.amenites?.proprietaire_info)
  const d = b.details_salle_fete
  const heure = (h: string) => h.slice(0, 5)
  const base: SalleFeteForm = {
    ...vide,
    ...separerNomDescription(b.description),
    ville: b.localisation?.ville ?? '',
    quartier: b.localisation?.quartier ?? '',
    repere: b.localisation?.adresse ?? '',
    prix: b.prix != null ? String(Math.round(Number(b.prix))) : '',
    evenements: (b.evenements ?? []).map(e => e.code),
    equipements: (b.equipements_liste ?? []).map(e => e.code),
  }
  if (!d) return base
  return {
    ...base,
    prix: String(d.prix),
    dureeHeures: d.duree_heures,
    heuresMin: d.heures_min,
    caution: texte(d.caution),
    fraisMenage: texte(d.frais_menage),
    capacite: String(d.capacite),
    superficie: texte(d.superficie_m2),
    configuration: d.configuration,
    nbTables: texte(d.nb_tables),
    nbChaises: texte(d.nb_chaises),
    parking: d.parking,
    placesParking: texte(d.places_parking),
    heureOuverture: heure(d.heure_ouverture),
    heureFinMax: heure(d.heure_fin_max),
    traiteur: d.traiteur,
    deco: d.deco_autorisee,
    alcool: d.alcool_autorise,
    insonorisee: d.insonorisee ?? false,
    heureFinMusique: d.heure_fin_musique ? heure(d.heure_fin_musique) : '',
  }
}

/**
 * Corps de PATCH /admin/biens/:id : le type ne change pas, l'adresse est reprise
 * telle quelle. Une valeur facultative vidée est envoyée à `null` (sinon le serveur
 * garderait l'ancienne), et l'absence de parking efface le nombre de places.
 */
export function payloadEdition(f: SalleFeteForm) {
  const d = detailsPayload(f)
  return {
    description: descriptionPayload(f),
    localisation: { ville: f.ville, quartier: f.quartier, adresse: f.repere.trim() || f.quartier },
    amenites: amenitesProprietairePayload(f),
    details_salle_fete: {
      ...d,
      caution: d.caution ?? null,
      frais_menage: d.frais_menage ?? null,
      superficie_m2: d.superficie_m2 ?? null,
      nb_tables: d.nb_tables ?? null,
      nb_chaises: d.nb_chaises ?? null,
      places_parking: f.parking ? (d.places_parking ?? null) : null,
      heure_fin_musique: d.heure_fin_musique ?? null,
    },
    evenements: f.evenements,
    equipements: f.equipements,
  }
}
