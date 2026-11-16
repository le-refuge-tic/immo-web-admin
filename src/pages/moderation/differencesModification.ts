/**
 * Lot 5 — ce que change une modification en attente par rapport à l'annonce en ligne,
 * pour que l'admin décide en connaissance de cause. Logique pure (testée).
 */

export interface Difference {
  champ: string
  avant: string
  apres: string
}

const LIBELLES: Record<string, string> = {
  prix: 'Prix',
  prix_promo: 'Prix promotionnel',
  description: 'Description',
  frais_visite: 'Frais de visite',
  disponible_a: 'Disponible à partir du',
  conditions_speciales: 'Conditions spéciales',
  type: 'Type',
  ville: 'Ville',
  quartier: 'Quartier',
  arrondissement: 'Arrondissement',
  adresse: 'Adresse',
  sous_type: 'Sous-type',
  chambres: 'Chambres',
  standing: 'Standing',
  avance_mois: 'Avance (mois)',
  caution_eau: 'Caution eau',
  caution_elec: 'Caution électricité',
  electricite: 'Électricité',
  eau: 'Eau',
  disponibilite: 'Disponibilité',
  prix_nuitee: 'Prix par nuit',
  nuitees_min: 'Nuitées minimum',
  capacite: 'Capacité',
  caution: 'Caution',
  frais_menage: 'Frais de ménage',
  heures_min: 'Durée minimum (h)',
  duree_heures: 'Heures couvertes',
}

/** Valeur lisible : vide → « — », objet → JSON compact. */
export function lisible(v: unknown): string {
  if (v === null || v === undefined || v === '') return '—'
  if (typeof v === 'boolean') return v ? 'oui' : 'non'
  if (typeof v === 'number') return v.toLocaleString('fr-FR')
  if (typeof v === 'string') return /^\d+(\.\d+)?$/.test(v) ? Number(v).toLocaleString('fr-FR') : v
  return JSON.stringify(v)
}

const egal = (a: unknown, b: unknown) => lisible(a) === lisible(b)
const libelle = (prefixe: string, cle: string) => {
  const base = LIBELLES[cle] ?? cle.replace(/_/g, ' ')
  return prefixe ? `${prefixe} · ${base}` : base
}

/** Différences entre le bien en ligne et le corps de la modification (champs absents = inchangés). */
export function differencesModification(bien: Record<string, unknown>, corps: Record<string, unknown>): Difference[] {
  const diffs: Difference[] = []
  const comparer = (prefixe: string, avant: Record<string, unknown> | null | undefined, apres: Record<string, unknown>) => {
    for (const [cle, valeur] of Object.entries(apres)) {
      if (valeur !== null && typeof valeur === 'object' && !Array.isArray(valeur) && cle !== 'tarifs_meuble') {
        comparer(libelle(prefixe, cle), (avant?.[cle] as Record<string, unknown>) ?? {}, valeur as Record<string, unknown>)
        continue
      }
      if (cle.startsWith('prime_validation')) continue
      if (!egal(avant?.[cle], valeur)) diffs.push({ champ: libelle(prefixe, cle), avant: lisible(avant?.[cle]), apres: lisible(valeur) })
    }
  }
  for (const [cle, valeur] of Object.entries(corps)) {
    if (cle === 'localisation' && valeur && typeof valeur === 'object') comparer('Localisation', bien.localisation as Record<string, unknown>, valeur as Record<string, unknown>)
    else if (cle === 'amenites' && valeur && typeof valeur === 'object') comparer('', bien.amenites as Record<string, unknown>, valeur as Record<string, unknown>)
    else if ((cle === 'details_guesthouse' || cle === 'details_salle_fete') && valeur && typeof valeur === 'object') comparer('Détails', bien[cle] as Record<string, unknown>, valeur as Record<string, unknown>)
    else if (cle === 'pieces' && Array.isArray(valeur)) {
      const avant = Array.isArray(bien.pieces) ? bien.pieces.length : 0
      if (avant !== valeur.length) diffs.push({ champ: 'Pièces', avant: String(avant), apres: String(valeur.length) })
    } else if (!egal(bien[cle], valeur)) diffs.push({ champ: libelle('', cle), avant: lisible(bien[cle]), apres: lisible(valeur) })
  }
  return diffs
}
