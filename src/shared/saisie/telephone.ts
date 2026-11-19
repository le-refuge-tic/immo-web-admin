/**
 * Lot 15 — numéro béninois : 10 chiffres commençant par 01, indicatif +229.
 * Même règle que le backend (`common/telephone.util.ts`) et l'app mobile.
 */

export const LONGUEUR_TELEPHONE = 10
export const INDICATIF_BENIN = '+229'
export const PLACEHOLDER_TELEPHONE = '01XXXXXXXX'
export const MESSAGE_TELEPHONE = 'Numéro invalide : saisissez 10 chiffres commençant par 01 (ex. 01 97 00 00 00).'

/** Chiffres nationaux, indicatif retiré (+229, 00229, 229 devant 10 chiffres), sans tronquer. */
function national(saisie: string): string {
  const c = saisie.replace(/\D/g, '')
  if (c.startsWith('00229') && c.length > LONGUEUR_TELEPHONE) return c.slice(5)
  if (c.startsWith('229') && c.length > LONGUEUR_TELEPHONE) return c.slice(3)
  return c
}

/** Saisie ou collage → au plus 10 chiffres nationaux (espaces, points, tirets, lettres retirés). */
export const saisieTelephone = (saisie: string): string => national(saisie).slice(0, LONGUEUR_TELEPHONE)

/** Numéro national valide (01 + 8 chiffres, longueur exacte), quelle que soit la forme saisie. */
export const estTelephoneBenin = (valeur: string | null | undefined): boolean => /^01\d{8}$/.test(national(valeur ?? ''))

/** Forme canonique envoyée à l'API : +229 suivi des 10 chiffres. */
export function telephoneCanonique(valeur: string): string {
  const n = national(valeur)
  return /^01\d{8}$/.test(n) ? `${INDICATIF_BENIN}${n}` : n
}
