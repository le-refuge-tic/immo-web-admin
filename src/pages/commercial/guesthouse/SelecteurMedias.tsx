import { useEffect, useMemo } from 'react'
import { Card, Section } from '../formUi'
import { BLUE } from '../formStyles'
import { PHOTOS_MAX, PHOTOS_MIN, VIDEO_MAX_OCTETS } from './guesthouseForm'

const PHOTO_MAX_OCTETS = 5 * 1024 * 1024
const TYPES_IMAGE = ['image/png', 'image/jpeg', 'image/webp']

type Props = {
  photos: File[]
  setPhotos: (p: File[]) => void
  video: File | null
  setVideo: (v: File | null) => void
  /** Quelles photos prendre, ex. « Façade, chambres, salon… » */
  conseilPhotos: string
  signaler: (message: string) => void
}

/** Photos (4 à 8, la première sert de couverture) et vidéo facultative d'un bien en cours de création. */
export default function SelecteurMedias({ photos, setPhotos, video, setVideo, conseilPhotos, signaler }: Props) {
  const apercus = useMemo(() => photos.map(f => URL.createObjectURL(f)), [photos])
  useEffect(() => () => apercus.forEach(u => URL.revokeObjectURL(u)), [apercus])

  const ajouterPhotos = (liste: FileList | null) => {
    const fichiers = Array.from(liste ?? [])
    const refusees = fichiers.filter(f => !TYPES_IMAGE.includes(f.type) || f.size > PHOTO_MAX_OCTETS)
    const valides = fichiers.filter(f => !refusees.includes(f))
    const place = PHOTOS_MAX - photos.length
    if (refusees.length) signaler(`${refusees.length} fichier(s) ignoré(s) : JPG, PNG ou WebP de 5 Mo au plus.`)
    if (valides.length > place) signaler(`${PHOTOS_MAX} photos au maximum : ${valides.length - place} photo(s) non ajoutée(s).`)
    setPhotos([...photos, ...valides.slice(0, Math.max(place, 0))])
  }

  const choisirVideo = (f: File | undefined) => {
    if (!f) return
    if (f.type !== 'video/mp4' || f.size > VIDEO_MAX_OCTETS) {
      signaler('Vidéo refusée : une seule vidéo MP4 de 30 Mo au plus.')
      return
    }
    setVideo(f)
  }

  const deplacer = (i: number, delta: number) => {
    const j = i + delta
    if (j < 0 || j >= photos.length) return
    const copie = [...photos]
    ;[copie[i], copie[j]] = [copie[j], copie[i]]
    setPhotos(copie)
  }

  return (
    <>
      <Card>
        <Section title={`Photos (${photos.length}/${PHOTOS_MAX}, minimum ${PHOTOS_MIN})`} required />
        <p style={{ fontSize: 12, color: 'var(--c-muted)', marginTop: 0 }}>
          {conseilPhotos} La première photo sert de couverture.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
          {apercus.map((url, i) => (
            <figure key={url} style={{ margin: 0, position: 'relative', borderRadius: 10, overflow: 'hidden', border: `2px solid ${i === 0 ? BLUE : 'var(--c-border)'}` }}>
              <img src={url} alt={`Photo ${i + 1}`} style={{ width: '100%', height: 100, objectFit: 'cover', display: 'block' }} />
              <figcaption style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 6px', fontSize: 11, background: 'var(--c-card)' }}>
                <span>{i === 0 ? 'Couverture' : `#${i + 1}`}</span>
                <span style={{ display: 'flex', gap: 4 }}>
                  <button type="button" aria-label="Avancer" disabled={i === 0} onClick={() => deplacer(i, -1)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>◀</button>
                  <button type="button" aria-label="Reculer" disabled={i === photos.length - 1} onClick={() => deplacer(i, 1)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>▶</button>
                  <button type="button" aria-label={`Supprimer la photo ${i + 1}`} onClick={() => setPhotos(photos.filter((_, j) => j !== i))} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--s-red)' }}>✕</button>
                </span>
              </figcaption>
            </figure>
          ))}
          {photos.length < PHOTOS_MAX && (
            <label style={{ minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, border: `2px dashed ${BLUE}`, color: BLUE, fontWeight: 700, fontSize: 13, cursor: 'pointer', textAlign: 'center' }}>
              + Ajouter des photos
              <input type="file" multiple accept={TYPES_IMAGE.join(',')} style={{ display: 'none' }}
                onChange={e => { ajouterPhotos(e.target.files); e.target.value = '' }} />
            </label>
          )}
        </div>
      </Card>

      <Card>
        <Section title="Vidéo (facultative)" />
        {video ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
            <span>{video.name} · {(video.size / 1024 / 1024).toFixed(1)} Mo</span>
            <button type="button" onClick={() => setVideo(null)} style={{ border: 'none', background: 'none', color: 'var(--s-red)', fontWeight: 700, cursor: 'pointer' }}>Retirer</button>
          </div>
        ) : (
          <label style={{ fontSize: 13, color: BLUE, fontWeight: 700, cursor: 'pointer' }}>
            + Ajouter une vidéo (MP4, 30 Mo au plus)
            <input type="file" accept="video/mp4" style={{ display: 'none' }}
              onChange={e => { choisirVideo(e.target.files?.[0]); e.target.value = '' }} />
          </label>
        )}
      </Card>
    </>
  )
}
