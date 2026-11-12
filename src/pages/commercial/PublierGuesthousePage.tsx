import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../../context/ToastContext'
import { useGestionEnvois } from '../../shared/uploads/useGestionEnvois'
import { totauxGuesthouse } from '../../shared/biens/calculsTarifs'
import { apiMessage } from '../../utils/apiMessage'
import { guesthouseApi, type GroupeEquipements } from '../../api/guesthouse'
import { BLUE } from './formStyles'
import {
  ETAPES,
  formulaireVide,
  manquesEtape,
  construirePayload,
  type GuesthouseForm,
} from './guesthouse/guesthouseForm'
import { envoyerGuesthouse } from './guesthouse/envoi'
import { sectionsRecapGuesthouse } from './guesthouse/recap'
import EtapeIdentite from './guesthouse/EtapeIdentite'
import EtapeLocalisation from './guesthouse/EtapeLocalisation'
import EtapeTarif from './guesthouse/EtapeTarif'
import EtapeRegles from './guesthouse/EtapeRegles'
import EtapePhotos from './guesthouse/EtapePhotos'
import { useBrouillonFormulaire } from './brouillons/useBrouillonFormulaire'
import { useActionsFormulaire } from './formulaire-dedie/useActionsFormulaire'
import BarreActions from './formulaire-dedie/BarreActions'
import MenuBrouillons from './formulaire-dedie/MenuBrouillons'
import Recapitulatif from './formulaire-dedie/Recapitulatif'
import { TotauxGuesthouseBloc } from './formulaire-dedie/BlocTotaux'

function lireJson<T>(cle: string): T | null {
  try { return JSON.parse(localStorage.getItem(cle) ?? 'null') as T | null } catch { return null }
}

/** Formulaire vierge, avec le propriétaire saisi avant d'arriver ici s'il y en a un. */
const formulaireInitial = (): GuesthouseForm => formulaireVide(lireJson('proprietaire_info'))

export default function PublierGuesthousePage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { form, maj, etape, setEtape, brouillonId, lister, supprimer, terminer } =
    useBrouillonFormulaire<GuesthouseForm>('guesthouse', formulaireInitial, ETAPES.length)
  const { annuler, changerDeType, fraisVisite } = useActionsFormulaire({ brouillonId, supprimerBrouillon: supprimer })
  const [photos, setPhotos] = useState<File[]>([])
  const [video, setVideo] = useState<File | null>(null)
  const [enCours, setEnCours] = useState(false)
  const { demarrer } = useGestionEnvois()
  const [groupes, setGroupes] = useState<GroupeEquipements[] | null>(null)
  const [erreurEquipements, setErreurEquipements] = useState('')
  const [essaiEquipements, setEssaiEquipements] = useState(0)

  useEffect(() => {
    let annule = false
    guesthouseApi.equipements()
      .then(g => { if (!annule) { setGroupes(Array.isArray(g) ? g : []); setErreurEquipements('') } })
      .catch(err => { if (!annule) setErreurEquipements(apiMessage(err) ?? 'Impossible de charger les équipements.') })
    return () => { annule = true }
  }, [essaiEquipements])

  const libellesEquipements = useMemo(
    () => Object.fromEntries((groupes ?? []).flatMap(g => g.equipements.map(e => [e.code, e.libelle]))),
    [groupes],
  )

  const totaux = totauxGuesthouse({
    prixNuitee: form.prixNuitee, nuiteesMin: form.nuiteesMin, caution: form.caution,
    fraisMenage: form.fraisMenage, prixSemaine: form.prixSemaine, prixMois: form.prixMois,
  })
  const manques = manquesEtape(etape, form, photos.length)
  const derniere = etape === ETAPES.length - 1

  const allerA = useCallback((n: number) => { setEtape(n); window.scrollTo({ top: 0, behavior: 'smooth' }) }, [setEtape])

  const envoyer = async () => {
    setEnCours(true)
    try {
      // Lot 1 : les photos partent en arrière-plan, retour immédiat aux annonces.
      await envoyerGuesthouse(construirePayload(form, fraisVisite), { libelle: form.nom.trim() || 'Guesthouse', photos, video }, demarrer)
      terminer()
      localStorage.removeItem('proprietaire_info')
      navigate('/mes-annonces')
    } catch (err) {
      setEnCours(false)
      toast(apiMessage(err) ?? 'L’enregistrement a échoué. Vos informations sont conservées : réessayez.', 'error')
    }
  }

  const suivant = () => {
    if (manques.length || enCours) return
    if (derniere) void envoyer()
    else allerA(etape + 1)
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '16px 16px 0' }}>
      <header style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: 18, margin: 0, color: 'var(--c-text)' }}>
            Nouvelle guesthouse
            <span style={{ fontSize: 12, color: 'var(--c-muted)', marginLeft: 8, fontWeight: 500 }}>{ETAPES[etape]}</span>
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <MenuBrouillons famille="guesthouse" lister={lister} courantId={brouillonId} nbEtapes={ETAPES.length}
              onReprendre={lien => navigate(lien)} onSupprimer={supprimer} onNouveau={() => navigate('/publier-guesthouse')} />
            <span style={{ fontSize: 12, fontWeight: 700, color: BLUE }}>{etape + 1}/{ETAPES.length}</span>
          </div>
        </div>
        <div style={{ height: 4, borderRadius: 2, background: 'var(--c-border)', marginTop: 10 }}>
          <div style={{ height: '100%', borderRadius: 2, background: BLUE, width: `${((etape + 1) / ETAPES.length) * 100}%`, transition: 'width 0.3s' }} />
        </div>
        <p style={{ fontSize: 11, color: 'var(--c-muted)', margin: '8px 0 0' }}>
          Brouillon enregistré automatiquement sur cet appareil (sauf les photos et la vidéo).
        </p>
      </header>

      {etape === 0 && <EtapeIdentite form={form} maj={maj} />}
      {etape === 1 && <EtapeLocalisation form={form} maj={maj} />}
      {etape === 2 && <EtapeTarif form={form} maj={maj} totaux={<TotauxGuesthouseBloc t={totaux} />} />}
      {etape === 3 && (
        <EtapeRegles form={form} maj={maj} groupes={groupes} erreur={erreurEquipements}
          reessayer={() => setEssaiEquipements(n => n + 1)} />
      )}
      {etape === 4 && (
        <EtapePhotos photos={photos} setPhotos={setPhotos} video={video} setVideo={setVideo}
          signaler={m => toast(m, 'error')}
          recap={(
            <Recapitulatif
              sections={sectionsRecapGuesthouse(form, libellesEquipements)}
              totaux={<TotauxGuesthouseBloc t={totaux} />}
              manques={ETAPES.slice(0, -1).map((libelle, i) => ({ etape: i, libelle, champs: manquesEtape(i, form, photos.length) }))}
              allerA={allerA}
            />
          )} />
      )}

      <BarreActions etape={etape} derniere={derniere} manques={manques} enCours={enCours} libelleEnvoyer="Envoyer la guesthouse"
        onAnnuler={() => void annuler()}
        onPrecedent={() => (etape > 0 ? allerA(etape - 1) : void changerDeType())}
        onSuivant={suivant} />
    </div>
  )
}
