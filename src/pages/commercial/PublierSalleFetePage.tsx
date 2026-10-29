import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../../context/ToastContext'
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
import { envoyerBien } from './guesthouse/envoi'
import EtapeIdentite from './guesthouse/EtapeIdentite'
import EtapeLocalisation from './guesthouse/EtapeLocalisation'
import EtapeTarif from './salle-fete/EtapeTarif'
import EtapeRegles from './salle-fete/EtapeRegles'
import EtapePhotos from './salle-fete/EtapePhotos'

const CLE_BROUILLON = 'publier_salle_fete_draft'

function lireJson<T>(cle: string): T | null {
  try { return JSON.parse(localStorage.getItem(cle) ?? 'null') as T | null } catch { return null }
}

/** Brouillon restauré (formulaire et étape) ; à défaut, propriétaire saisi avant d'arriver ici. */
function etatInitial(): { form: SalleFeteForm; etape: number } {
  const brouillon = lireJson<{ form: SalleFeteForm; etape: number }>(CLE_BROUILLON)
  if (brouillon?.form) return { form: { ...formulaireVide(), ...brouillon.form }, etape: Math.min(brouillon.etape ?? 0, ETAPES.length - 1) }
  return { form: formulaireVide(lireJson('proprietaire_info')), etape: 0 }
}

export default function PublierSalleFetePage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [{ form: formInitial, etape: etapeInitiale }] = useState(etatInitial)
  const [form, setForm] = useState<SalleFeteForm>(formInitial)
  const [etape, setEtape] = useState(etapeInitiale)
  const [photos, setPhotos] = useState<File[]>([])
  const [video, setVideo] = useState<File | null>(null)
  const [envoi, setEnvoi] = useState<{ enCours: boolean; progres: number }>({ enCours: false, progres: 0 })
  const [creeId, setCreeId] = useState<number | null>(null)
  const [groupes, setGroupes] = useState<GroupeEquipements[] | null>(null)
  const [erreurEquipements, setErreurEquipements] = useState('')
  const [evenements, setEvenements] = useState<TypeEvenement[] | null>(null)
  const [erreurEvenements, setErreurEvenements] = useState('')
  const [essai, setEssai] = useState(0)

  const maj = useCallback((patch: Partial<SalleFeteForm>) => setForm(f => ({ ...f, ...patch })), [])

  // Brouillon : sauvegardé à chaque modification (les fichiers ne peuvent pas l'être)
  useEffect(() => {
    if (creeId !== null) return
    try { localStorage.setItem(CLE_BROUILLON, JSON.stringify({ form, etape })) } catch { /* stockage plein ou désactivé */ }
  }, [form, etape, creeId])

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

  const manques = manquesEtape(etape, form, photos.length)
  const derniere = etape === ETAPES.length - 1
  const bloque = manques.length > 0 || envoi.enCours

  const allerA = (n: number) => { setEtape(n); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  const envoyer = async () => {
    setEnvoi({ enCours: true, progres: 0 })
    try {
      const r = await envoyerBien(salleFeteApi.create, construirePayload(form), photos, video, p => setEnvoi({ enCours: true, progres: p }))
      localStorage.removeItem(CLE_BROUILLON)
      localStorage.removeItem('proprietaire_info')
      setCreeId(r.bienId)
      if (r.photosEchouees || r.videoEchouee) {
        const details = [
          r.photosEchouees ? `${r.photosEchouees} photo(s)` : '',
          r.videoEchouee ? 'la vidéo' : '',
        ].filter(Boolean).join(' et ')
        toast(`Salle enregistrée, mais ${details} n’ont pas pu être envoyées. Ajoutez-les depuis « Modifier » : 4 photos sont exigées pour la publication.`, 'error')
      } else {
        toast('Salle de fêtes envoyée. Elle sera visible après validation par un administrateur.', 'success')
      }
    } catch (err) {
      setEnvoi({ enCours: false, progres: 0 })
      toast(apiMessage(err) ?? 'L’enregistrement a échoué. Vos informations sont conservées : réessayez.', 'error')
    }
  }

  const suivant = () => {
    if (bloque) return
    if (derniere) void envoyer()
    else allerA(etape + 1)
  }

  if (creeId !== null) {
    return (
      <div style={{ maxWidth: 480, margin: '64px auto', padding: '32px 24px', textAlign: 'center' }}>
        <h1 style={{ fontSize: 20, color: 'var(--c-text)' }}>Salle de fêtes envoyée</h1>
        <p style={{ color: 'var(--c-muted)', fontSize: 14 }}>
          Statut : en attente de validation. Vous la retrouvez dans vos annonces avec le badge « Salle de fêtes ».
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' }}>
          <button className="btn-cancel" onClick={() => navigate(`/mes-annonces/${creeId}/modifier`)}>Voir / modifier</button>
          <button className="btn-submit" onClick={() => navigate('/mes-annonces')}>Mes annonces</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '16px 16px 0' }}>
      <header style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: 18, margin: 0, color: 'var(--c-text)' }}>
            Nouvelle salle de fêtes
            <span style={{ fontSize: 12, color: 'var(--c-muted)', marginLeft: 8, fontWeight: 500 }}>{ETAPES[etape]}</span>
          </h1>
          <span style={{ fontSize: 12, fontWeight: 700, color: BLUE }}>{etape + 1}/{ETAPES.length}</span>
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
      {etape === 2 && <EtapeTarif form={form} maj={maj} />}
      {etape === 3 && (
        <EtapeRegles form={form} maj={maj} evenements={evenements} erreurEvenements={erreurEvenements}
          groupes={groupes} erreurEquipements={erreurEquipements} reessayer={() => setEssai(n => n + 1)} />
      )}
      {etape === 4 && (
        <EtapePhotos form={form} photos={photos} setPhotos={setPhotos} video={video} setVideo={setVideo}
          libellesEquipements={libellesEquipements} libellesEvenements={libellesEvenements}
          signaler={m => toast(m, 'error')} />
      )}

      {/* Barre d'actions toujours visible : ce qui manque + boutons. Les boutons se replient sous 400 px. */}
      <div style={{ position: 'sticky', bottom: 0, marginTop: 16, padding: '12px 0 16px', background: 'var(--c-bg)', borderTop: '1px solid var(--c-border)' }}>
        {manques.length > 0 && (
          <p aria-live="polite" style={{ fontSize: 12, color: 'var(--s-red)', margin: '0 0 10px' }}>
            Il manque : {manques.join(' · ')}
          </p>
        )}
        {envoi.enCours && (
          <p aria-live="polite" style={{ fontSize: 12, color: BLUE, margin: '0 0 10px' }}>Envoi en cours… {envoi.progres}%</p>
        )}
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" className="btn-cancel" disabled={envoi.enCours}
            onClick={() => (etape > 0 ? allerA(etape - 1) : navigate('/publier-bien'))}>
            {etape > 0 ? 'Précédent' : 'Changer de type'}
          </button>
          <button type="button" className="btn-submit" disabled={bloque} aria-disabled={bloque}
            onClick={suivant} style={{ flex: 1, opacity: bloque ? 0.5 : 1, cursor: bloque ? 'not-allowed' : 'pointer' }}>
            {derniere ? (envoi.enCours ? 'Envoi…' : 'Envoyer la salle') : 'Suivant'}
          </button>
        </div>
      </div>
    </div>
  )
}
