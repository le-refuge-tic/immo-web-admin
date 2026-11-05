/**
 * Affichage d'un prix avec son unité. L'API renvoie `unite_prix` (nuit / mois / total / heure)
 * pour chaque bien ; à défaut (ancienne réponse), l'unité est déduite du type.
 * Une salle de fêtes se loue à l'heure : son prix couvre `details_salle_fete.duree_heures`
 * heures (« 45 000 FCFA / 8 h »).
 */
type BienPrix = {
  prix?: number | string | null
  unite_prix?: string | null
  type?: string
  transaction?: string
  details_salle_fete?: { duree_heures?: number | null } | null
}

function unite(b: BienPrix): string {
  if (b.unite_prix) return b.unite_prix
  if (b.type === 'guesthouse') return 'nuit'
  if (b.type === 'salle_fete') return 'heure'
  return b.transaction === 'location' ? 'mois' : 'total'
}

/** Heures couvertes par le prix d'une salle (1 si inconnu). */
const heuresCouvertes = (b: BienPrix) => Math.max(1, Number(b.details_salle_fete?.duree_heures ?? 1))

export function suffixeUnite(b: BienPrix): string {
  const u = unite(b)
  if (u === 'nuit') return ' / nuit'
  if (u === 'mois') return ' / mois'
  if (u === 'heure') {
    const h = heuresCouvertes(b)
    return h > 1 ? ` / ${h} h` : ' / heure'
  }
  return ''
}

export function prixAvecUnite(b: BienPrix): string {
  return `${Number(b.prix ?? 0).toLocaleString('fr-FR')} FCFA${suffixeUnite(b)}`
}

/** Libellé du prix : « Prix de vente », « Prix par nuit », « Prix pour 8 h » ou « Loyer mensuel ». */
export function libellePrix(b: BienPrix): string {
  const u = unite(b)
  if (u === 'nuit') return 'Prix par nuit'
  if (u === 'mois') return 'Loyer mensuel'
  if (u === 'heure') {
    const h = heuresCouvertes(b)
    return h > 1 ? `Prix pour ${h} h` : 'Prix à l’heure'
  }
  return 'Prix de vente'
}

type TarifsMeuble = {
  prix_long_sejour?: number | string | null
  prix_sejour_restreint?: number | string | null
  prix_heure?: number | string | null
  autres?: { label?: string; prix?: number | string | null }[]
}

/** Tarifs d'un meublé, dans l'ordre du prix principal : mois, nuit, heure, puis personnalisés. */
export function lignesTarifsMeuble(amenites: { tarifs_meuble?: TarifsMeuble | null } | null | undefined): { label: string; montant: number; unite: string }[] {
  const t = amenites?.tarifs_meuble
  if (!t) return []
  return [
    { label: 'Long séjour', montant: Number(t.prix_long_sejour ?? 0), unite: ' / mois' },
    { label: 'Court séjour', montant: Number(t.prix_sejour_restreint ?? 0), unite: ' / nuit' },
    { label: 'À l’heure', montant: Number(t.prix_heure ?? 0), unite: ' / heure' },
    ...(t.autres ?? []).map(a => ({ label: a.label?.trim() || 'Autre tarif', montant: Number(a.prix ?? 0), unite: '' })),
  ].filter(l => l.montant > 0)
}
