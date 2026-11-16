/**
 * Lot 3 — totaux des récapitulatifs de guesthouse et de salle de fêtes : une seule source de
 * calcul, testée (calculsTarifs.test.ts). Montants en FCFA entiers ; un montant absent vaut null
 * (« non précisé ») et compte pour 0 dans les totaux.
 * Fichier identique dans immo-web-admin et immo-web-user (src/shared/biens).
 */

export interface TarifReduit {
  prix: number
  /** Prix de référence au tarif de base (7 ou 30 nuits). */
  reference: number
  /** Réduction implicite par rapport à la référence, en % arrondi (négative si plus cher). */
  reductionPct: number
}

export interface TotauxGuesthouse {
  prixNuit: number
  nuiteesMin: number
  /** Prix/nuit × nuitées minimum. */
  sejourMinimum: number
  fraisMenage: number | null
  caution: number | null
  /** Séjour minimum + ménage + caution : ce que le voyageur verse à l'arrivée. */
  totalArrivee: number
  semaine: TarifReduit | null
  mois: TarifReduit | null
}

export interface TotauxSalle {
  /** Prix affiché, pour `dureeHeures` heures. */
  prix: number
  dureeHeures: number
  /** Prix ramené à l'heure (arrondi). */
  prixHeure: number
  heuresMin: number
  /** (prix ÷ durée couverte) × heures minimum, arrondi. */
  coutDureeMinimum: number
  caution: number | null
  fraisMenage: number | null
  /** Durée minimum + caution + ménage : minimum à verser pour réserver. */
  totalMinimum: number
  forfaitJournee: number | null
  forfaitWeekend: number | null
}

/** Montant saisi (texte ou nombre) → entier ≥ 0, ou null si vide / invalide. */
export function montant(v: string | number | null | undefined): number | null {
  if (v === null || v === undefined) return null
  const s = String(v).trim().replace(/\s/g, '')
  if (!/^\d+$/.test(s)) return null
  return Number(s)
}

const entierPositif = (n: number | null | undefined, defaut: number) =>
  typeof n === 'number' && Number.isFinite(n) && n >= 1 ? Math.floor(n) : defaut

function reduit(prix: number | null, reference: number): TarifReduit | null {
  if (prix === null || prix <= 0 || reference <= 0) return null
  return { prix, reference, reductionPct: Math.round((1 - prix / reference) * 100) }
}

/** Totaux d'une guesthouse ; null si le prix par nuit n'est pas saisi. */
export function totauxGuesthouse(e: {
  prixNuitee: string | number | null | undefined
  nuiteesMin: number | null | undefined
  caution?: string | number | null
  fraisMenage?: string | number | null
  prixSemaine?: string | number | null
  prixMois?: string | number | null
}): TotauxGuesthouse | null {
  const prixNuit = montant(e.prixNuitee)
  if (!prixNuit) return null
  const nuiteesMin = entierPositif(e.nuiteesMin, 1)
  const caution = montant(e.caution)
  const fraisMenage = montant(e.fraisMenage)
  const sejourMinimum = prixNuit * nuiteesMin
  return {
    prixNuit,
    nuiteesMin,
    sejourMinimum,
    fraisMenage,
    caution,
    totalArrivee: sejourMinimum + (fraisMenage ?? 0) + (caution ?? 0),
    semaine: reduit(montant(e.prixSemaine), prixNuit * 7),
    mois: reduit(montant(e.prixMois), prixNuit * 30),
  }
}

/** Totaux d'une salle de fêtes ; null si le prix n'est pas saisi. */
export function totauxSalle(e: {
  prix: string | number | null | undefined
  dureeHeures: number | null | undefined
  heuresMin: number | null | undefined
  caution?: string | number | null
  fraisMenage?: string | number | null
  forfaitJournee?: string | number | null
  forfaitWeekend?: string | number | null
}): TotauxSalle | null {
  const prix = montant(e.prix)
  if (!prix) return null
  const dureeHeures = entierPositif(e.dureeHeures, 1)
  const heuresMin = entierPositif(e.heuresMin, 1)
  const caution = montant(e.caution)
  const fraisMenage = montant(e.fraisMenage)
  // Calcul exact puis arrondi une seule fois : 45 000 F / 8 h × 4 h = 22 500 F, pas 5 625 × 4 arrondi deux fois.
  const coutDureeMinimum = Math.round((prix * heuresMin) / dureeHeures)
  return {
    prix,
    dureeHeures,
    prixHeure: Math.round(prix / dureeHeures),
    heuresMin,
    coutDureeMinimum,
    caution,
    fraisMenage,
    totalMinimum: coutDureeMinimum + (caution ?? 0) + (fraisMenage ?? 0),
    forfaitJournee: montant(e.forfaitJournee) || null,
    forfaitWeekend: montant(e.forfaitWeekend) || null,
  }
}

/** Nombre d'heures entre l'ouverture et la fin (HH:MM), la fin pouvant tomber le lendemain. */
export function heuresDisponibles(ouverture: string, fin: string): number | null {
  const m = (h: string) => /^([01]\d|2[0-3]):([0-5]\d)$/.exec(h)
  const a = m(ouverture), b = m(fin)
  if (!a || !b) return null
  const debut = Number(a[1]) * 60 + Number(a[2])
  let arret = Number(b[1]) * 60 + Number(b[2])
  if (arret <= debut) arret += 24 * 60
  return (arret - debut) / 60
}

export const fcfa = (n: number) => `${n.toLocaleString('fr-FR')} FCFA`
