import { useState } from 'react'
import { useToast } from '../../../context/ToastContext'
import { apiMessage } from '../../../utils/apiMessage'
import { adminPhotos } from '../../../api/adminPhotos'
import { Card, Section } from '../formUi'
import { BLUE } from '../formStyles'
import { PHOTOS_MAX, PHOTOS_MIN } from './guesthouseForm'

export type PhotoBien = { id: number; url: string; is_cover: boolean }

type Props = {
  bienId: number
  photos: PhotoBien[]
  setPhotos: (mise_a_jour: (precedentes: PhotoBien[]) => PhotoBien[]) => void
}

/** Photos d'un bien déjà enregistré (page « Modifier ») : envoi, suppression et choix de la couverture. */
export default function EditeurPhotos({ bienId, photos, setPhotos }: Props) {
  const toast = useToast()
  const [envoiPhoto, setEnvoiPhoto] = useState(false)

  const ajouterPhoto = async (fichiers: FileList | null) => {
    const liste = Array.from(fichiers ?? [])
    const place = PHOTOS_MAX - photos.length
    if (liste.length > place) toast(`${PHOTOS_MAX} photos au maximum : ${liste.length - Math.max(place, 0)} photo(s) non ajoutée(s).`, 'error')
    setEnvoiPhoto(true)
    for (const f of liste.slice(0, Math.max(place, 0))) {
      try {
        const p = await adminPhotos.upload(bienId, f)
        setPhotos(ps => [...ps, p])
      } catch (err) {
        toast(apiMessage(err) ?? `La photo « ${f.name} » n’a pas pu être envoyée.`, 'error')
      }
    }
    setEnvoiPhoto(false)
  }

  const supprimerPhoto = async (id: number) => {
    try {
      await adminPhotos.remove(bienId, id)
      setPhotos(ps => ps.filter(p => p.id !== id))
    } catch (err) {
      toast(apiMessage(err) ?? 'La photo n’a pas pu être supprimée.', 'error')
    }
  }

  const choisirCouverture = async (id: number) => {
    try {
      await adminPhotos.setCover(bienId, id)
      setPhotos(ps => ps.map(p => ({ ...p, is_cover: p.id === id })))
    } catch (err) {
      toast(apiMessage(err) ?? 'La couverture n’a pas pu être changée.', 'error')
    }
  }

  return (
    <Card>
      <Section title={`Photos (${photos.length}/${PHOTOS_MAX}, minimum ${PHOTOS_MIN} pour publier)`} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
        {photos.map(p => (
          <figure key={p.id} style={{ margin: 0, borderRadius: 10, overflow: 'hidden', border: `2px solid ${p.is_cover ? BLUE : 'var(--c-border)'}` }}>
            <img src={p.url} alt="" style={{ width: '100%', height: 100, objectFit: 'cover', display: 'block' }} />
            <figcaption style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 6px', fontSize: 11, background: 'var(--c-card)' }}>
              {p.is_cover ? <span>Couverture</span> : (
                <button type="button" onClick={() => choisirCouverture(p.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: BLUE, fontSize: 11 }}>Couverture</button>
              )}
              <button type="button" aria-label="Supprimer la photo" onClick={() => supprimerPhoto(p.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--s-red)' }}>✕</button>
            </figcaption>
          </figure>
        ))}
        {photos.length < PHOTOS_MAX && (
          <label style={{ minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, border: `2px dashed ${BLUE}`, color: BLUE, fontWeight: 700, fontSize: 13, cursor: 'pointer', textAlign: 'center' }}>
            {envoiPhoto ? 'Envoi…' : '+ Ajouter des photos'}
            <input type="file" multiple accept="image/png,image/jpeg,image/webp" style={{ display: 'none' }}
              onChange={e => { void ajouterPhoto(e.target.files); e.target.value = '' }} />
          </label>
        )}
      </div>
    </Card>
  )
}
