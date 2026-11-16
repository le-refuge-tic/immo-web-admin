/**
 * Lot 7 — ce qui empêche de publier un bien : un seul comptage des photos (bien + pièces,
 * sans doublon) et le minimum du référentiel, comme l'API (admin.service moderateBien).
 * Code partagé : identique dans les deux fronts.
 */
import { PHOTOS_MIN_CLASSIQUE, PHOTOS_MIN_GUESTHOUSE_SALLE } from './referentielTypes'

interface PhotoLue { id?: number | string; url?: string }
interface BienLu {
  type?: string
  photos?: readonly PhotoLue[] | null
  pieces?: readonly { photos?: readonly PhotoLue[] | null }[] | null
  details_guesthouse?: unknown
  details_salle_fete?: unknown
}

/** Photos du bien et de ses pièces ; une photo de pièce déjà listée avec le bien ne compte qu'une fois. */
export function photosDuBien<P extends PhotoLue>(b: { photos?: readonly P[] | null; pieces?: readonly { photos?: readonly P[] | null }[] | null }): P[] {
  const vues = new Set<string>()
  const toutes = [...(b.photos ?? []), ...(b.pieces ?? []).flatMap(p => p?.photos ?? [])]
  return toutes.filter(p => {
    const cle = p.id != null ? `id:${p.id}` : `url:${p.url ?? ''}`
    if (vues.has(cle)) return false
    vues.add(cle)
    return true
  })
}

export const photosMinimumPourType = (type: string | undefined): number =>
  type === 'guesthouse' || type === 'salle_fete' ? PHOTOS_MIN_GUESTHOUSE_SALLE : PHOTOS_MIN_CLASSIQUE

const DETAILS_OBLIGATOIRES: Record<string, { cle: 'details_guesthouse' | 'details_salle_fete'; manque: string }> = {
  guesthouse: { cle: 'details_guesthouse', manque: 'les détails guesthouse (à compléter dans « Modifier »)' },
  salle_fete: { cle: 'details_salle_fete', manque: 'les détails de la salle (à compléter dans « Modifier »)' },
}

/** Ce qui manque pour publier ; vide si rien ne bloque. */
export function manquesApprobation(b: BienLu): string[] {
  const manques: string[] = []
  const details = b.type ? DETAILS_OBLIGATOIRES[b.type] : undefined
  if (details && !b[details.cle]) manques.push(details.manque)
  const n = photosDuBien(b).length
  const min = photosMinimumPourType(b.type)
  if (n < min) manques.push(`au moins ${min} photos (${n} actuellement)`)
  return manques
}
