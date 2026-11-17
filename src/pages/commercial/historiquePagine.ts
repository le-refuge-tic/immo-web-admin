import type { FiltresPortefeuille } from '../../api/getWallet'
import { bornesPeriode } from '../../utils/historiqueTransactions'

/** Lot 16 — historique du portefeuille chargé par pages (la plus récente d'abord). */

/** Ajoute une page à la liste affichée, sans doublon (un nouveau mouvement décale les pages). */
export function ajouterPage<T extends { id: number }>(deja: readonly T[], page: readonly T[]): T[] {
  const vus = new Set(deja.map(m => m.id))
  return [...deja, ...page.filter(m => !vus.has(m.id))]
}

export const resteAPrendre = (affiches: number, total: number) => affiches < total

/** Lot 17 — choix de l'utilisateur sur son historique personnel. */
export type ChoixHistorique = {
  periode: 'tout' | '7j' | 'mois' | 'mois_precedent'
  sens: 'tous' | 'credit' | 'debit'
  tri: 'recent' | 'ancien' | 'montant_desc' | 'montant_asc'
}

export const CHOIX_PAR_DEFAUT: ChoixHistorique = { periode: 'tout', sens: 'tous', tri: 'recent' }

const TRIS: Record<ChoixHistorique['tri'], Pick<FiltresPortefeuille, 'tri' | 'ordre'>> = {
  recent: { tri: 'date', ordre: 'desc' },
  ancien: { tri: 'date', ordre: 'asc' },
  montant_desc: { tri: 'montant', ordre: 'desc' },
  montant_asc: { tri: 'montant', ordre: 'asc' },
}

/** Paramètres envoyés à `GET /wallets/me/transactions` (rien pour les valeurs par défaut). */
export function filtresPortefeuille(c: ChoixHistorique, maintenant?: Date): FiltresPortefeuille {
  const f: FiltresPortefeuille = { ...bornesPeriode(c.periode, maintenant) }
  if (c.sens !== 'tous') f.sens = c.sens
  if (c.tri !== 'recent') Object.assign(f, TRIS[c.tri])
  return f
}

/** Le suivi automatique n'insère en tête que si l'ordre affiché est « plus récent d'abord ». */
export const suiviEnTete = (c: ChoixHistorique) => c.tri === 'recent'
