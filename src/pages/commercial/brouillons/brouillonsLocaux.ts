/**
 * Lot 3 — brouillons des formulaires de publication : plusieurs par type, chacun avec un
 * identifiant, une date, l'étape atteinte et un libellé tiré du nom saisi. Stockés dans le
 * navigateur (localStorage) ; le lot 6 les synchronisera côté serveur.
 * Logique pure, stockage injectable : testée dans brouillonsLocaux.test.ts.
 */

export type FamilleBrouillon = 'bien' | 'guesthouse' | 'salle_fete'

export interface Brouillon<T = unknown> {
  id: string
  famille: FamilleBrouillon
  libelle: string
  /** Index de l'étape atteinte (0 = première). */
  etape: number
  updatedAt: number
  donnees: T
}

/** Résumé affiché dans les listes (« Mes annonces », menu « Brouillons »). */
export interface ResumeBrouillon {
  id: string
  famille: FamilleBrouillon
  libelle: string
  etape: number
  updatedAt: number
  /** Page qui reprend ce brouillon. */
  lien: string
}

export type Stockage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

/** Au-delà, les plus anciens sont oubliés. */
export const BROUILLONS_MAX = 20

const CLES: Record<Exclude<FamilleBrouillon, 'bien'>, { liste: string; ancienne: string }> = {
  guesthouse: { liste: 'publier_guesthouse_drafts', ancienne: 'publier_guesthouse_draft' },
  salle_fete: { liste: 'publier_salle_fete_drafts', ancienne: 'publier_salle_fete_draft' },
}
/** Brouillons du formulaire de bien classique (format existant de PublierBienPage). */
export const CLE_BIENS = 'publier_bien_drafts'

export const LIBELLES_FAMILLE: Record<FamilleBrouillon, string> = {
  bien: 'Bien',
  guesthouse: 'Guesthouse',
  salle_fete: 'Salle de fêtes',
}

const PAGES: Record<FamilleBrouillon, string> = {
  bien: '/publier-bien',
  guesthouse: '/publier-guesthouse',
  salle_fete: '/publier-salle-fete',
}

export const lienBrouillon = (famille: FamilleBrouillon, id: string) => `${PAGES[famille]}?draft=${encodeURIComponent(id)}`

let compteur = 0
export function nouvelIdBrouillon(): string {
  compteur += 1
  return `b-${Date.now().toString(36)}-${compteur.toString(36)}`
}

function lireJson(s: Stockage, cle: string): unknown {
  try { return JSON.parse(s.getItem(cle) ?? 'null') } catch { return null }
}

function estBrouillon(v: unknown): v is Brouillon {
  const b = v as Partial<Brouillon> | null
  return !!b && typeof b.id === 'string' && typeof b.updatedAt === 'number' && typeof b.donnees === 'object' && b.donnees !== null
}

/**
 * Brouillons guesthouse ou salle de fêtes, du plus récent au plus ancien. L'ancien brouillon
 * unique (`publier_guesthouse_draft` : { form, etape }) est repris une fois, avec un vrai libellé.
 */
export function listerBrouillons<T>(famille: Exclude<FamilleBrouillon, 'bien'>, libelleDe: (donnees: T) => string, s: Stockage = localStorage): Brouillon<T>[] {
  const { liste, ancienne } = CLES[famille]
  const brut = lireJson(s, liste)
  let brouillons = (Array.isArray(brut) ? brut : []).filter(estBrouillon) as Brouillon<T>[]
  const vieux = lireJson(s, ancienne) as { form?: T; etape?: number } | null
  if (vieux?.form) {
    brouillons = [{
      id: nouvelIdBrouillon(), famille, libelle: libelleDe(vieux.form), etape: vieux.etape ?? 0,
      updatedAt: Date.now(), donnees: vieux.form,
    }, ...brouillons]
    try { s.setItem(liste, JSON.stringify(brouillons)); s.removeItem(ancienne) } catch { /* stockage plein */ }
  }
  return [...brouillons].sort((a, b) => b.updatedAt - a.updatedAt)
}

export function lireBrouillon<T>(famille: Exclude<FamilleBrouillon, 'bien'>, id: string, libelleDe: (d: T) => string, s: Stockage = localStorage): Brouillon<T> | null {
  return listerBrouillons(famille, libelleDe, s).find(b => b.id === id) ?? null
}

/** Crée ou remplace le brouillon `b.id` ; garde les BROUILLONS_MAX plus récents. */
export function enregistrerBrouillon<T>(b: Brouillon<T>, libelleDe: (d: T) => string, s: Stockage = localStorage): void {
  if (b.famille === 'bien') return
  const autres = listerBrouillons(b.famille, libelleDe, s).filter(x => x.id !== b.id)
  const suivants = [b, ...autres].sort((x, y) => y.updatedAt - x.updatedAt).slice(0, BROUILLONS_MAX)
  try { s.setItem(CLES[b.famille].liste, JSON.stringify(suivants)) } catch { /* stockage plein ou désactivé */ }
}

export function supprimerBrouillon(famille: FamilleBrouillon, id: string, s: Stockage = localStorage): void {
  const cle = famille === 'bien' ? CLE_BIENS : CLES[famille].liste
  const brut = lireJson(s, cle)
  if (!Array.isArray(brut)) return
  try { s.setItem(cle, JSON.stringify(brut.filter((b: { id?: string }) => b?.id !== id))) } catch { /* rien */ }
}

/** Libellé d'un brouillon guesthouse ou salle : le nom saisi, sinon le type. */
export const libelleParNom = (famille: FamilleBrouillon) => (d: { nom?: string }) =>
  (d?.nom ?? '').trim() || LIBELLES_FAMILLE[famille]

/** Tous les brouillons, toutes familles, du plus récent au plus ancien (« Mes annonces »). */
export function tousLesBrouillons(s: Stockage = localStorage): ResumeBrouillon[] {
  const resume = (b: Brouillon): ResumeBrouillon => ({
    id: b.id, famille: b.famille, libelle: b.libelle, etape: b.etape, updatedAt: b.updatedAt, lien: lienBrouillon(b.famille, b.id),
  })
  const dedies = (['guesthouse', 'salle_fete'] as const).flatMap(f =>
    listerBrouillons(f, libelleParNom(f), s).map(b => resume({ ...b, famille: f })))
  const brut = lireJson(s, CLE_BIENS)
  const biens = (Array.isArray(brut) ? brut : [])
    .filter((b: { id?: unknown }) => typeof b?.id === 'string')
    .map((b: { id: string; label?: string; updatedAt?: number; step?: number }) => ({
      id: b.id, famille: 'bien' as const, libelle: b.label || 'Brouillon sans titre',
      etape: typeof b.step === 'number' ? b.step : 0, updatedAt: b.updatedAt ?? 0, lien: lienBrouillon('bien', b.id),
    }))
  return [...dedies, ...biens].sort((a, b) => b.updatedAt - a.updatedAt)
}
