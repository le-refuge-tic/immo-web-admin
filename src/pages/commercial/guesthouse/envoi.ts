import { guesthouseApi } from '../../../api/guesthouse'
import { postBien } from '../../../api/postBien'

export type ResultatEnvoi = { bienId: number; photosEchouees: number; videoEchouee: boolean }

/**
 * Crée la guesthouse, puis envoie les photos une à une (dans l'ordre choisi, la
 * première sert de couverture) et la vidéo. Une erreur de création remonte à
 * l'appelant ; les échecs de médias sont comptés et signalés, jamais ignorés.
 */
export async function envoyerGuesthouse(
  payload: unknown,
  photos: File[],
  video: File | null,
  onProgres: (pourcent: number) => void,
): Promise<ResultatEnvoi> {
  const bien = await guesthouseApi.create(payload)
  const total = photos.length + (video ? 1 : 0)
  let faits = 0
  let photosEchouees = 0
  for (const photo of photos) {
    try {
      await postBien.uploadPhoto(bien.id, photo)
    } catch {
      photosEchouees += 1
    }
    faits += 1
    onProgres(Math.round((faits / total) * 100))
  }
  let videoEchouee = false
  if (video) {
    try {
      await postBien.uploadVideo(bien.id, video)
    } catch {
      videoEchouee = true
    }
    onProgres(100)
  }
  return { bienId: bien.id, photosEchouees, videoEchouee }
}
