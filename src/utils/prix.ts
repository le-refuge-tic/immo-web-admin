/**
 * Affichage d'un prix avec son unité. L'API renvoie `unite_prix` (nuit / mois / total)
 * pour chaque bien ; à défaut (ancienne réponse), l'unité est déduite du type.
 */
type BienPrix = { prix?: number | string | null; unite_prix?: string | null; type?: string; transaction?: string }

export function suffixeUnite(b: BienPrix): string {
  const unite = b.unite_prix ?? (b.type === 'guesthouse' ? 'nuit' : b.transaction === 'location' ? 'mois' : 'total')
  if (unite === 'nuit') return ' / nuit'
  if (unite === 'mois') return ' / mois'
  return ''
}

export function prixAvecUnite(b: BienPrix): string {
  return `${Number(b.prix ?? 0).toLocaleString('fr-FR')} FCFA${suffixeUnite(b)}`
}

/** Libellé du prix : « Prix de vente », « Prix par nuit » ou « Loyer mensuel ». */
export function libellePrix(b: BienPrix): string {
  const s = suffixeUnite(b)
  if (s === ' / nuit') return 'Prix par nuit'
  if (s === ' / mois') return 'Loyer mensuel'
  return 'Prix de vente'
}
