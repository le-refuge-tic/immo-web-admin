import { useCallback, useEffect, useState } from 'react'
import { useToast } from '../../../context/ToastContext'
import { apiMessage } from '../../../utils/apiMessage'
import { patchAdminBien } from '../../../api/patchAdminBien'
import { salleFeteApi, type TypeEvenement } from '../../../api/salleFete'
import type { GroupeEquipements } from '../../../api/guesthouse'
import { BLUE } from '../formStyles'
import { PHOTOS_MIN } from '../guesthouse/guesthouseForm'
import EtapeIdentite from '../guesthouse/EtapeIdentite'
import EtapeLocalisation from '../guesthouse/EtapeLocalisation'
import EditeurPhotos, { type PhotoBien } from '../guesthouse/EditeurPhotos'
import EtapeTarif from './EtapeTarif'
import EtapeRegles from './EtapeRegles'
import { depuisBien, manquesEtape, payloadEdition, TEXTES_IDENTITE, type SalleFeteForm } from './salleFeteForm'
import { useConfirm } from '../../../shared/dialogues/useConfirm'
import ConversionClassique from '../formulaire-dedie/ConversionClassique'

type Props = {
  bien: Parameters<typeof depuisBien>[0] & { id: number; type: string; photos?: PhotoBien[]; modification_en_attente?: unknown }
  /** Commercial sur un bien déjà approuvé : lecture seule (règle existante). */
  isLocked: boolean
  onBack: () => void
  /** Lot 5 : bien publié modifié par un commercial → la modification part en validation. */
  enValidation?: boolean
  /** Lot 5 : l'admin peut convertir le bien en bien classique. */
  peutConvertir?: boolean
  onConverti?: () => void
}

/**
 * Édition d'une salle de fêtes (page « Modifier ») : mêmes blocs que la création.
 * Sert aussi à compléter une salle enregistrée sans détails.
 */
export default function SalleFeteEditor({ bien, isLocked, onBack, enValidation = false, peutConvertir = false, onConverti }: Props) {
  const toast = useToast()
  const [form, setForm] = useState<SalleFeteForm>(() => depuisBien(bien))
  const [photos, setPhotos] = useState<PhotoBien[]>(bien.photos ?? [])
  const [enregistrement, setEnregistrement] = useState(false)
  const [groupes, setGroupes] = useState<GroupeEquipements[] | null>(null)
  const [erreurEquipements, setErreurEquipements] = useState('')
  const [evenements, setEvenements] = useState<TypeEvenement[] | null>(null)
  const [erreurEvenements, setErreurEvenements] = useState('')
  const [essai, setEssai] = useState(0)
  const sansDetails = !bien.details_salle_fete

  const maj = useCallback((patch: Partial<SalleFeteForm>) => setForm(f => ({ ...f, ...patch })), [])

  useEffect(() => {
    let annule = false
    salleFeteApi.equipements()
      .then(g => { if (!annule) { setGroupes(g); setErreurEquipements('') } })
      .catch(err => { if (!annule) setErreurEquipements(apiMessage(err) ?? 'Impossible de charger les équipements.') })
    salleFeteApi.evenements()
      .then(e => { if (!annule) { setEvenements(e); setErreurEvenements('') } })
      .catch(err => { if (!annule) setErreurEvenements(apiMessage(err) ?? 'Impossible de charger les types d’événements.') })
    return () => { annule = true }
  }, [essai])

  // Les 4 blocs de saisie doivent être complets pour enregistrer (photos gérées à part)
  const manques = [0, 1, 2, 3].flatMap(i => manquesEtape(i, form, photos.length))
  // Lot 5 : rien à enregistrer tant que rien n'a changé ; « Retour » prévient avant de perdre une saisie.
  const [reference, setReference] = useState(() => JSON.stringify(payloadEdition(depuisBien(bien))))
  const modifie = JSON.stringify(payloadEdition(form)) !== reference
  const bloque = isLocked || enregistrement || manques.length > 0 || !modifie
  const { confirmer } = useConfirm()
  const retour = async () => {
    if (modifie && !(await confirmer({ titre: 'Quitter sans enregistrer ?', message: 'Vos changements seront perdus.', confirmer: 'Quitter sans enregistrer', danger: true }))) return
    onBack()
  }

  const enregistrer = async () => {
    if (bloque) return
    setEnregistrement(true)
    try {
      const maj = await patchAdminBien.update(bien.id, payloadEdition(form))
      setReference(JSON.stringify(payloadEdition(form)))
      if (maj?.modification_en_attente) {
        toast('Modification envoyée en validation : l’annonce actuelle reste en ligne jusqu’à la décision d’un administrateur.', 'info')
        return
      }
      toast(photos.length < PHOTOS_MIN
        ? `Modifications enregistrées. Ajoutez encore ${PHOTOS_MIN - photos.length} photo(s) pour pouvoir publier.`
        : 'Modifications enregistrées.', 'success')
    } catch (err) {
      toast(apiMessage(err) ?? 'L’enregistrement a échoué. Vos modifications sont conservées : réessayez.', 'error')
    } finally {
      setEnregistrement(false)
    }
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '16px 16px 0' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <button type="button" className="btn-cancel" onClick={() => void retour()}>Retour</button>
        <h1 style={{ fontSize: 18, margin: 0, color: 'var(--c-text)' }}>Salle de fêtes n° {bien.id}</h1>
      </header>

      {bien.modification_en_attente ? (
        <p role="status" style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--t-blue-bg)', border: '1px solid var(--t-blue-bd)', color: 'var(--s-blue)', fontSize: 13 }}>
          Une modification de ce bien attend la décision d’un administrateur ; l’annonce actuelle reste en ligne. Un nouvel envoi remplace la modification en attente.
        </p>
      ) : enValidation && (
        <p role="note" style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--t-yellow-bg)', border: '1px solid var(--t-yellow-bd)', color: 'var(--s-yellow)', fontSize: 13 }}>
          Ce bien est publié : vos modifications partiront en validation, l’annonce actuelle reste en ligne en attendant. Les photos d’un bien publié ne sont modifiables que par un administrateur.
        </p>
      )}
      {peutConvertir && onConverti && <ConversionClassique bien={bien} onConverti={onConverti} />}
      {isLocked && (
        <p role="note" style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--t-yellow-bg)', border: '1px solid var(--t-yellow-bd)', color: 'var(--s-yellow)', fontSize: 13 }}>
          Ce bien est déjà approuvé : il ne peut plus être modifié depuis cette page. Contactez un administrateur si un changement est nécessaire.
        </p>
      )}
      {sansDetails && !isLocked && (
        <p role="note" style={{ padding: '10px 14px', borderRadius: 10, background: BLUE + '12', border: `1px solid ${BLUE}40`, color: BLUE, fontSize: 13 }}>
          Salle enregistrée sans ses détails : complétez les informations ci-dessous et ajoutez au moins {PHOTOS_MIN} photos. Elle ne pourra pas être publiée avant.
        </p>
      )}

      <fieldset disabled={isLocked} style={{ border: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
        <EtapeIdentite form={form} maj={maj} textes={TEXTES_IDENTITE} />
        <EtapeLocalisation form={form} maj={maj} sansPosition />
        <EtapeTarif form={form} maj={maj} />
        <EtapeRegles form={form} maj={maj} evenements={evenements} erreurEvenements={erreurEvenements}
          groupes={groupes} erreurEquipements={erreurEquipements} reessayer={() => setEssai(n => n + 1)} />
        {!enValidation && <EditeurPhotos bienId={bien.id} photos={photos} setPhotos={setPhotos} />}
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
