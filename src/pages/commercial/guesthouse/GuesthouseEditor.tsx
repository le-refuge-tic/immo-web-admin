import { useCallback, useEffect, useState } from 'react'
import { useToast } from '../../../context/ToastContext'
import { apiMessage } from '../../../utils/apiMessage'
import { patchAdminBien } from '../../../api/patchAdminBien'
import { adminPhotos } from '../../../api/adminPhotos'
import { guesthouseApi, type GroupeEquipements } from '../../../api/guesthouse'
import { Card, Section } from '../formUi'
import { BLUE } from '../formStyles'
import { depuisBien, manquesEtape, payloadEdition, PHOTOS_MAX, PHOTOS_MIN, type GuesthouseForm } from './guesthouseForm'
import EtapeIdentite from './EtapeIdentite'
import EtapeLocalisation from './EtapeLocalisation'
import EtapeTarif from './EtapeTarif'
import EtapeRegles from './EtapeRegles'

type Photo = { id: number; url: string; is_cover: boolean }

type Props = {
  bien: Parameters<typeof depuisBien>[0] & { id: number; details_guesthouse?: unknown; photos?: Photo[] }
  /** Commercial sur un bien déjà approuvé : lecture seule (règle existante). */
  isLocked: boolean
  onBack: () => void
}

/**
 * Édition d'une guesthouse (page « Modifier ») : mêmes blocs que la création.
 * Sert aussi à compléter les anciennes guesthouses enregistrées sans détails.
 */
export default function GuesthouseEditor({ bien, isLocked, onBack }: Props) {
  const toast = useToast()
  const [form, setForm] = useState<GuesthouseForm>(() => depuisBien(bien))
  const [photos, setPhotos] = useState<Photo[]>(bien.photos ?? [])
  const [enregistrement, setEnregistrement] = useState(false)
  const [envoiPhoto, setEnvoiPhoto] = useState(false)
  const [groupes, setGroupes] = useState<GroupeEquipements[] | null>(null)
  const [erreurEquipements, setErreurEquipements] = useState('')
  const [essai, setEssai] = useState(0)
  const sansDetails = !bien.details_guesthouse

  const maj = useCallback((patch: Partial<GuesthouseForm>) => setForm(f => ({ ...f, ...patch })), [])

  useEffect(() => {
    let annule = false
    guesthouseApi.equipements()
      .then(g => { if (!annule) { setGroupes(g); setErreurEquipements('') } })
      .catch(err => { if (!annule) setErreurEquipements(apiMessage(err) ?? 'Impossible de charger les équipements.') })
    return () => { annule = true }
  }, [essai])

  // Les 4 blocs de saisie doivent être complets pour enregistrer (photos gérées à part)
  const manques = [0, 1, 2, 3].flatMap(i => manquesEtape(i, form, photos.length))
  const bloque = isLocked || enregistrement || manques.length > 0

  const enregistrer = async () => {
    if (bloque) return
    setEnregistrement(true)
    try {
      await patchAdminBien.update(bien.id, payloadEdition(form))
      toast(photos.length < PHOTOS_MIN
        ? `Modifications enregistrées. Ajoutez encore ${PHOTOS_MIN - photos.length} photo(s) pour pouvoir publier.`
        : 'Modifications enregistrées.', 'success')
    } catch (err) {
      toast(apiMessage(err) ?? 'L’enregistrement a échoué. Vos modifications sont conservées : réessayez.', 'error')
    } finally {
      setEnregistrement(false)
    }
  }

  const ajouterPhoto = async (fichiers: FileList | null) => {
    const liste = Array.from(fichiers ?? [])
    const place = PHOTOS_MAX - photos.length
    if (liste.length > place) toast(`${PHOTOS_MAX} photos au maximum : ${liste.length - Math.max(place, 0)} photo(s) non ajoutée(s).`, 'error')
    setEnvoiPhoto(true)
    for (const f of liste.slice(0, Math.max(place, 0))) {
      try {
        const p = await adminPhotos.upload(bien.id, f)
        setPhotos(ps => [...ps, p])
      } catch (err) {
        toast(apiMessage(err) ?? `La photo « ${f.name} » n’a pas pu être envoyée.`, 'error')
      }
    }
    setEnvoiPhoto(false)
  }

  const supprimerPhoto = async (id: number) => {
    try {
      await adminPhotos.remove(bien.id, id)
      setPhotos(ps => ps.filter(p => p.id !== id))
    } catch (err) {
      toast(apiMessage(err) ?? 'La photo n’a pas pu être supprimée.', 'error')
    }
  }

  const choisirCouverture = async (id: number) => {
    try {
      await adminPhotos.setCover(bien.id, id)
      setPhotos(ps => ps.map(p => ({ ...p, is_cover: p.id === id })))
    } catch (err) {
      toast(apiMessage(err) ?? 'La couverture n’a pas pu être changée.', 'error')
    }
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '16px 16px 0' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button type="button" className="btn-cancel" onClick={onBack}>Retour</button>
        <h1 style={{ fontSize: 18, margin: 0, color: 'var(--c-text)' }}>Guesthouse n° {bien.id}</h1>
      </header>

      {isLocked && (
        <p role="note" style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--t-yellow-bg)', border: '1px solid var(--t-yellow-bd)', color: 'var(--s-yellow)', fontSize: 13 }}>
          Ce bien est déjà approuvé : il ne peut plus être modifié depuis cette page. Contactez un administrateur si un changement est nécessaire.
        </p>
      )}
      {sansDetails && !isLocked && (
        <p role="note" style={{ padding: '10px 14px', borderRadius: 10, background: BLUE + '12', border: `1px solid ${BLUE}40`, color: BLUE, fontSize: 13 }}>
          Guesthouse enregistrée avant le formulaire dédié : complétez les informations ci-dessous et ajoutez au moins {PHOTOS_MIN} photos. Elle ne pourra pas être publiée avant.
        </p>
      )}

      <fieldset disabled={isLocked} style={{ border: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <EtapeIdentite form={form} maj={maj} />
        <EtapeLocalisation form={form} maj={maj} sansPosition />
        <EtapeTarif form={form} maj={maj} />
        <EtapeRegles form={form} maj={maj} groupes={groupes} erreur={erreurEquipements} reessayer={() => setEssai(n => n + 1)} />

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
      </fieldset>

      {!isLocked && (
        <div style={{ position: 'sticky', bottom: 0, marginTop: 16, padding: '12px 0 16px', background: 'var(--c-bg)', borderTop: '1px solid var(--c-border)' }}>
          {manques.length > 0 && (
            <p aria-live="polite" style={{ fontSize: 12, color: 'var(--s-red)', margin: '0 0 10px' }}>Il manque : {manques.join(' · ')}</p>
          )}
          <button type="button" className="btn-submit" onClick={enregistrer} disabled={bloque}
            style={{ width: '100%', opacity: bloque ? 0.5 : 1, cursor: bloque ? 'not-allowed' : 'pointer' }}>
            {enregistrement ? 'Enregistrement…' : 'Enregistrer les modifications'}
          </button>
        </div>
      )}
    </div>
  )
}
