/**
 * Lot 15 — saisie des nombres : chiffres seulement (frappe et collage), milliers formatés
 * à l'affichage (« 150 000 »), valeur brute sans espace pour l'état et l'API.
 */

export interface OptionsNombre {
  /** Autorise une partie décimale (séparateur « , » ou « . », rendu « . »). */
  decimales?: boolean
  /** Au-delà, la saisie est refusée (l'ancienne valeur reste). */
  max?: number
}

/**
 * Nettoie une saisie : retire tout sauf les chiffres (et un séparateur décimal si permis).
 * « 1 500 F », « -20 », « 1e5 » → « 1500 », « 20 », « 15 ».
 */
export function nettoyerNombre(saisie: string, o: OptionsNombre = {}): string {
  if (!o.decimales) return saisie.replace(/\D/g, '')
  const s = saisie.replace(/,/g, '.').replace(/[^\d.]/g, '')
  const i = s.indexOf('.')
  return i < 0 ? s : `${s.slice(0, i + 1)}${s.slice(i + 1).replace(/\./g, '')}`
}

/** Valeur brute nettoyée, ou `null` si elle dépasse le maximum (saisie à refuser). */
export function saisieNombre(saisie: string, o: OptionsNombre = {}): string | null {
  const brut = nettoyerNombre(saisie, o).replace(/^0+(?=\d)/, '')
  if (o.max != null && brut !== '' && Number(brut) > o.max) return null
  return brut
}

/** « 150000 » → « 150 000 » (espace insécable fine absente : simple espace, lisible partout). */
export function formaterMilliers(brut: string | number | null | undefined): string {
  if (brut == null || brut === '') return ''
  const [entier, dec] = String(brut).split('.')
  const groupe = entier.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return dec === undefined ? groupe : `${groupe},${dec}`
}

/** Valeur brute → nombre (`null` si vide ou invalide). */
export function lireNombre(brut: string | number | null | undefined): number | null {
  if (brut == null || brut === '') return null
  const n = Number(String(brut).replace(/\s/g, '').replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

/**
 * Position du curseur après reformatage : on garde le même nombre de chiffres à gauche.
 * `avant` = texte affiché saisi, `curseur` = position dans `avant`, `apres` = texte reformaté.
 */
export function curseurApresFormatage(avant: string, curseur: number, apres: string): number {
  const chiffresAGauche = avant.slice(0, curseur).replace(/[^\d.,]/g, '').length
  if (chiffresAGauche === 0) return 0
  let vus = 0
  for (let i = 0; i < apres.length; i++) {
    if (/[\d,]/.test(apres[i])) vus++
    if (vus === chiffresAGauche) return i + 1
  }
  return apres.length
}
