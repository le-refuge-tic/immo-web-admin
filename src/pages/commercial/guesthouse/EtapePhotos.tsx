import type { ReactNode } from 'react'
import SelecteurMedias from './SelecteurMedias'

type Props = {
  photos: File[]
  setPhotos: (p: File[]) => void
  video: File | null
  setVideo: (v: File | null) => void
  signaler: (message: string) => void
  /** Lot 3 — récapitulatif par sections, construit par la page. */
  recap: ReactNode
}

export default function EtapePhotos({ photos, setPhotos, video, setVideo, signaler, recap }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SelecteurMedias photos={photos} setPhotos={setPhotos} video={video} setVideo={setVideo} signaler={signaler}
        conseilPhotos="Façade, chambres, salon, cuisine, salle de bain, garage." />
      {recap}
    </div>
  )
}
