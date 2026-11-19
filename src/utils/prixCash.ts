/**
 * Lot 11 — prix cash des terrains en vente. Le prix du bien est le « prix normal » (paiement
 * échelonné) ; le prix cash, facultatif, est inférieur et réservé au paiement comptant.
 * Règles identiques à celles du backend (`src/biens/prix-cash.ts`).
 */

export const PRIX_CASH_MIN = 100

type BienPourPrixCash = { type?: string | null; transaction?: string | null }

/** Le prix cash n'existe que pour un terrain mis en vente. */
export function estTerrainEnVente(bien: BienPourPrixCash): boolean {
  return bien.type === 'terrain' && bien.transaction === 'vente'
}

/** Message d'erreur si le prix cash est refusé, sinon null. Un prix cash absent est toujours valide. */
export function erreurPrixCash(prixNormal: number | null | undefined, prixCash: number | null | undefined): string | null {
  if (prixCash == null) return null
  if (prixCash < PRIX_CASH_MIN) return `Le prix cash doit être d'au moins ${PRIX_CASH_MIN} FCFA.`
  if (prixNormal != null && prixCash >= prixNormal) return 'Le prix cash doit être inférieur au prix normal.'
  return null
}

export interface ReductionCash {
  montant: number
  pourcentage: number
}

/** Remise du prix cash sur le prix normal, ou null si le prix cash n'est pas valide. */
export function reductionCash(prixNormal: number | null | undefined, prixCash: number | null | undefined): ReductionCash | null {
  if (prixNormal == null || prixCash == null || prixNormal <= 0) return null
  if (erreurPrixCash(prixNormal, prixCash)) return null
  return { montant: prixNormal - prixCash, pourcentage: Math.round((1 - prixCash / prixNormal) * 100) }
}

/** « soit −12 % / −300 000 F », ou chaîne vide si le prix cash n'est pas valide. */
export function libelleReductionCash(prixNormal: number | null | undefined, prixCash: number | null | undefined): string {
  const r = reductionCash(prixNormal, prixCash)
  if (!r) return ''
  return `soit −${r.pourcentage} % / −${r.montant.toLocaleString('fr-FR')} F`
}

/** Prix cash d'un bien renvoyé par l'API (colonne numérique parfois en chaîne), ou null s'il n'y en a pas. */
export function prixCashDuBien(bien: BienPourPrixCash & { prix: number | string; prix_cash?: number | string | null }): number | null {
  if (!estTerrainEnVente(bien) || bien.prix_cash == null) return null
  const cash = Number(bien.prix_cash)
  return erreurPrixCash(Number(bien.prix), cash) ? null : cash
}
