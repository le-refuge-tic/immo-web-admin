/**
 * Formulaire guesthouse : état, règles de chaque étape et corps de POST /biens.
 * Mêmes règles que le backend (voir API_GUESTHOUSE.md) pour éviter les allers-retours.
 * Logique pure, sans React : testée dans guesthouseForm.test.ts.
 */

export const ETAPES = [
  'Identité et contact',
  'Localisation',
  'Tarif et capacité',
  'Équipements, garage et règles',
  'Photos et récapitulatif',
] as const

export const PHOTOS_MIN = 4
export const PHOTOS_MAX = 8
export const VIDEO_MAX_OCTETS = 30 * 1024 * 1024

/** Position par défaut (Cotonou) quand l'adresse n'a pas été vérifiée — même repli que PublierBienPage. */
export const POSITION_PAR_DEFAUT = { latitude: 6.3654, longitude: 2.4183 }

export const TYPES_LIT = [
  { value: 'double', label: 'Lit double' },
  { value: 'simple', label: 'Lit simple' },
  { value: 'superpose', label: 'Lits superposés' },
  { value: 'canape_lit', label: 'Canapé-lit' },
] as const

export type Lit = { type: string; nombre: number }
export type AccesGarage = 'prive' | 'commun'

export type GuesthouseForm = {
  nom: string
  description: string
  proprioPrenom: string
  proprioNom: string
  proprioTelephone: string
  proprioEmail: string
  ville: string
  quartier: string
  arrondissement: string
  repere: string
  latitude: number | null
  longitude: number | null
  prixNuitee: string
  caution: string
  nuiteesMin: number
  capacite: number
  nbChambres: number
  lits: Lit[]
  nbSallesBain: number
  equipements: string[]
  /** null tant que le commercial n'a pas répondu Oui / Non */
  garage: boolean | null
  typeAccesGarage: AccesGarage | null
  heureArrivee: string
  heureDepart: string
  animaux: boolean
  fetes: boolean
  fumeur: boolean
}

/** Champs communs aux formulaires de guesthouse et de salle de fêtes (étapes « Identité » et « Localisation »). */
export type ChampsIdentite = Pick<
  GuesthouseForm,
  'nom' | 'description' | 'proprioPrenom' | 'proprioNom' | 'proprioTelephone' | 'proprioEmail'
>
export type ChampsLocalisation = Pick<
  GuesthouseForm,
  'ville' | 'quartier' | 'arrondissement' | 'repere' | 'latitude' | 'longitude'
>

/** Textes de l'étape « Identité » : ceux d'une guesthouse par défaut, adaptables à un autre type de bien. */
export type TextesIdentite = {
  titre: string
  libelleNom: string
  placeholderNom: string
  placeholderDescription: string
}

export function formulaireVide(proprio?: {
  prenom?: string
  nom?: string
  telephone?: string
  email?: string
} | null): GuesthouseForm {
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
    prixNuitee: '',
    caution: '',
    nuiteesMin: 1,
    capacite: 2,
    nbChambres: 1,
    lits: [{ type: 'double', nombre: 1 }],
    nbSallesBain: 1,
    equipements: [],
    garage: null,
    typeAccesGarage: null,
    heureArrivee: '14:00',
    heureDepart: '11:00',
    animaux: false,
    fetes: false,
    fumeur: false,
  }
}

export const HEURE = /^([01]\d|2[0-3]):[0-5]\d$/
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const telephoneNormalise = (t: string) => t.replace(/[\s.-]/g, '')
const telephoneValide = (t: string) => /^\+?\d{8,15}$/.test(telephoneNormalise(t))

/** Entier strictement positif (ou ≥ 0 si `zeroOk`) saisi en texte ; undefined sinon. */
export function entierFcfa(v: string, zeroOk = false): number | undefined {
  const s = v.trim().replace(/\s/g, '')
  if (!/^\d+$/.test(s)) return undefined
  const n = Number(s)
  return n > 0 || (zeroOk && n === 0) ? n : undefined
}

export function manquesIdentite(
  f: ChampsIdentite,
  libelleNom = 'Nom de la guesthouse (3 à 100 caractères)',
): string[] {
  const m: string[] = []
  const nom = f.nom.trim()
  if (nom.length < 3 || nom.length > 100) m.push(libelleNom)
  if (!f.description.trim()) m.push('Description')
  if (!f.proprioNom.trim()) m.push('Nom du propriétaire ou gestionnaire')
  if (!telephoneValide(f.proprioTelephone)) m.push('Téléphone du propriétaire (ex. +229 01 97 00 00 00)')
  if (f.proprioEmail.trim() && !EMAIL.test(f.proprioEmail.trim())) m.push('E-mail du propriétaire (format invalide)')
  return m
}

export function manquesLocalisation(f: ChampsLocalisation): string[] {
  const m: string[] = []
  if (!f.quartier.trim()) m.push('Quartier')
  if (!f.ville.trim()) m.push('Ville')
  return m
}

function manquesTarif(f: GuesthouseForm): string[] {
  const m: string[] = []
  if (entierFcfa(f.prixNuitee) === undefined) m.push('Prix par nuit (nombre entier de FCFA, supérieur à 0)')
  if (f.caution.trim() && entierFcfa(f.caution, true) === undefined) m.push('Caution (nombre entier de FCFA)')
  if (f.nuiteesMin < 1) m.push('Nuitées minimum (au moins 1)')
  if (f.capacite < 1) m.push('Capacité d’accueil (au moins 1 voyageur)')
  if (f.nbChambres < 1) m.push('Nombre de chambres (au moins 1)')
  if (!f.lits.length || f.lits.some(l => l.nombre < 1)) m.push('Lits (au moins un lit)')
  if (f.nbSallesBain < 1) m.push('Nombre de salles de bain (au moins 1)')
  return m
}

function manquesRegles(f: GuesthouseForm): string[] {
  const m: string[] = []
  if (f.garage === null) m.push('Garage : Oui ou Non')
  if (f.garage && !f.typeAccesGarage) m.push('Type d’accès au garage (privé ou commun)')
  if (!HEURE.test(f.heureArrivee)) m.push('Heure d’arrivée')
  if (!HEURE.test(f.heureDepart)) m.push('Heure de départ')
  return m
}

export function manquesPhotos(nbPhotos: number): string[] {
  if (nbPhotos < PHOTOS_MIN) return [`Au moins ${PHOTOS_MIN} photos (${nbPhotos} pour l’instant)`]
  if (nbPhotos > PHOTOS_MAX) return [`${PHOTOS_MAX} photos au maximum (${nbPhotos} choisies)`]
  return []
}

/** Champs encore manquants ou invalides à l'étape donnée ; vide = on peut avancer. */
export function manquesEtape(etape: number, f: GuesthouseForm, nbPhotos: number): string[] {
  switch (etape) {
    case 0: return manquesIdentite(f)
    case 1: return manquesLocalisation(f)
    case 2: return manquesTarif(f)
    case 3: return manquesRegles(f)
    case 4: return manquesPhotos(nbPhotos)
    default: return []
  }
}

export const formatFcfa = (n: number) => `${n.toLocaleString('fr-FR')} FCFA`

export function adresseComplete(f: ChampsLocalisation): string {
  return [f.repere.trim(), f.quartier, f.arrondissement, f.ville, 'Bénin'].filter(Boolean).join(', ')
}

/** Pas de colonne « nom » : même convention que le titre d'un terrain (1re ligne de la description). */
export const descriptionPayload = (f: ChampsIdentite) => `${f.nom.trim()}\n\n${f.description.trim()}`

/** Relit nom et description d'un bien enregistré avec `descriptionPayload`. */
export function separerNomDescription(description: string | null | undefined): { nom: string; description: string } {
  const desc = (description ?? '').trim()
  const coupe = desc.indexOf('\n\n')
  return coupe > 0
    ? { nom: desc.slice(0, coupe).trim(), description: desc.slice(coupe + 2).trim() }
    : { nom: '', description: desc }
}

export function localisationPayload(f: ChampsLocalisation) {
  return {
    adresse: [f.repere.trim(), f.quartier, f.arrondissement].filter(Boolean).join(', '),
    ville: f.ville,
    quartier: f.quartier,
    arrondissement: f.arrondissement || undefined,
    latitude: f.latitude ?? POSITION_PAR_DEFAUT.latitude,
    longitude: f.longitude ?? POSITION_PAR_DEFAUT.longitude,
  }
}

export function amenitesProprietairePayload(f: ChampsIdentite) {
  const email = f.proprioEmail.trim()
  return {
    proprietaire_info: {
      ...(f.proprioPrenom.trim() ? { prenom: f.proprioPrenom.trim() } : {}),
      nom: f.proprioNom.trim(),
      telephone: telephoneNormalise(f.proprioTelephone),
      ...(email ? { email } : {}),
    },
  }
}

/** Corps de POST /biens (type guesthouse). À n'appeler qu'une fois toutes les étapes valides. */
export function construirePayload(f: GuesthouseForm) {
  const caution = f.caution.trim() ? entierFcfa(f.caution, true) : undefined
  const prix = entierFcfa(f.prixNuitee) ?? 0
  return {
    type: 'guesthouse' as const,
    transaction: 'location' as const,
    prix,
    frais_visite: 500,
    description: descriptionPayload(f),
    localisation: localisationPayload(f),
    amenites: amenitesProprietairePayload(f),
    details_guesthouse: {
      prix_nuitee: prix,
      ...(caution !== undefined ? { caution } : {}),
      nuitees_min: f.nuiteesMin,
      capacite: f.capacite,
      nb_chambres: f.nbChambres,
      lits: f.lits.map(l => ({ type: l.type, nombre: l.nombre })),
      nb_salles_bain: f.nbSallesBain,
      garage: f.garage === true,
      ...(f.garage && f.typeAccesGarage ? { type_acces_garage: f.typeAccesGarage } : {}),
      heure_arrivee: f.heureArrivee,
      heure_depart: f.heureDepart,
      animaux_autorises: f.animaux,
      fetes_autorisees: f.fetes,
      fumeur_autorise: f.fumeur,
    },
    equipements: f.equipements,
  }
}

/** Bien renvoyé par GET /admin/biens/:id (champs utiles à l'éditeur). */
type BienLu = {
  prix?: number | string | null
  description?: string | null
  localisation?: { ville?: string | null; quartier?: string | null; arrondissement?: string | null; adresse?: string | null } | null
  amenites?: { proprietaire_info?: { prenom?: string; nom?: string; telephone?: string; email?: string } } | null
  details_guesthouse?: {
    prix_nuitee: number; caution: number | null; nuitees_min: number; capacite: number; nb_chambres: number
    lits: Lit[]; nb_salles_bain: number; garage: boolean; type_acces_garage: AccesGarage | null
    heure_arrivee: string; heure_depart: string
    animaux_autorises: boolean; fetes_autorisees: boolean; fumeur_autorise: boolean
  } | null
  equipements_liste?: { code: string }[]
}

/**
 * Formulaire d'édition à partir d'un bien existant. Une ancienne guesthouse
 * (sans détails) repart des valeurs par défaut, avec son prix et le garage à choisir.
 */
export function depuisBien(b: BienLu): GuesthouseForm {
  const vide = formulaireVide(b.amenites?.proprietaire_info)
  const d = b.details_guesthouse
  const heure = (h: string) => h.slice(0, 5)
  const base: GuesthouseForm = {
    ...vide,
    ...separerNomDescription(b.description),
    ville: b.localisation?.ville ?? '',
    quartier: b.localisation?.quartier ?? '',
    arrondissement: b.localisation?.arrondissement ?? '',
    repere: b.localisation?.adresse ?? '',
    prixNuitee: b.prix != null ? String(Math.round(Number(b.prix))) : '',
    equipements: (b.equipements_liste ?? []).map(e => e.code),
  }
  if (!d) return base
  return {
    ...base,
    prixNuitee: String(d.prix_nuitee),
    caution: d.caution != null ? String(d.caution) : '',
    nuiteesMin: d.nuitees_min,
    capacite: d.capacite,
    nbChambres: d.nb_chambres,
    lits: d.lits.map(l => ({ type: l.type, nombre: l.nombre })),
    nbSallesBain: d.nb_salles_bain,
    garage: d.garage,
    typeAccesGarage: d.type_acces_garage,
    heureArrivee: heure(d.heure_arrivee),
    heureDepart: heure(d.heure_depart),
    animaux: d.animaux_autorises,
    fetes: d.fetes_autorisees,
    fumeur: d.fumeur_autorise,
  }
}

/** Corps de PATCH /admin/biens/:id : le type ne change pas, l'adresse est reprise telle quelle. */
export function payloadEdition(f: GuesthouseForm) {
  const p = construirePayload(f)
  return {
    description: p.description,
    localisation: { ville: f.ville, quartier: f.quartier, arrondissement: f.arrondissement || undefined, adresse: f.repere.trim() || f.quartier },
    amenites: p.amenites,
    details_guesthouse: p.details_guesthouse,
    equipements: p.equipements,
  }
}
