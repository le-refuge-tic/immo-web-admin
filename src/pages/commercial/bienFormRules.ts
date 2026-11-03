export type BienTransaction = 'location' | 'vente'

export function getPriceFieldLabel(transaction: BienTransaction): string {
  return transaction === 'location' ? 'Loyer mensuel (FCFA)' : 'Prix de vente (FCFA)'
}

export function shouldShowLocationSpecificFields(transaction: BienTransaction): boolean {
  return transaction === 'location'
}
