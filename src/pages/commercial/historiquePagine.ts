/** Lot 16 — historique du portefeuille chargé par pages (la plus récente d'abord). */

/** Ajoute une page à la liste affichée, sans doublon (un nouveau mouvement décale les pages). */
export function ajouterPage<T extends { id: number }>(deja: readonly T[], page: readonly T[]): T[] {
  const vus = new Set(deja.map(m => m.id))
  return [...deja, ...page.filter(m => !vus.has(m.id))]
}

export const resteAPrendre = (affiches: number, total: number) => affiches < total
