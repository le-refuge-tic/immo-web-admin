/**
 * Lot 1 — file d'envoi des médias d'un bien (logique pure, sans React).
 * Fichier identique dans immo-web-admin et immo-web-user (src/shared/uploads).
 *
 * Ordre : la première photo (couverture) part seule, puis les autres photos
 * (2 envois en parallèle au plus), puis la vidéo. Chaque fichier a droit à
 * 2 réessais automatiques.
 */

export type GenreMedia = 'photo' | 'video'
export type StatutElement = 'attente' | 'en_cours' | 'ok' | 'echec'

export interface ElementEnvoi {
  id: string
  genre: GenreMedia
  fichier: Blob
  nom: string
  statut: StatutElement
  essais: number
  erreur?: string
}

export interface LotEnvoi {
  id: string
  /** Compte qui a lancé l'envoi : jamais repris par un autre compte. */
  utilisateurId: number
  bienId: number
  /** « Villa Fidjrossè » : affiché dans l'indicateur et les toasts. */
  libelle: string
  /** Page vers laquelle renvoyer pour compléter les photos. */
  lien?: string
  elements: ElementEnvoi[]
  creeLe: number
}

export const CONCURRENCE_MAX = 2
/** 1 essai + 2 réessais automatiques. */
export const ESSAIS_MAX = 3

export type Envoyeur = (bienId: number, element: ElementEnvoi) => Promise<void>

export interface Avancement {
  faits: number
  total: number
  echecs: number
  enCours: boolean
}

export function avancement(lot: LotEnvoi): Avancement {
  const total = lot.elements.length
  const faits = lot.elements.filter(e => e.statut === 'ok').length
  const echecs = lot.elements.filter(e => e.statut === 'echec').length
  const enCours = lot.elements.some(e => e.statut === 'attente' || e.statut === 'en_cours')
  return { faits, total, echecs, enCours }
}

let compteur = 0
const nouvelId = (prefixe: string) => `${prefixe}-${Date.now().toString(36)}-${(compteur++).toString(36)}`

export function creerLot(params: {
  utilisateurId: number
  bienId: number
  libelle: string
  lien?: string
  photos: readonly Blob[]
  video?: Blob | null
}): LotEnvoi {
  const nomDe = (b: Blob, defaut: string) => (b instanceof File && b.name ? b.name : defaut)
  const elements: ElementEnvoi[] = [
    ...params.photos.map((f, i) => ({
      id: nouvelId('p'), genre: 'photo' as const, fichier: f, nom: nomDe(f, `photo-${i + 1}.jpg`), statut: 'attente' as const, essais: 0,
    })),
    ...(params.video
      ? [{ id: nouvelId('v'), genre: 'video' as const, fichier: params.video, nom: nomDe(params.video, 'video.mp4'), statut: 'attente' as const, essais: 0 }]
      : []),
  ]
  return { id: nouvelId('lot'), utilisateurId: params.utilisateurId, bienId: params.bienId, libelle: params.libelle, lien: params.lien, elements, creeLe: Date.now() }
}

/** Remet en attente les éléments échoués (ou interrompus par un rechargement). */
export function preparerReprise(lot: LotEnvoi): LotEnvoi {
  return {
    ...lot,
    elements: lot.elements.map(e =>
      e.statut === 'ok' ? e : { ...e, statut: 'attente' as const, essais: 0, erreur: undefined },
    ),
  }
}

function messageErreur(err: unknown): string {
  const e = err as { response?: { data?: { message?: unknown } }; message?: unknown }
  const m = e?.response?.data?.message ?? e?.message
  if (Array.isArray(m)) return m.join(' ')
  return typeof m === 'string' && m ? m : 'Envoi impossible'
}

/** Erreur définitive (fichier refusé par l'API) : inutile de réessayer. */
function estDefinitive(err: unknown): boolean {
  const status = (err as { response?: { status?: number } })?.response?.status
  return status === 400 || status === 403 || status === 404 || status === 413 || status === 415
}

/**
 * Envoie les éléments en attente du lot. `onMaj` reçoit une copie du lot à
 * chaque changement d'état (jamais l'objet d'origine modifié).
 */
export async function executerLot(
  depart: LotEnvoi,
  envoyer: Envoyeur,
  onMaj: (lot: LotEnvoi) => void,
  options: {
    concurrence?: number
    essaisMax?: number
    pause?: (essai: number) => Promise<void>
    /** Vrai après une déconnexion : plus aucun fichier ne part. */
    annule?: () => boolean
  } = {},
): Promise<LotEnvoi> {
  const concurrence = options.concurrence ?? CONCURRENCE_MAX
  const essaisMax = options.essaisMax ?? ESSAIS_MAX
  const pause = options.pause ?? ((essai: number) => new Promise<void>(r => setTimeout(r, 1000 * essai)))
  const annule = options.annule ?? (() => false)
  let lot = depart

  const maj = (id: string, changement: Partial<ElementEnvoi>) => {
    lot = { ...lot, elements: lot.elements.map(e => (e.id === id ? { ...e, ...changement } : e)) }
    onMaj(lot)
  }

  const traiter = async (id: string) => {
    for (;;) {
      const el = lot.elements.find(e => e.id === id)
      if (!el || annule()) return
      maj(id, { statut: 'en_cours', essais: el.essais + 1 })
      try {
        await envoyer(lot.bienId, el)
        maj(id, { statut: 'ok', erreur: undefined })
        return
      } catch (err) {
        const essais = el.essais + 1
        if (estDefinitive(err) || essais >= essaisMax) {
          maj(id, { statut: 'echec', erreur: messageErreur(err) })
          return
        }
        maj(id, { statut: 'attente' })
        await pause(essais)
      }
    }
  }

  const enAttente = (genre: GenreMedia) =>
    lot.elements.filter(e => e.genre === genre && e.statut === 'attente').map(e => e.id)

  const photos = enAttente('photo')
  // La couverture d'abord, seule : elle reste la première photo du bien.
  const couverture = lot.elements.find(e => e.genre === 'photo')?.id
  const file = photos.filter(id => id !== couverture)
  if (couverture && photos.includes(couverture)) {
    await traiter(couverture)
    // Couverture refusée : les autres photos attendent, sinon l'une d'elles deviendrait
    // la couverture du bien. « Réessayer » renverra la couverture en premier.
    if (lot.elements.find(e => e.id === couverture)?.statut === 'echec') {
      for (const id of [...file, ...enAttente('video')]) maj(id, { statut: 'echec', erreur: 'En attente de la photo de couverture' })
      return lot
    }
  }

  const travailleurs = Array.from({ length: Math.min(concurrence, file.length) }, async () => {
    for (let id = file.shift(); id; id = file.shift()) await traiter(id)
  })
  await Promise.all(travailleurs)

  for (const id of enAttente('video')) await traiter(id)
  return lot
}
