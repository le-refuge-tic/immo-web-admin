import { apiMessage } from './apiMessage'

/** Taille maximale d'une vidéo d'annonce, alignée sur le backend (POST …/video). */
export const VIDEO_MAX_MO = 50

/** Message de refus d'un fichier vidéo avant envoi, ou null s'il est acceptable. */
export function erreurFichierVideo(f: Pick<File, 'type' | 'size'>): string | null {
  if (f.type === 'video/mp4' && f.size <= VIDEO_MAX_MO * 1024 * 1024) return null
  return `Vidéo refusée : MP4 uniquement, ${VIDEO_MAX_MO} Mo au plus (ce fichier fait ${(f.size / 1024 / 1024).toFixed(1)} Mo).`
}

/**
 * Raison d'un échec d'envoi de vidéo. Le message brut du serveur est gardé
 * (ex. refus du stockage) : apiMessage le masquerait derrière un texte générique.
 */
export function raisonEchecVideo(err: unknown): string | undefined {
  const response = (err as { response?: { status?: number; data?: { message?: unknown } } })?.response
  if (response?.status === 413) return `vidéo de plus de ${VIDEO_MAX_MO} Mo`
  const brut = response?.data?.message
  return (typeof brut === 'string' && brut.trim()) || apiMessage(err)
}
