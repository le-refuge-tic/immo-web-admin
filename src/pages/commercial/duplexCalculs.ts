export type TarifMeuble = {
  prix_long_sejour?: string
  prix_sejour_restreint?: string
  prix_heure?: string
  autres?: Array<{ label?: string; prix?: string }>
}

export const prixPrincipalDuplex = (
  tarif: TarifMeuble,
  parsePrix: (valeur: string) => number | undefined,
): number => {
  const candidats = [
    tarif.prix_long_sejour,
    tarif.prix_sejour_restreint,
    tarif.prix_heure,
    tarif.autres?.[0]?.prix,
  ]

  for (const candidat of candidats) {
    const prix = candidat ? parsePrix(candidat) : undefined
    if (prix !== undefined && prix > 0) return prix
  }

  return 0
}

