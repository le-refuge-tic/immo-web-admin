export function primeValidationCommerciale(
  type: string,
  sousType: string | null | undefined,
  transaction: string,
  prix: number,
  amenites: Record<string, unknown>,
): number {
  const t = (type ?? '').toLowerCase();
  const s = (sousType ?? '').toLowerCase();
  const tr = transaction.toLowerCase();
  const p = Number(prix ?? 0);
  const meuble = amenites.tarifs_meuble != null || amenites.meuble === true;

  if (t === 'terrain') {
    if (tr !== 'vente') return 2000;
    if (p <= 3_000_000) return 1500;
    if (p <= 10_000_000) return 3000;
    if (p <= 25_000_000) return 5000;
    return 7500;
  }
  if (t === 'guesthouse' || t === 'salle_fete') return 2000;
  if (s === 'boutique') return 1000;
  if (s === 'bureau') return 1500;
  if (s === 'entrepot' || s === 'entrepôt') return 2000;
  if (s === 'local_commercial' || s === 'showroom' || s === 'guesthouse') return 2000;

  if (tr === 'vente') {
    const complexe = s.includes('complexe') || s.includes('rapport') ||
      s.includes('immobilier') || s.includes('commercial');
    if (complexe) return p < 10_000_000 ? 6000 : 10000;
    if (p < 20_000_000 && s.includes('appartement')) return 3000;
    if (s.includes('villa') || s.includes('duplex') || s.includes('maison')) {
      return p <= 50_000_000 ? 5000 : 7500;
    }
    return 3000;
  }

  if (s.includes('villa') || s.includes('maison')) return 2000 + (meuble ? 500 : 0);

  const chambres = Number(amenites.chambres ?? 0);
  const standing = String(amenites.standing ?? '').toLowerCase();
  const hautStanding = standing === 'haut_standing_vip' ||
    standing === 'sanitaire_staffe' || standing === 'sanitaire_semi_staffe';
  if (s.includes('appartement') && (chambres >= 3 || hautStanding)) return 2000;
  if (s.includes('appartement') && chambres === 2) return 1500 + (meuble ? 500 : 0);

  if (s === 'duplex' || s === 'grande_propriete' || s === 'grande propriété') {
    return 5000 + (meuble ? 500 : 0);
  }
  return 1000 + (meuble ? 500 : 0);
}
