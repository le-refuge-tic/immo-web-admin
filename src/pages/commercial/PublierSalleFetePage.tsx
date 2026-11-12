import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../../context/ToastContext'
import { useGestionEnvois } from '../../shared/uploads/useGestionEnvois'
import { totauxSalle } from '../../shared/biens/calculsTarifs'
import { apiMessage } from '../../utils/apiMessage'
import { salleFeteApi, type TypeEvenement } from '../../api/salleFete'
import type { GroupeEquipements } from '../../api/guesthouse'
import { BLUE } from './formStyles'
import {
  ETAPES,
  formulaireVide,
  manquesEtape,
  construirePayload,
  TEXTES_IDENTITE,
  type SalleFeteForm,
} from './salle-fete/salleFeteForm'
import { sectionsRecapSalle } from './salle-fete/recap'
import { envoyerBien } from './guesthouse/envoi'
import EtapeIdentite from './guesthouse/EtapeIdentite'
import EtapeLocalisation from './guesthouse/EtapeLocalisation'
import EtapeTarif from './salle-fete/EtapeTarif'
import EtapeRegles from './salle-fete/EtapeRegles'
import EtapePhotos from './salle-fete/EtapePhotos'
import { useBrouillonFormulaire } from './brouillons/useBrouillonFormulaire'
import { useActionsFormulaire } from './formulaire-dedie/useActionsFormulaire'
import BarreActions from './formulaire-dedie/BarreActions'
import MenuBrouillons from './formulaire-dedie/MenuBrouillons'
import Recapitulatif from './formulaire-dedie/Recapitulatif'
import { TotauxSalleBloc } from './formulaire-dedie/BlocTotaux'

function lireJson<T>(cle: string): T | null {
  try { return JSON.parse(localStorage.getItem(cle) ?? 'null') as T | null } catch { return null }
}

/** Formulaire vierge, avec le propriétaire saisi avant d'arriver ici s'il y en a un. */
const formulaireInitial = (): SalleFeteForm => formulaireVide(lireJson('proprietaire_info'))

export default function PublierSalleFetePage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { form, maj, etape, setEtape, brouillonId, lister, supprimer, terminer } =
    useBrouillonFormulaire<SalleFeteForm>('salle_fete', formulaireInitial, ETAPES.length)
  const { annuler, changerDeType, fraisVisite } = useActionsFormulaire({ brouillonId, supprimerBrouillon: supprimer })
  const [photos, setPhotos] = useState<File[]>([])
  const [video, setVideo] = useState<File | null>(null)
  const [enCours, setEnCours] = useState(false)
  const { demarrer } = useGestionEnvois()
  const [groupes, setGroupes] = useState<GroupeEquipements[] | null>(null)
  const [erreurEquipements, setErreurEquipements] = useState('')
  const [evenements, setEvenements] = useState<TypeEvenement[] | null>(null)
  const [erreurEvenements, setErreurEvenements] = useState('')
  const [essai, setEssai] = useState(0)

  // Référentiels : chargés ensemble, relancés ensemble par « Réessayer »
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

  const libellesEquipements = useMemo(
    () => Object.fromEntries((groupes ?? []).flatMap(g => g.equipements.map(e => [e.code, e.libelle]))),
    [groupes],
  )
  const libellesEvenements = useMemo(
    () => Object.fromEntries((evenements ?? []).map(e => [e.code, e.libelle])),
    [evenements],
  )

  const totaux = totauxSalle({
    prix: form.prix, dureeHeures: form.dureeHeures, heuresMin: form.heuresMin, caution: form.caution,
    fraisMenage: form.fraisMenage, forfaitJournee: form.forfaitJournee, forfaitWeekend: form.forfaitWeekend,
  })
  const manques = manquesEtape(etape, form, photos.length)
  const derniere = etape === ETAPES.length - 1

  const allerA = useCallback((n: number) => { setEtape(n); window.scrollTo({ top: 0, behavior: 'smooth' }) }, [setEtape])

  const envoyer = async () => {
    setEnCours(true)
    try {
      // Lot 1 : les photos partent en arrière-plan, retour immédiat aux annonces.
      await envoyerBien(salleFeteApi.create, construirePayload(form, fraisVisite), { libelle: form.nom.trim() || 'Salle de fêtes', photos, video }, demarrer)
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
            Nouvelle salle de fêtes
            <span style={{ fontSize: 12, color: 'var(--c-muted)', marginLeft: 8, fontWeight: 500 }}>{ETAPES[etape]}</span>
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <MenuBrouillons famille="salle_fete" lister={lister} courantId={brouillonId} nbEtapes={ETAPES.length}
              onReprendre={lien => navigate(lien)} onSupprimer={supprimer} onNouveau={() => navigate('/publier-salle-fete')} />
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

      {etape === 0 && <EtapeIdentite form={form} maj={maj} textes={TEXTES_IDENTITE} />}
      {etape === 1 && <EtapeLocalisation form={form} maj={maj} />}
      {etape === 2 && <EtapeTarif form={form} maj={maj} totaux={<TotauxSalleBloc t={totaux} />} />}
      {etape === 3 && (
        <EtapeRegles form={form} maj={maj} evenements={evenements} erreurEvenements={erreurEvenements}
          groupes={groupes} erreurEquipements={erreurEquipements} reessayer={() => setEssai(n => n + 1)} />
      )}
      {etape === 4 && (
        <EtapePhotos photos={photos} setPhotos={setPhotos} video={video} setVideo={setVideo}
          signaler={m => toast(m, 'error')}
          recap={(
            <Recapitulatif
              sections={sectionsRecapSalle(form, libellesEquipements, libellesEvenements)}
              totaux={<TotauxSalleBloc t={totaux} />}
              manques={ETAPES.slice(0, -1).map((libelle, i) => ({ etape: i, libelle, champs: manquesEtape(i, form, photos.length) }))}
              allerA={allerA}
            />
          )} />
      )}

      <BarreActions etape={etape} derniere={derniere} manques={manques} enCours={enCours} libelleEnvoyer="Envoyer la salle"
        onAnnuler={() => void annuler()}
        onPrecedent={() => (etape > 0 ? allerA(etape - 1) : void changerDeType())}
        onSuivant={suivant} />
    </div>
  )
}
