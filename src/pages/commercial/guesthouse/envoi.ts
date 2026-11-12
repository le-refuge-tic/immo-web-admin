import { guesthouseApi } from '../../../api/guesthouse'
import type { DemandeEnvoi } from '../../../shared/uploads/useGestionEnvois'

export type Medias = { libelle: string; photos: File[]; video: File | null }

/**
 * Lot 1 — crée le bien (guesthouse, salle de fêtes, bien classique…) avec
 * `creer`, puis confie photos et vidéo au gestionnaire d'envois : le
 * commercial n'attend plus la fin de l'envoi pour quitter la page. Une erreur
 * de création remonte à l'appelant et rien n'est envoyé.
 */
export async function envoyerBien(
  creer: (payload: unknown) => Promise<{ id: number }>,
  payload: unknown,
  medias: Medias,
  demarrer: (demande: DemandeEnvoi) => void,
): Promise<number> {
  const bien = await creer(payload)
  demarrer({
    bienId: bien.id,
    libelle: medias.libelle,
    lien: `/mes-annonces/${bien.id}/modifier`,
    photos: medias.photos,
    video: medias.video,
  })
  return bien.id
}

export const envoyerGuesthouse = (
  payload: unknown,
  medias: Medias,
  demarrer: (demande: DemandeEnvoi) => void,
): Promise<number> => envoyerBien(guesthouseApi.create, payload, medias, demarrer)
