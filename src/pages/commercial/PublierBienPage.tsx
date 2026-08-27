import type { ReactNode, CSSProperties } from 'react'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { postBien } from '../../api/postBien'
import { BENIN_LOCATION_DATA } from '../../data/beninLocations'

// ─── Quartiers — même structure que immo-web-user ─────────────────────────────
type Quartier = { nom: string; arrondissement: string; ville: string }
const QUARTIERS: Quartier[] = (() => {
  const result: Quartier[] = []
  for (const [ville, arrs] of Object.entries(BENIN_LOCATION_DATA)) {
    for (const [arr, qs] of Object.entries(arrs)) {
      for (const nom of qs) result.push({ nom, arrondissement: arr, ville })
    }
  }
  return result
})()

const normalizeStr = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const BLUE = '#4B6BFF'

type TarifCustom = { label: string; prix: string }
type DetailCustom = { label: string; valeur: string }

const TYPES_BIEN = [
  { key: 'entree_coucher', label: 'Entrée-Coucher' },
  { key: 'chambre_salon',  label: 'Chambre-Salon'  },
  { key: 'appartement',   label: 'Appartement'    },
  { key: 'villa',         label: 'Villa'           },
  { key: 'maison',        label: 'Maison'          },
  { key: 'terrain',       label: 'Terrain / Parcelle' },
  { key: 'boutique',      label: 'Boutique'        },
]

const SANITAIRE_OPTS = [
  { value: 'interieur',      label: 'Sanitaire',        sub: 'Douche intérieure au logement'              },
  { value: 'semi_interieur', label: 'Semi sanitaire',   sub: 'Douche partiellement intérieure / partagée' },
  { value: 'cour',           label: 'Non sanitaire',    sub: 'Douche extérieure / commune'                },
  { value: 'autre',          label: 'Autre à préciser', sub: ''                                           },
]

const FINITION_OPTS = [
  { value: 'ordinaire',     label: 'Ordinaire',           sub: '' },
  { value: 'staffe_carele', label: 'Staffé',              sub: 'Staff complet moderne et carreaux récents partout.' },
  { value: 'haut_standing', label: 'Haut Standing / VIP', sub: 'Baies vitrées, douche moderne, climatisation.' },
  { value: 'villa',         label: 'Villa',               sub: 'Clôture, espace extérieur, standing élevé.' },
]

const CUISINE_OPTS = [
  { value: 'separee_douche', label: 'Cuisine séparée de la douche' },
  { value: 'americaine',     label: 'Cuisine américaine'           },
  { value: 'autre',          label: 'Autres (à préciser)'          },
]

const COUR_OPTS = [
  { value: 'commune',            label: 'Cour commune'    },
  { value: 'entree_personnelle', label: 'Entrée personnelle' },
]

const COUR_DESC: Record<string, string> = {
  commune:            'La cour est partagée entre plusieurs occupants du bâtiment.',
  entree_personnelle: "Une entrée qui vous est propre, séparée des autres occupants, pour plus d'intimité.",
}

const DOCUMENT_TERRAIN_OPTS = [
  { value: 'permis_construire',        label: 'Permis de construire'     },
  { value: 'titre_foncier',            label: 'Titre foncier'            },
  { value: 'attestation_recasement',   label: 'Attestation de recasement' },
  { value: 'convention_vente',         label: 'Convention de vente'      },
  { value: 'autre',                    label: 'Autre'                    },
]

const EQUIPEMENTS_RESIDENTIEL = [
  { value: 'garage_auto',    label: 'Garage auto'      },
  { value: 'garage_moto',    label: 'Garage moto fermé' },
  { value: 'gardien',        label: 'Gardien / Sécurité' },
  { value: 'balcon',         label: 'Balcon'           },
  { value: 'climatisation',  label: 'Climatisation'    },
  { value: 'chauffe_eau',    label: 'Chauffe-eau'      },
  { value: 'baie_vitree',    label: 'Baies vitrées'    },
]

const EQUIPEMENTS_BOUTIQUE = [
  { value: 'toilette_interne',  label: 'Toilette interne'        },
  { value: 'arriere_boutique',  label: 'Arrière-boutique / Stock' },
  { value: 'sol_carele',        label: 'Sol carrelé'              },
  { value: 'plafond_staffe',    label: 'Plafond staffé'           },
  { value: 'climatisation',     label: 'Climatisation'            },
]

const ALENTOURS_OPTS = [
  { value: 'marche',      label: 'Marché'              },
  { value: 'eglise',      label: 'Église / Cathédrale'  },
  { value: 'mosquee',     label: 'Mosquée'             },
  { value: 'ecole',       label: 'École primaire'       },
  { value: 'lycee',       label: 'Collège / Lycée'      },
  { value: 'universite',  label: 'Université / Campus'  },
  { value: 'hopital',     label: 'Hôpital / Clinique'   },
  { value: 'pharmacie',   label: 'Pharmacie'           },
  { value: 'banque',      label: 'Banque / DAB'         },
  { value: 'station',     label: 'Station-service'      },
  { value: 'bar_maquis',  label: 'Bar / Maquis'         },
  { value: 'restaurant',  label: 'Restaurant'          },
  { value: 'taxi_zem',    label: 'Gare taxi / Zem'      },
  { value: 'supermarche', label: 'Supermarché / Épicerie' },
  { value: 'plage',       label: 'Plage / Bord de mer'  },
]

const parsePrix = (t: string): number | undefined => {
  const c = t.trim().replace(/\s/g, '').replace(',', '')
  if (!c) return undefined
  const n = Number(c)
  return Number.isFinite(n) ? n : undefined
}

const formatFcfa = (v: number) => v > 0 ? `${Math.round(v).toLocaleString('fr-FR')} FCFA` : '0 FCFA'


// ─── UI primitives (inline styles only — pas de Tailwind dans ce projet) ──────

const S: Record<string, CSSProperties> = {
  card: { background: '#fff', border: '1px solid var(--c-border)', borderRadius: 14, padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: 0 },
  row:  { display: 'flex', alignItems: 'center' },
  col:  { display: 'flex', flexDirection: 'column' },
  wrap: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  g4:   { gap: 4 }, g8: { gap: 8 }, g10: { gap: 10 }, g12: { gap: 12 }, g16: { gap: 16 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 },
}

function Card({ children }: { children: ReactNode }) {
  return <div style={S.card}>{children}</div>
}

function Section({ title, required }: { title: string; required?: boolean }) {
  return (
    <div style={{ ...S.row, gap: 8, marginBottom: 12 }}>
      <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--c-muted)', margin: 0 }}>{title}</p>
      {required && (
        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, color: BLUE, background: BLUE + '22' }}>Obligatoire</span>
      )}
    </div>
  )
}

function ChoiceList({ options, value, onChange, disabledValues, onDeselect }: {
  options: { value: string; label: string; sub?: string }[]
  value: string | null
  onChange: (v: string) => void
  disabledValues?: string[]
  onDeselect?: () => void
}) {
  return (
    <div style={{ ...S.col, gap: 8 }}>
      {options.map(o => {
        const isDisabled = disabledValues?.includes(o.value) ?? false
        const isActive = value === o.value
        return (
          <button key={o.value} type="button" disabled={isDisabled}
            onClick={() => (isActive && onDeselect) ? onDeselect() : onChange(o.value)}
            style={{
              width: '100%', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8,
              padding: '12px 16px', borderRadius: 12, border: `2px solid ${isActive ? BLUE : 'var(--c-border)'}`,
              background: isActive ? BLUE + '12' : 'var(--c-bg)',
              opacity: isDisabled ? 0.4 : 1, cursor: isDisabled ? 'not-allowed' : 'pointer',
              textAlign: 'left', transition: 'border-color 0.15s, background 0.15s',
            }}>
            <span>
              <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: isActive ? BLUE : 'var(--c-text)' }}>{o.label}</span>
              {o.sub && <span style={{ display: 'block', fontSize: 12, marginTop: 2, color: 'var(--c-muted)' }}>{o.sub}</span>}
            </span>
            {isActive && !isDisabled && <span style={{ fontWeight: 700, flexShrink: 0, color: BLUE }}>✓</span>}
          </button>
        )
      })}
    </div>
  )
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      style={{
        padding: '8px 16px', borderRadius: 10, border: `2px solid ${active ? BLUE : 'var(--c-border)'}`,
        background: active ? BLUE + '12' : 'transparent', color: active ? BLUE : 'var(--c-muted)',
        fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
      }}>
      {label}
    </button>
  )
}

function Counter({ label, value, onChange, min = 0 }: {
  label: string; value: number; onChange: (v: number) => void; min?: number
}) {
  return (
    <div style={{ ...S.row, justifyContent: 'space-between', padding: '10px 0' }}>
      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-text)' }}>{label}</span>
      <div style={{ ...S.row, gap: 12 }}>
        <button type="button" disabled={value <= min} onClick={() => onChange(value - 1)}
          style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, border: '1px solid var(--c-border)', background: 'var(--c-bg)', color: 'var(--c-text)', cursor: value <= min ? 'not-allowed' : 'pointer', opacity: value <= min ? 0.4 : 1 }}>−</button>
        <span style={{ width: 24, textAlign: 'center', fontWeight: 700, color: 'var(--c-text)' }}>{value}</span>
        <button type="button" onClick={() => onChange(value + 1)}
          style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, background: BLUE + '18', color: BLUE, border: 'none', cursor: 'pointer' }}>+</button>
      </div>
    </div>
  )
}

function NumberPicker({ presets, unit, value, isCustom, onPick, onCustomStart, customText, onCustomText }: {
  presets: number[]; unit: (n: number) => string; value: number; isCustom: boolean
  onPick: (n: number) => void; onCustomStart: () => void; customText: string; onCustomText: (t: string) => void
}) {
  return (
    <div>
      <div style={S.wrap}>
        {presets.map(n => (
          <Chip key={n} label={unit(n)} active={!isCustom && value === n} onClick={() => onPick(n)} />
        ))}
        <Chip label="Saisir" active={isCustom} onClick={onCustomStart} />
      </div>
      {isCustom && (
        <input type="number" value={customText} onChange={e => onCustomText(e.target.value)} placeholder="Nombre"
          style={{ marginTop: 10, width: '100%', borderRadius: 10, padding: '10px 16px', fontSize: 14, outline: 'none', border: `1px solid ${BLUE}`, background: 'var(--c-bg)', color: 'var(--c-text)', boxSizing: 'border-box' }} />
      )}
    </div>
  )
}

function MoneyInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div style={{ position: 'relative' }}>
      <input type="number" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder ?? '0'}
        style={{ width: '100%', borderRadius: 10, padding: '12px 56px 12px 16px', fontSize: 14, outline: 'none', border: '1px solid var(--c-border)', background: 'var(--c-bg)', color: 'var(--c-text)', transition: 'border-color 0.15s', boxSizing: 'border-box' }}
        onFocus={e => (e.currentTarget.style.borderColor = BLUE)}
        onBlur={e => (e.currentTarget.style.borderColor = 'var(--c-border)')} />
      <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 12, fontWeight: 600, color: 'var(--c-muted)', pointerEvents: 'none' }}>FCFA</span>
    </div>
  )
}

const baseInput: CSSProperties = {
  width: '100%', borderRadius: 10, padding: '12px 16px', fontSize: 14, outline: 'none',
  border: '1px solid var(--c-border)', background: 'var(--c-bg)', color: 'var(--c-text)',
  boxSizing: 'border-box', transition: 'border-color 0.15s',
}

function RecapSection({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null
  return (
    <div style={{ padding: '12px 0', borderBottom: '1px solid var(--c-border)' }}>
      <p style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: BLUE }}>{title}</p>
      {items.map((item, i) => (
        <div key={i} style={{ ...S.row, alignItems: 'flex-start', gap: 6, marginBottom: 4 }}>
          <span style={{ fontWeight: 700, fontSize: 12, flexShrink: 0, color: BLUE }}>•</span>
          <span style={{ fontSize: 14, lineHeight: 1.35, color: 'var(--c-text)' }}>{item}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function PublierBienPage() {
  const navigate = useNavigate()

  const proprietaireInfo = (() => {
    try { return JSON.parse(sessionStorage.getItem('proprietaire_info') ?? 'null') } catch { return null }
  })()

  const DRAFT_KEY = 'publier_bien_draft'
  const quartierInputRef = useRef<HTMLInputElement>(null)
  const [dropdownRect, setDropdownRect] = useState<{ top: number; left: number; width: number } | null>(null)

  const [step, setStep]               = useState(0)
  const [submitting, setSubmitting]   = useState(false)
  const [error, setError]             = useState('')
  const [created, setCreated]         = useState(false)
  const [photos, setPhotos]           = useState<File[]>([])
  const [video, setVideo]             = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Étape 0
  const [typeBien, setTypeBien]               = useState('chambre_salon')
  const [typeTransaction, setTypeTransaction] = useState<'location' | 'vente'>('location')
  const [prix, setPrix]                       = useState('')
  const [estMeuble, setEstMeuble]             = useState(false)
  const [sanitaire, setSanitaire]             = useState<string | null>(null)
  const [sanitaireAutre, setSanitaireAutre]   = useState('')
  const [finition, setFinition]               = useState<string | null>(null)

  const onSelectSanitaire = (v: string) => {
    setSanitaire(v)
    if (v === 'interieur' && finition === 'ordinaire') setFinition(null)
  }
  const onSelectFinition = (v: string) => {
    setFinition(v)
    if (v === 'staffe_carele') setSanitaire('interieur')
    else if (v === 'ordinaire') setSanitaire('cour')
    else if (v === 'haut_standing' || v === 'villa') setSanitaire(null)
  }

  const [prixLongSejour, setPrixLongSejour]           = useState('')
  const [prixSejourRestreint, setPrixSejourRestreint] = useState('')
  const [prixHeure, setPrixHeure]                     = useState('')
  const [tarifsAutres, setTarifsAutres]               = useState<TarifCustom[]>([])

  // Étape 1
  const [ville, setVille]                         = useState('')
  const [quartier, setQuartier]                   = useState('')
  const [arrondissement, setArrondissement]       = useState('')
  const [indicationAdresse, setIndicationAdresse] = useState('')
  const [quartierSearch, setQuartierSearch]       = useState('')
  const [quartierInputFocused, setQuartierInputFocused] = useState(false)

  // Étape 2
  const [chambres, setChambres]               = useState(1)
  const [salons, setSalons]                   = useState(1)
  const [cuisines, setCuisines]               = useState(1)
  const [douches, setDouches]                 = useState(1)
  const [typeCuisine, setTypeCuisine]         = useState('separee_douche')
  const [cuisineAutre, setCuisineAutre]       = useState('')
  const [chambreACouloir, setChambreACouloir] = useState(false)
  const [typeCour, setTypeCour]               = useState('commune')
  const [nbVoisins, setNbVoisins]             = useState(0)
  const [accesVehicule, setAccesVehicule]     = useState<boolean | null>(null)
  const [nbVehicules, setNbVehicules]         = useState(1)
  const [avanceMois, setAvanceMois]           = useState(0)
  const [avanceAutre, setAvanceAutre]         = useState(false)
  const [avanceAutreText, setAvanceAutreText] = useState('')
  const [echeanceMois, setEcheanceMois]       = useState(5)
  const [echeanceAutre, setEcheanceAutre]     = useState(false)
  const [echeanceAutreText, setEcheanceAutreText]     = useState('')
  const [loyerPrepayeMois, setLoyerPrepayeMois]       = useState(0)
  const [loyerPrepayeAutre, setLoyerPrepayeAutre]     = useState(false)
  const [loyerPrepayeAutreText, setLoyerPrepayeAutreText] = useState('')
  const [cautionEau, setCautionEau]           = useState('')
  const [cautionElec, setCautionElec]         = useState('')
  const [electricite, setElectricite]         = useState('non')
  const [prixKwh, setPrixKwh]                 = useState('')
  const [eau, setEau]                         = useState('non')
  const [forageGestion, setForageGestion]     = useState<string | null>(null)
  const [prixM3, setPrixM3]                   = useState('')
  const [prixForage, setPrixForage]           = useState('')
  const [equipementsBonus, setEquipementsBonus] = useState<string[]>([])
  const [equipementsAutre, setEquipementsAutre] = useState('')
  const [alentours, setAlentours]             = useState<string[]>([])
  const [alentoursAutre, setAlentoursAutre]   = useState('')
  const [disponibilite, setDisponibilite]     = useState<'immediate' | 'en_finition'>('immediate')
  const [showMoreOptions, setShowMoreOptions] = useState(false)

  // Terrain
  const [titreTerrain, setTitreTerrain]                     = useState('')
  const [titreFoncier, setTitreFoncier]                     = useState<boolean | null>(null)
  const [superficieTerrain, setSuperficieTerrain]           = useState('')
  const [superficieUnite, setSuperficieUnite]               = useState<'m2' | 'ha'>('m2')
  const [documentTerrain, setDocumentTerrain]               = useState<string | null>(null)
  const [positionTerrain, setPositionTerrain]               = useState('bord_goudron')
  const [angleRue, setAngleRue]                             = useState(false)
  const [permissionConstruire, setPermissionConstruire]     = useState(false)
  const [descriptionConstruction, setDescriptionConstruction] = useState('')
  const [estLoti, setEstLoti]                               = useState<'lotie' | 'non_lotie' | 'autre' | null>(null)
  const [detailsSupplementaires, setDetailsSupplementaires] = useState<DetailCustom[]>([])

  // Boutique
  const [typeVoie, setTypeVoie]                     = useState('goudron')
  const [visibiliteBoutique, setVisibiliteBoutique] = useState('directe')
  const [parkingClients, setParkingClients]         = useState('aucun')

  // Étape 3
  const [description, setDescription] = useState('')
  const [autresFrais, setAutresFrais] = useState<TarifCustom[]>([])

  // ── Persistance du brouillon ──────────────────────────────────────────────
  const draftState = {
    step, typeBien, typeTransaction, prix, estMeuble, sanitaire, sanitaireAutre, finition,
    prixLongSejour, prixSejourRestreint, prixHeure, tarifsAutres,
    ville, quartier, arrondissement, indicationAdresse, quartierSearch,
    chambres, salons, cuisines, douches, typeCuisine, cuisineAutre,
    chambreACouloir, typeCour, nbVoisins, accesVehicule, nbVehicules,
    avanceMois, avanceAutre, avanceAutreText, echeanceMois, echeanceAutre, echeanceAutreText,
    loyerPrepayeMois, loyerPrepayeAutre, loyerPrepayeAutreText,
    cautionEau, cautionElec, electricite, prixKwh, eau, forageGestion, prixM3, prixForage,
    equipementsBonus, equipementsAutre, alentours, alentoursAutre, disponibilite,
    titreTerrain, titreFoncier, superficieTerrain, superficieUnite, documentTerrain,
    positionTerrain, angleRue, permissionConstruire, descriptionConstruction, estLoti, detailsSupplementaires,
    typeVoie, visibiliteBoutique, parkingClients,
    description, autresFrais,
  }

  const saveDraft = useCallback(() => {
    try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draftState)) } catch { /* quota */ }
  }, [JSON.stringify(draftState)]) // eslint-disable-line

  useEffect(() => { saveDraft() }, [saveDraft])

  // Restauration au montage
  useEffect(() => {
    const raw = sessionStorage.getItem(DRAFT_KEY)
    if (!raw) return
    try {
      const d = JSON.parse(raw)
      if (d.step !== undefined)        setStep(d.step)
      if (d.typeBien)                  setTypeBien(d.typeBien)
      if (d.typeTransaction)           setTypeTransaction(d.typeTransaction)
      if (d.prix !== undefined)        setPrix(d.prix)
      if (d.estMeuble !== undefined)   setEstMeuble(d.estMeuble)
      if (d.sanitaire !== undefined)   setSanitaire(d.sanitaire)
      if (d.sanitaireAutre)            setSanitaireAutre(d.sanitaireAutre)
      if (d.finition !== undefined)    setFinition(d.finition)
      if (d.prixLongSejour)            setPrixLongSejour(d.prixLongSejour)
      if (d.prixSejourRestreint)       setPrixSejourRestreint(d.prixSejourRestreint)
      if (d.prixHeure)                 setPrixHeure(d.prixHeure)
      if (d.tarifsAutres)              setTarifsAutres(d.tarifsAutres)
      if (d.ville)                     setVille(d.ville)
      if (d.quartier)                  setQuartier(d.quartier)
      if (d.arrondissement)            setArrondissement(d.arrondissement)
      if (d.indicationAdresse)         setIndicationAdresse(d.indicationAdresse)
      if (d.quartierSearch)            setQuartierSearch(d.quartierSearch)
      if (d.chambres !== undefined)    setChambres(d.chambres)
      if (d.salons !== undefined)      setSalons(d.salons)
      if (d.cuisines !== undefined)    setCuisines(d.cuisines)
      if (d.douches !== undefined)     setDouches(d.douches)
      if (d.typeCuisine)               setTypeCuisine(d.typeCuisine)
      if (d.cuisineAutre)              setCuisineAutre(d.cuisineAutre)
      if (d.chambreACouloir !== undefined)  setChambreACouloir(d.chambreACouloir)
      if (d.typeCour)                  setTypeCour(d.typeCour)
      if (d.nbVoisins !== undefined)   setNbVoisins(d.nbVoisins)
      if (d.accesVehicule !== undefined)   setAccesVehicule(d.accesVehicule)
      if (d.nbVehicules !== undefined) setNbVehicules(d.nbVehicules)
      if (d.avanceMois !== undefined)  setAvanceMois(d.avanceMois)
      if (d.avanceAutre !== undefined) setAvanceAutre(d.avanceAutre)
      if (d.avanceAutreText)           setAvanceAutreText(d.avanceAutreText)
      if (d.echeanceMois !== undefined) setEcheanceMois(d.echeanceMois)
      if (d.echeanceAutre !== undefined) setEcheanceAutre(d.echeanceAutre)
      if (d.echeanceAutreText)         setEcheanceAutreText(d.echeanceAutreText)
      if (d.loyerPrepayeMois !== undefined) setLoyerPrepayeMois(d.loyerPrepayeMois)
      if (d.loyerPrepayeAutre !== undefined) setLoyerPrepayeAutre(d.loyerPrepayeAutre)
      if (d.loyerPrepayeAutreText)     setLoyerPrepayeAutreText(d.loyerPrepayeAutreText)
      if (d.cautionEau)                setCautionEau(d.cautionEau)
      if (d.cautionElec)               setCautionElec(d.cautionElec)
      if (d.electricite)               setElectricite(d.electricite)
      if (d.prixKwh)                   setPrixKwh(d.prixKwh)
      if (d.eau)                       setEau(d.eau)
      if (d.forageGestion !== undefined) setForageGestion(d.forageGestion)
      if (d.prixM3)                    setPrixM3(d.prixM3)
      if (d.prixForage)                setPrixForage(d.prixForage)
      if (d.equipementsBonus)          setEquipementsBonus(d.equipementsBonus)
      if (d.equipementsAutre)          setEquipementsAutre(d.equipementsAutre)
      if (d.alentours)                 setAlentours(d.alentours)
      if (d.alentoursAutre)            setAlentoursAutre(d.alentoursAutre)
      if (d.disponibilite)             setDisponibilite(d.disponibilite)
      if (d.titreTerrain)              setTitreTerrain(d.titreTerrain)
      if (d.titreFoncier !== undefined) setTitreFoncier(d.titreFoncier)
      if (d.superficieTerrain)         setSuperficieTerrain(d.superficieTerrain)
      if (d.superficieUnite)           setSuperficieUnite(d.superficieUnite)
      if (d.documentTerrain !== undefined) setDocumentTerrain(d.documentTerrain)
      if (d.positionTerrain)           setPositionTerrain(d.positionTerrain)
      if (d.angleRue !== undefined)    setAngleRue(d.angleRue)
      if (d.permissionConstruire !== undefined) setPermissionConstruire(d.permissionConstruire)
      if (d.descriptionConstruction)   setDescriptionConstruction(d.descriptionConstruction)
      if (d.estLoti !== undefined)     setEstLoti(d.estLoti)
      if (d.detailsSupplementaires)    setDetailsSupplementaires(d.detailsSupplementaires)
      if (d.typeVoie)                  setTypeVoie(d.typeVoie)
      if (d.visibiliteBoutique)        setVisibiliteBoutique(d.visibiliteBoutique)
      if (d.parkingClients)            setParkingClients(d.parkingClients)
      if (d.description)               setDescription(d.description)
      if (d.autresFrais)               setAutresFrais(d.autresFrais)
    } catch { /* JSON corrompu */ }
  }, []) // eslint-disable-line

  // Dérivés
  const isTerrain      = typeBien === 'terrain'
  const isBoutique     = typeBien === 'boutique'
  const isSmallUnit    = typeBien === 'entree_coucher' || typeBien === 'chambre_salon'
  const peutEtreMeuble = typeBien === 'appartement' || typeBien === 'villa' || typeBien === 'maison'
  const isMeuble       = peutEtreMeuble && estMeuble
  const showPieces     = ['appartement', 'villa', 'maison', 'chambre_salon'].includes(typeBien)
  const hasAtLeastOneTarif = !!(parsePrix(prixLongSejour) || parsePrix(prixSejourRestreint) || parsePrix(prixHeure) || tarifsAutres.some(t => parsePrix(t.prix)))

  const superficieM2 = (() => {
    const n = parseFloat(superficieTerrain.replace(',', '.'))
    if (isNaN(n)) return undefined
    return Math.round(superficieUnite === 'ha' ? n * 10000 : n)
  })()

  const typeBackend = isTerrain ? 'terrain'
    : (typeBien === 'villa' || typeBien === 'maison' || isBoutique) ? 'maison'
    : isMeuble ? 'appart_meuble' : 'appart_vide'

  const sousType = typeBien === 'appartement' ? (isMeuble ? 'appart_meuble' : 'appartement')
    : typeBien === 'maison' ? 'maison_individuelle'
    : typeBien

  const montantBrut = (() => {
    const loyer  = parsePrix(prix) ?? 0
    const cEau   = parsePrix(cautionEau) ?? 0
    const cElec  = parsePrix(cautionElec) ?? 0
    const autres = autresFrais.reduce((a, f) => a + (parsePrix(f.prix) ?? 0), 0)
    return loyer * (avanceMois + loyerPrepayeMois) + cEau + cElec + autres
  })()

  const STEP_LABELS = ['Type & Prix', 'Localisation', isTerrain ? 'Terrain' : isBoutique ? 'Boutique' : 'Confort', 'Honoraires', 'Photos']

  const filteredQuartiers = quartierSearch.trim()
    ? QUARTIERS.filter(q => normalizeStr(q.nom).includes(normalizeStr(quartierSearch))).slice(0, 60)
    : QUARTIERS.slice(0, 40)

  const selectQuartier = (name: string, arr: string | null, vi: string | null) => {
    setQuartier(name); setArrondissement(arr ?? ''); setVille(vi ?? '')
    setQuartierSearch(name); setQuartierInputFocused(false)
  }
  const clearQuartier = () => { setQuartier(''); setArrondissement(''); setVille(''); setQuartierSearch('') }

  const labelFinition  = (v: string) => ({ ordinaire: 'Ordinaire', staffe_carele: 'Staffé', haut_standing: 'Haut Standing / VIP', villa: 'Villa' } as Record<string,string>)[v] ?? v
  const labelSanitaire = (v: string) =>
    v === 'interieur'      ? 'Sanitaire' :
    v === 'semi_interieur' ? 'Semi sanitaire' :
    v === 'cour'           ? 'Non sanitaire' :
    (sanitaireAutre.trim() || 'Autre à préciser')
  const labelCuisine   = (v: string) => v === 'separee_douche' ? 'Cuisine séparée de la douche' : v === 'americaine' ? 'Cuisine américaine' : (cuisineAutre.trim() || 'Autres')
  const labelCour      = (v: string) => v === 'entree_personnelle' ? 'Entrée personnelle' : 'Cour commune'
  const labelElec      = (v: string) => { const p = parsePrix(prixKwh); return v === 'sbee' ? 'SBEE' : v === 'decompteur' ? `Décompteur${p !== undefined ? ` (${Math.round(p)} FCFA/kWh)` : ''}` : 'Non' }
  const labelEau       = (v: string) => {
    const p = parsePrix(prixForage); const pm3 = parsePrix(prixM3)
    if (v === 'soneb')            return 'SONEB'
    if (v === 'decompteur_soneb') return `Décompteur SONEB${pm3 !== undefined ? ` (${Math.round(pm3)} FCFA/m³)` : ''}`
    if (v === 'forage') { const suf = forageGestion === 'voisins' ? ' (entre voisins)' : forageGestion === 'mensuel' ? ' (abonnement mensuel)' : ''; return `Forage${suf}${p !== undefined ? ` · ${Math.round(p)} FCFA` : ''}` }
    return 'Non'
  }

  const goNext = () => {
    if (step === 0) {
      if (!isMeuble && !parsePrix(prix)) { setError('Veuillez entrer le prix'); return }
      if (isMeuble && !hasAtLeastOneTarif) { setError('Renseignez au moins un tarif'); return }
    }
    if (step === 1 && !quartier.trim()) { setError('Veuillez sélectionner un quartier'); return }
    if (step === 2 && isTerrain && !titreTerrain.trim()) { setError('Veuillez donner un nom à ce bien'); return }
    if (step === 2 && isTerrain && !superficieM2) { setError('Veuillez indiquer la superficie du terrain'); return }
    setError('')
    if (step === 4) { handleCreate(); return }
    setStep(s => s + 1)
    window.scrollTo(0, 0)
  }

  const buildTarifsMeuble = () => {
    const t: any = {}
    if (parsePrix(prixLongSejour) !== undefined)      t.prix_long_sejour      = parsePrix(prixLongSejour)
    if (parsePrix(prixSejourRestreint) !== undefined)  t.prix_sejour_restreint = parsePrix(prixSejourRestreint)
    if (parsePrix(prixHeure) !== undefined)            t.prix_heure            = parsePrix(prixHeure)
    const autres = tarifsAutres.filter(x => parsePrix(x.prix) !== undefined)
    if (autres.length) t.autres = autres.map(x => ({ label: x.label.trim() || 'Autre', prix: parsePrix(x.prix) }))
    return t
  }

  const buildAmenites = () => {
    const a: any = { sous_type: sousType }
    if (proprietaireInfo) a.proprietaire_info = proprietaireInfo

    if (isTerrain) {
      if (documentTerrain) a.document = documentTerrain
      a.position = positionTerrain; a.angle_rue = angleRue; a.permission_construire = permissionConstruire
      if (permissionConstruire && descriptionConstruction.trim()) a.description_construction = descriptionConstruction.trim()
      if (estLoti !== null) a.loti = estLoti
      if (titreFoncier !== null) a.titre_foncier = titreFoncier
      const details = detailsSupplementaires.filter(d => d.label.trim() && d.valeur.trim())
      if (details.length) a.details_supplementaires = details.map(d => ({ label: d.label.trim(), valeur: d.valeur.trim() }))
      return a
    }

    if (sanitaire === 'interieur')      a.sanitaire = true
    if (sanitaire === 'semi_interieur') a.sanitaire_autre = 'Semi sanitaire'
    if (sanitaire === 'cour')           a.sanitaire = false
    if (sanitaire === 'autre' && sanitaireAutre.trim()) a.sanitaire_autre = sanitaireAutre.trim()
    if (finition) a.finition = finition
    a.disponibilite = disponibilite
    if (equipementsBonus.length || equipementsAutre.trim()) a.equipements = [...equipementsBonus, ...(equipementsAutre.trim() ? [equipementsAutre.trim()] : [])]
    if (alentours.length || alentoursAutre.trim()) a.voisinage = [...alentours, ...(alentoursAutre.trim() ? [alentoursAutre.trim()] : [])]

    if (isBoutique) {
      a.type_voie = typeVoie; a.visibilite = visibiliteBoutique; a.parking_clients = parkingClients
    } else {
      const cEau = parsePrix(cautionEau) ?? 0; const cElec = parsePrix(cautionElec) ?? 0
      a.type_cuisine = typeCuisine
      if (typeCuisine === 'autre' && cuisineAutre.trim()) a.cuisine_autre_detail = cuisineAutre.trim()
      a.type_cour = typeCour
      if (typeCour === 'commune') a.nb_voisins = nbVoisins
      if (typeCour === 'commune' && accesVehicule !== null) a.acces_vehicule = accesVehicule
      if (typeCour === 'commune' && accesVehicule === true) a.nb_vehicules = nbVehicules
      if (typeBien === 'chambre_salon') a.chambre_couloir = chambreACouloir
      a.avance_mois = avanceMois
      if (loyerPrepayeMois > 0) a.loyer_prepaye_mois = loyerPrepayeMois
      if (typeTransaction === 'location') a.echeance_mois = echeanceMois
      if (cEau  > 0) a.caution_eau  = cEau
      if (cElec > 0) a.caution_elec = cElec
      a.electricite = electricite
      if (electricite === 'decompteur' && parsePrix(prixKwh) !== undefined) a.prix_kwh = parsePrix(prixKwh)
      a.eau = eau
      if (eau === 'decompteur_soneb' && parsePrix(prixM3) !== undefined) a.prix_m3 = parsePrix(prixM3)
      if (eau === 'forage' && parsePrix(prixForage) !== undefined) a.prix_forage = parsePrix(prixForage)
      if (eau === 'forage' && forageGestion) a.forage_gestion = forageGestion
      if (isMeuble) a.tarifs_meuble = buildTarifsMeuble()
    }

    const validAutres = autresFrais.filter(f => parsePrix(f.prix) !== undefined)
    if (validAutres.length) a.autres_frais = validAutres.map(f => ({ label: f.label.trim() || 'Autre frais', montant: parsePrix(f.prix) }))
    return a
  }

  const buildPieces = () => {
    if (isTerrain || isBoutique) return []
    if (typeBien === 'entree_coucher') return [{ nom: 'Chambre', surface: 0 }, { nom: 'Entrée', surface: 0 }]
    if (typeBien === 'chambre_salon') {
      const p: any[] = []
      for (let i = 0; i < chambres; i++) p.push({ nom: 'Chambre', surface: 0 })
      for (let i = 0; i < salons;   i++) p.push({ nom: 'Salon',   surface: 0 })
      return p
    }
    const p: any[] = []
    for (let i = 0; i < chambres; i++) p.push({ nom: 'Chambre',       surface: 0 })
    for (let i = 0; i < salons;   i++) p.push({ nom: 'Salon',         surface: 0 })
    for (let i = 0; i < cuisines; i++) p.push({ nom: 'Cuisine',       surface: 0 })
    for (let i = 0; i < douches;  i++) p.push({ nom: 'Salle de bain', surface: 0 })
    return p
  }

  const handleCreate = async () => {
    if (submitting) return
    setSubmitting(true); setError('')
    try {
      let prixFinal: number
      if (isMeuble) {
        prixFinal = parsePrix(prixLongSejour) ?? parsePrix(prixSejourRestreint) ?? parsePrix(prixHeure)
          ?? (tarifsAutres.length ? parsePrix(tarifsAutres[0].prix) : undefined) ?? 0
      } else {
        prixFinal = parsePrix(prix) ?? 0
      }

      const notes = description.trim()
      const titre = isTerrain ? titreTerrain.trim() : ''
      const descFull = titre ? (notes ? `${titre}\n\n${notes}` : titre) : notes

      const body: any = {
        type: typeBackend,
        transaction: typeTransaction,
        prix: prixFinal,
        frais_visite: 500,
        description: descFull || undefined,
        localisation: {
          adresse: indicationAdresse.trim() || [quartier, arrondissement].filter(Boolean).join(', ') || quartier,
          ville: ville || quartier || undefined,
          quartier: quartier || undefined,
          latitude: 6.3654,
          longitude: 2.4183,
        },
        amenites: buildAmenites(),
      }

      if (isTerrain && superficieM2 !== undefined) {
        body.details_terrain = { superficie: superficieM2, cloture: false }
      } else if (typeBackend === 'appart_vide' || typeBackend === 'appart_meuble') {
        body.details_appart = { entree_personnelle: typeCour === 'entree_personnelle' }
      }

      const pieces = buildPieces()
      if (pieces.length) body.pieces = pieces

      const data = await postBien.create(body)
      const bien = data.data || data.bien || data

      if (photos.length > 0 && bien.id) {
        for (let i = 0; i < photos.length; i++) {
          try {
            await postBien.uploadPhoto(bien.id, photos[i])
            setUploadProgress(Math.round(((i + 1) / photos.length) * 100))
          } catch (_) {}
        }
      }
      if (video && bien.id) {
        try { await postBien.uploadVideo(bien.id, video) } catch (_) {}
      }

      sessionStorage.removeItem('proprietaire_info')
      sessionStorage.removeItem(DRAFT_KEY)
      setCreated(true)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors de la création')
      setSubmitting(false)
    }
  }

  // Écran succès
  if (created) {
    return (
      <div style={{ maxWidth: 480, margin: '64px auto', padding: '32px 24px', textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: BLUE + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={BLUE} strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--c-text)', marginBottom: 8 }}>Bien soumis avec succes</h2>
        <p style={{ fontSize: 13, color: 'var(--c-muted)', maxWidth: 320, margin: '0 auto 24px' }}>
          En attente de validation par l'administrateur. Vous serez notifie une fois approuve.
        </p>
        <button onClick={() => navigate('/mes-annonces')}
          style={{ padding: '12px 32px', borderRadius: 10, fontWeight: 700, background: BLUE, color: 'white', border: 'none', cursor: 'pointer', fontSize: 14 }}>
          Voir mes annonces
        </button>
      </div>
    )
  }

  const PW = 688

  return (
    <>
    {/* ── Sticky header : progression + proprio ── */}
    <div style={{ position: 'sticky', top: 0, zIndex: 20, background: '#fff', borderBottom: '1px solid var(--c-border)' }}>
      <div style={{ maxWidth: PW, width: '100%', margin: '0 auto', padding: '10px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <button onClick={() => step > 0 ? setStep(s => s - 1) : navigate('/mes-annonces')}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 7, fontSize: 11, fontWeight: 600, border: '1px solid var(--c-border)', background: 'var(--c-bg)', color: 'var(--c-muted)', cursor: 'pointer', flexShrink: 0 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 19l-7-7 7-7" />
            </svg>
            {step > 0 ? 'Retour' : 'Annuler'}
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-text)' }}>Nouveau bien</span>
            <span style={{ fontSize: 11, color: 'var(--c-muted)', marginLeft: 8 }}>{STEP_LABELS[step]}</span>
          </div>
          {proprietaireInfo && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 999, background: BLUE + '10', border: `1px solid ${BLUE}25`, flexShrink: 0 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={BLUE} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              <span style={{ fontSize: 11, fontWeight: 700, color: BLUE, whiteSpace: 'nowrap' }}>
                {proprietaireInfo.prenom} {proprietaireInfo.nom}
              </span>
            </div>
          )}
          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 999, border: `1px solid ${BLUE}40`, background: BLUE + '12', color: BLUE, flexShrink: 0 }}>
            {step + 1}/{STEP_LABELS.length}
          </span>
        </div>
        <div style={{ height: 3, borderRadius: 2, background: 'var(--c-border)' }}>
          <div style={{ height: '100%', borderRadius: 2, transition: 'width 0.4s ease', width: `${((step + 1) / STEP_LABELS.length) * 100}%`, background: BLUE }} />
        </div>
      </div>
    </div>

    {/* ── Contenu ── */}
    <div style={{ maxWidth: PW, width: '100%', margin: '0 auto', padding: '20px 16px 48px' }}>

      {error && (
        <div style={{ borderRadius: 10, padding: '12px 16px', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', marginBottom: 16 }}>
          <p style={{ fontSize: 14, color: '#EF4444', margin: 0 }}>{error}</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* ═══ ÉTAPE 0 : TYPE & PRIX ═══ */}
          {step === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Card>
                <Section title="Type de bien" />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {TYPES_BIEN.map(t => (
                    <button key={t.key} type="button" onClick={() => setTypeBien(t.key)}
                      style={{
                        padding: '10px 14px', borderRadius: 12, border: `2px solid`, fontSize: 12, fontWeight: 700, transition: 'all 0.15s',
                        borderColor: typeBien === t.key ? BLUE : 'var(--c-border)',
                        background: typeBien === t.key ? BLUE : 'transparent',
                        color: typeBien === t.key ? 'white' : 'var(--c-muted)',
                      }}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </Card>

              {isSmallUnit && (
                <Card>
                  <Section title="Sanitaires" />
                  <ChoiceList options={SANITAIRE_OPTS} value={sanitaire} onChange={onSelectSanitaire} onDeselect={() => setSanitaire(null)} />
                  {sanitaire === 'autre' && (
                    <input value={sanitaireAutre} onChange={e => setSanitaireAutre(e.target.value)}
                      placeholder="Précisez la configuration des sanitaires"
                      style={{ ...baseInput, marginTop: 8 }} />
                  )}
                  <div style={{ marginTop: 20 }}>
                    <Section title="Finition / Standing" />
                    <ChoiceList options={FINITION_OPTS} value={finition} onChange={onSelectFinition} />
                  </div>
                </Card>
              )}

              {peutEtreMeuble && (
                <Card>
                  <Section title="État du bien" />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <Chip label="Vide" active={!estMeuble} onClick={() => setEstMeuble(false)} />
                    <Chip label="Meublé / Guesthouse" active={estMeuble} onClick={() => setEstMeuble(true)} />
                  </div>
                </Card>
              )}

              <Card>
                <Section title="Transaction" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <Chip label="Location" active={typeTransaction === 'location'} onClick={() => setTypeTransaction('location')} />
                  <Chip label="Vente"    active={typeTransaction === 'vente'}    onClick={() => setTypeTransaction('vente')}    />
                </div>
              </Card>

              {isMeuble ? (
                <Card>
                  <Section title="Tarification (par durée de séjour)" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[
                      { label: 'Court séjour (par nuit)', value: prixSejourRestreint, onChange: setPrixSejourRestreint },
                      { label: 'Long séjour (mensuel)',   value: prixLongSejour,      onChange: setPrixLongSejour      },
                      { label: "À l'heure",               value: prixHeure,           onChange: setPrixHeure           },
                    ].map(row => (
                      <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: 'var(--c-text)' }}>{row.label}</span>
                        <div style={{ width: 128 }}><MoneyInput value={row.value} onChange={row.onChange} /></div>
                      </div>
                    ))}
                    {tarifsAutres.map((t, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input value={t.label}
                          onChange={e => setTarifsAutres(a => a.map((x, idx) => idx === i ? { ...x, label: e.target.value } : x))}
                          placeholder="Libellé" style={{ ...baseInput, flex: 1 }} />
                        <div style={{ width: 112 }}>
                          <MoneyInput value={t.prix} onChange={v => setTarifsAutres(a => a.map((x, idx) => idx === i ? { ...x, prix: v } : x))} />
                        </div>
                        <button type="button" onClick={() => setTarifsAutres(a => a.filter((_, idx) => idx !== i))} style={{ color: '#EF4444' }}>✕</button>
                      </div>
                    ))}
                    <button type="button" onClick={() => setTarifsAutres(a => [...a, { label: '', prix: '' }])}
                      style={{ fontSize: 12, fontWeight: 700, color: BLUE, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>+ Ajouter un tarif</button>
                  </div>
                </Card>
              ) : (
                <Card>
                  <Section title={typeTransaction === 'location' ? 'Loyer mensuel (FCFA)' : 'Prix de vente (FCFA)'} />
                  <MoneyInput value={prix} onChange={setPrix} />
                </Card>
              )}
            </div>
          )}

          {/* ═══ ÉTAPE 1 : LOCALISATION ═══ */}
          {step === 1 && (
            <Card>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 8, display: 'block', color: 'var(--c-muted)' }}>Quartier</label>
                  {quartier ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(72,199,116,0.45)', background: 'rgba(72,199,116,0.09)' }}>
                      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#48C774" strokeWidth={2.5} style={{ flexShrink: 0 }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#48C774' }}>
                        {quartier}{arrondissement ? `, ${arrondissement}` : ''}{ville ? `, ${ville}` : ''}
                      </span>
                      <button type="button" onClick={clearQuartier}
                        style={{ width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, background: 'rgba(72,199,116,0.2)', color: '#48C774', border: 'none', cursor: 'pointer' }}>✕</button>
                    </div>
                  ) : (
                    <div style={{ position: 'relative' }}>
                      <input ref={quartierInputRef} type="text" value={quartierSearch}
                        onChange={e => setQuartierSearch(e.target.value)}
                        onFocus={() => {
                          setQuartierInputFocused(true)
                          if (quartierInputRef.current) {
                            const r = quartierInputRef.current.getBoundingClientRect()
                            setDropdownRect({ top: r.bottom + 6, left: r.left, width: r.width })
                          }
                        }}
                        onBlur={() => { setQuartierInputFocused(false); setDropdownRect(null) }}
                        placeholder="Rechercher un quartier…"
                        style={{ ...baseInput, paddingLeft: 36 }} />
                      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--c-muted)', pointerEvents: 'none' }}>
                        <circle cx={11} cy={11} r={8} /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
                      </svg>
                      {quartierInputFocused && dropdownRect && (
                        <div style={{ position: 'fixed', top: dropdownRect.top, left: dropdownRect.left, width: dropdownRect.width, zIndex: 9999, background: '#fff', borderColor: 'var(--c-border)', border: '1px solid var(--c-border)', borderRadius: 12, maxHeight: 260, overflowY: 'auto' }}>
                          {filteredQuartiers.length === 0 ? (
                            quartierSearch.trim() ? (
                              <button type="button" onMouseDown={() => selectQuartier(quartierSearch.trim(), null, null)}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', textAlign: 'left', fontSize: 14, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-text)' }}>
                                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={BLUE} strokeWidth={2} style={{ flexShrink: 0 }}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span style={{ color: BLUE }}>Utiliser « {quartierSearch.trim()} »</span>
                              </button>
                            ) : (
                              <p style={{ padding: '12px 16px', fontSize: 14, color: 'var(--c-muted)', margin: 0 }}>Commencez à taper…</p>
                            )
                          ) : filteredQuartiers.map(q => (
                            <button key={q.nom + q.arrondissement} type="button"
                              onMouseDown={() => selectQuartier(q.nom, q.arrondissement, q.ville)}
                              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', textAlign: 'left', fontSize: 14, color: 'var(--c-text)', background: 'none', border: 'none', borderBottom: '1px solid var(--c-border)', cursor: 'pointer' }}
                              onMouseEnter={e => (e.currentTarget.style.background = 'var(--c-bg)')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ color: 'var(--c-muted)', flexShrink: 0 }}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span style={{ flex: 1 }}>{q.nom}</span>
                              <span style={{ fontSize: 11, color: 'var(--c-muted)' }}>{q.arrondissement}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {quartier && arrondissement && (
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 8, display: 'block', color: 'var(--c-muted)' }}>Arrondissement</label>
                    <div style={{ padding: '12px 16px', borderRadius: 12, border: '1px solid var(--c-border)', fontSize: 14, fontWeight: 600, background: 'var(--c-bg)', color: 'var(--c-muted)' }}>
                      {arrondissement}
                    </div>
                  </div>
                )}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 8, display: 'block', color: 'var(--c-muted)' }}>
                    Indication précise <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>(optionnel)</span>
                  </label>
                  <input value={indicationAdresse} onChange={e => setIndicationAdresse(e.target.value)}
                    placeholder="Ex: Derrière le CEG, à 200m du goudron..."
                    style={baseInput}
                    onFocus={e => (e.currentTarget.style.borderColor = BLUE)}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--c-border)')} />
                </div>
              </div>
            </Card>
          )}

          {/* ═══ ÉTAPE 2 : TERRAIN ═══ */}
          {step === 2 && isTerrain && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Card>
                <Section title="Nom du bien" required />
                <textarea value={titreTerrain} onChange={e => setTitreTerrain(e.target.value)} rows={2} maxLength={120}
                  placeholder="Ex: Parcelle bâtie à vendre en angle de rue à Cotonou Saint Jean"
                  style={{ ...baseInput, resize: 'none' }}
                  onFocus={e => (e.currentTarget.style.borderColor = BLUE)}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--c-border)')} />
              </Card>
              <Card>
                <Section title="Superficie" required />
                <div style={{ display: 'flex', gap: 10 }}>
                  <input type="number" value={superficieTerrain} onChange={e => setSuperficieTerrain(e.target.value)}
                    placeholder={superficieUnite === 'ha' ? 'Ex: 2.5' : 'Ex: 25000'}
                    style={{ ...baseInput, flex: 1, minWidth: 0 }}
                    onFocus={e => (e.currentTarget.style.borderColor = BLUE)}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--c-border)')} />
                  <div style={{ display: 'flex', borderRadius: 12, border: '1px solid var(--c-border)', padding: 4, flexShrink: 0, background: 'var(--c-bg)' }}>
                    {(['m2', 'ha'] as const).map(u => (
                      <button key={u} type="button"
                        onClick={() => {
                          if (u === superficieUnite) return
                          const n = parseFloat(superficieTerrain.replace(',', '.'))
                          if (!isNaN(n)) setSuperficieTerrain(String(u === 'ha' ? n / 10000 : Math.round(n * 10000)))
                          setSuperficieUnite(u)
                        }}
                        style={{ padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, transition: 'all 0.15s', border: 'none', cursor: 'pointer', background: superficieUnite === u ? BLUE : 'transparent', color: superficieUnite === u ? 'white' : 'var(--c-muted)' }}>
                        {u === 'm2' ? 'm²' : 'ha'}
                      </button>
                    ))}
                  </div>
                </div>
              </Card>
              <Card>
                <Section title="Document" />
                <ChoiceList options={DOCUMENT_TERRAIN_OPTS} value={documentTerrain} onChange={setDocumentTerrain} onDeselect={() => setDocumentTerrain(null)} />
              </Card>
              <Card>
                <Section title="Position" />
                <ChoiceList options={[
                  { value: 'bord_goudron', label: 'Au bord du goudron' },
                  { value: 'ruelle', label: 'Dans la ruelle' },
                  { value: 'autre', label: 'Autre' },
                ]} value={positionTerrain} onChange={setPositionTerrain} />
                <label style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--c-border)', cursor: 'pointer', background: 'var(--c-bg)' }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-text)' }}>Parcelle en angle de rue</span>
                  <input type="checkbox" checked={angleRue} onChange={e => setAngleRue(e.target.checked)} style={{ width: 20, height: 20, accentColor: BLUE }} />
                </label>
              </Card>
              <Card>
                <Section title="Permission de construire ?" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <Chip label="Oui" active={permissionConstruire}  onClick={() => setPermissionConstruire(true)}  />
                  <Chip label="Non" active={!permissionConstruire} onClick={() => setPermissionConstruire(false)} />
                </div>
                {permissionConstruire && (
                  <textarea value={descriptionConstruction} onChange={e => setDescriptionConstruction(e.target.value)} rows={3}
                    placeholder="Ex: Rez de deux chambres un salon, fondation R+5, 05 boutiques"
                    style={{ ...baseInput, marginTop: 12, resize: 'none' }}
                    onFocus={e => (e.currentTarget.style.borderColor = BLUE)}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--c-border)')} />
                )}
              </Card>
              <Card>
                <Section title="Zone lotie ?" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  <Chip label="Lotie"     active={estLoti === 'lotie'}     onClick={() => setEstLoti('lotie')}     />
                  <Chip label="Non lotie" active={estLoti === 'non_lotie'} onClick={() => setEstLoti('non_lotie')} />
                  <Chip label="Autre"     active={estLoti === 'autre'}     onClick={() => setEstLoti('autre')}     />
                </div>
              </Card>
              <Card>
                <Section title="Titre foncier ?" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <Chip label="Oui" active={titreFoncier === true}  onClick={() => setTitreFoncier(true)}  />
                  <Chip label="Non" active={titreFoncier === false} onClick={() => setTitreFoncier(false)} />
                </div>
              </Card>
              <Card>
                <Section title="Détails supplémentaires" />
                <p style={{ fontSize: 12, marginBottom: 12, color: 'var(--c-muted)' }}>Ajoutez toute information utile non couverte ci-dessus.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {detailsSupplementaires.map((d, i) => (
                    <div key={i} style={{ padding: 12, borderRadius: 12, border: '1px solid var(--c-border)', display: 'flex', flexDirection: 'column', gap: 8, background: 'var(--c-bg)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input value={d.label}
                          onChange={e => setDetailsSupplementaires(arr => arr.map((x, idx) => idx === i ? { ...x, label: e.target.value } : x))}
                          placeholder="Ex: Distance de la route" style={{ flex: 1, fontSize: 14, fontWeight: 600, outline: 'none', background: 'transparent', border: 'none', color: 'var(--c-text)' }} />
                        <button type="button" onClick={() => setDetailsSupplementaires(arr => arr.filter((_, idx) => idx !== i))} style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                      </div>
                      <input value={d.valeur}
                        onChange={e => setDetailsSupplementaires(arr => arr.map((x, idx) => idx === i ? { ...x, valeur: e.target.value } : x))}
                        placeholder="Ex: 50 mètres" style={{ width: '100%', borderRadius: 8, padding: '8px 12px', fontSize: 14, outline: 'none', background: '#fff', color: 'var(--c-text)', border: '1px solid var(--c-border)', boxSizing: 'border-box' }} />
                    </div>
                  ))}
                  <button type="button" onClick={() => setDetailsSupplementaires(arr => [...arr, { label: '', valeur: '' }])}
                    style={{ width: '100%', padding: '10px', borderRadius: 12, border: `1px solid ${BLUE}40`, fontSize: 12, fontWeight: 700, color: BLUE, background: 'none', cursor: 'pointer' }}>
                    + Ajouter un détail
                  </button>
                </div>
              </Card>
            </div>
          )}

          {/* ═══ ÉTAPE 2 : BOUTIQUE ═══ */}
          {step === 2 && isBoutique && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Card>
                <Section title="Position sur la voie" />
                <ChoiceList options={[
                  { value: 'goudron', label: 'Au bord du goudron (Premier choix)' },
                  { value: 'ruelle',  label: 'Dans la ruelle'                     },
                ]} value={typeVoie} onChange={setTypeVoie} />
              </Card>
              <Card>
                <Section title="Visibilité depuis la rue" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <Chip label="Façade directe"   active={visibiliteBoutique === 'directe'} onClick={() => setVisibiliteBoutique('directe')} />
                  <Chip label="Dans une galerie" active={visibiliteBoutique === 'galerie'} onClick={() => setVisibiliteBoutique('galerie')} />
                </div>
              </Card>
              <Card>
                <Section title="Parking clients" />
                <ChoiceList options={[
                  { value: 'aucun', label: 'Aucun parking'          },
                  { value: 'motos', label: 'Trottoir pour motos'    },
                  { value: 'dedie', label: 'Parking voitures dédié' },
                ]} value={parkingClients} onChange={setParkingClients} />
              </Card>
              <button type="button" onClick={() => setShowMoreOptions(v => !v)} style={{ fontSize: 14, fontWeight: 700, color: BLUE, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}>
                {showMoreOptions ? "Moins d'options" : "Plus d'options (facultatif)"}
              </button>
              {showMoreOptions && (
                <>
                  <Card>
                    <Section title="Commodités internes" />
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {EQUIPEMENTS_BOUTIQUE.map(o => (
                        <Chip key={o.value} label={o.label} active={equipementsBonus.includes(o.value)}
                          onClick={() => setEquipementsBonus(e => e.includes(o.value) ? e.filter(x => x !== o.value) : [...e, o.value])} />
                      ))}
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--c-muted)' }}>Autre (à préciser)</p>
                      <input value={equipementsAutre} onChange={e => setEquipementsAutre(e.target.value)}
                        placeholder="Ex: Vitrine lumineuse..." style={baseInput} onFocus={e => (e.currentTarget.style.borderColor = BLUE)} onBlur={e => (e.currentTarget.style.borderColor = 'var(--c-border)')} />
                    </div>
                  </Card>
                  <Card>
                    <Section title="À proximité" />
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {ALENTOURS_OPTS.map(o => (
                        <Chip key={o.value} label={o.label} active={alentours.includes(o.value)}
                          onClick={() => setAlentours(a => a.includes(o.value) ? a.filter(x => x !== o.value) : [...a, o.value])} />
                      ))}
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--c-muted)' }}>Autre lieu (à préciser)</p>
                      <input value={alentoursAutre} onChange={e => setAlentoursAutre(e.target.value)}
                        placeholder="Ex: Gare routière..." style={baseInput} onFocus={e => (e.currentTarget.style.borderColor = BLUE)} onBlur={e => (e.currentTarget.style.borderColor = 'var(--c-border)')} />
                    </div>
                  </Card>
                </>
              )}
              <Card>
                <Section title="Disponibilité" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <Chip label="Immédiate"             active={disponibilite === 'immediate'}   onClick={() => setDisponibilite('immediate')}   />
                  <Chip label="En finition / Bientôt" active={disponibilite === 'en_finition'} onClick={() => setDisponibilite('en_finition')} />
                </div>
              </Card>
            </div>
          )}

          {/* ═══ ÉTAPE 2 : RÉSIDENTIEL ═══ */}
          {step === 2 && !isTerrain && !isBoutique && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {showPieces && (
                <Card>
                  <Section title="Nombre de pièces" />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <Counter label="Chambres" value={chambres} onChange={setChambres} min={1} />
                    <Counter label="Salons"   value={salons}   onChange={setSalons}   />
                    {typeBien !== 'chambre_salon' && (
                      <>
                        <Counter label="Cuisines" value={cuisines} onChange={setCuisines} />
                        <Counter label="Douches"  value={douches}  onChange={setDouches}  />
                      </>
                    )}
                  </div>
                </Card>
              )}
              {!isSmallUnit && (
                <Card>
                  <Section title="Sanitaires" />
                  <ChoiceList options={SANITAIRE_OPTS} value={sanitaire} onChange={onSelectSanitaire} onDeselect={() => setSanitaire(null)} />
                  {sanitaire === 'autre' && (
                    <input value={sanitaireAutre} onChange={e => setSanitaireAutre(e.target.value)}
                      placeholder="Précisez la configuration des sanitaires"
                      style={{ ...baseInput, marginTop: 8 }}
                      onFocus={e => (e.currentTarget.style.borderColor = BLUE)}
                      onBlur={e => (e.currentTarget.style.borderColor = 'var(--c-border)')} />
                  )}
                  <div style={{ marginTop: 20 }}>
                    <Section title="Finition / Standing" />
                    <ChoiceList options={FINITION_OPTS} value={finition} onChange={onSelectFinition} />
                  </div>
                </Card>
              )}
              <Card>
                <Section title="Type de cuisine" />
                <ChoiceList options={CUISINE_OPTS} value={typeCuisine} onChange={setTypeCuisine} />
                {typeCuisine === 'autre' && (
                  <input value={cuisineAutre} onChange={e => setCuisineAutre(e.target.value)}
                    placeholder="Précisez le type de cuisine"
                    style={{ ...baseInput, marginTop: 8 }}
                    onFocus={e => (e.currentTarget.style.borderColor = BLUE)}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--c-border)')} />
                )}
              </Card>
              {typeBien === 'chambre_salon' && (
                <Card>
                  <Section title="Chambre à couloir ?" />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <Chip label="Oui" active={chambreACouloir}  onClick={() => setChambreACouloir(true)}  />
                    <Chip label="Non" active={!chambreACouloir} onClick={() => setChambreACouloir(false)} />
                  </div>
                </Card>
              )}
              <Card>
                <Section title="Type de cour / Accès" />
                <ChoiceList options={COUR_OPTS} value={typeCour} onChange={setTypeCour} />
                {COUR_DESC[typeCour] && <p style={{ fontSize: 12, fontStyle: 'italic', marginTop: 8, color: BLUE }}>{COUR_DESC[typeCour]}</p>}
                {typeCour === 'commune' && (
                  <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: 'var(--c-muted)' }}>Nombre de voisins dans la cour</p>
                      <Counter label="Voisins" value={nbVoisins} onChange={setNbVoisins} />
                    </div>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: 'var(--c-muted)' }}>Accès véhicule</p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <Chip label="Oui" active={accesVehicule === true}  onClick={() => setAccesVehicule(true)}  />
                        <Chip label="Non" active={accesVehicule === false} onClick={() => setAccesVehicule(false)} />
                      </div>
                    </div>
                    {accesVehicule === true && (
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: 'var(--c-muted)' }}>Nombre de véhicules</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {[1, 2, 3, 4, 5].map(n => (
                            <Chip key={n} label={`${n}`} active={nbVehicules === n} onClick={() => setNbVehicules(n)} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
              <Card>
                <Section title="Avance (mois de loyer)" />
                <NumberPicker presets={[0, 1, 2, 3, 4, 5]} unit={n => n === 0 ? 'Aucun' : `${n} mois`}
                  value={avanceMois} isCustom={avanceAutre}
                  onPick={n => { setAvanceMois(n); setAvanceAutre(false) }}
                  onCustomStart={() => setAvanceAutre(true)}
                  customText={avanceAutreText}
                  onCustomText={t => { setAvanceAutreText(t); setAvanceMois(Number(t) || 0) }}
                />
                {(parsePrix(prix) ?? 0) > 0 && avanceMois > 0 && (
                  <p style={{ fontSize: 14, fontWeight: 700, marginTop: 8, color: BLUE }}>= {formatFcfa((parsePrix(prix) ?? 0) * avanceMois)}</p>
                )}
              </Card>
              {typeTransaction === 'location' && (
                <Card>
                  <Section title="Échéance du mois" />
                  <NumberPicker presets={[5, 10, 15, 20, 25, 30]} unit={n => `${n}`}
                    value={echeanceMois} isCustom={echeanceAutre}
                    onPick={n => { setEcheanceMois(n); setEcheanceAutre(false) }}
                    onCustomStart={() => setEcheanceAutre(true)}
                    customText={echeanceAutreText}
                    onCustomText={t => { setEcheanceAutreText(t); setEcheanceMois(Number(t) || 5) }}
                  />
                </Card>
              )}
              <Card>
                <Section title="Loyer prépayé (optionnel)" />
                <NumberPicker presets={[0, 1, 2, 3]} unit={n => n === 0 ? 'Aucun' : `${n} mois`}
                  value={loyerPrepayeMois} isCustom={loyerPrepayeAutre}
                  onPick={n => { setLoyerPrepayeMois(n); setLoyerPrepayeAutre(false) }}
                  onCustomStart={() => setLoyerPrepayeAutre(true)}
                  customText={loyerPrepayeAutreText}
                  onCustomText={t => { setLoyerPrepayeAutreText(t); setLoyerPrepayeMois(Number(t) || 0) }}
                />
                {loyerPrepayeMois > 0 && (
                  <p style={{ fontSize: 12, fontStyle: 'italic', marginTop: 8, color: BLUE }}>
                    {loyerPrepayeMois === 1
                      ? 'Le locataire ne paiera pas de loyer pour le 1er mois après intégration.'
                      : `Le locataire ne paiera pas de loyer pour les ${loyerPrepayeMois} premiers mois après intégration.`}
                  </p>
                )}
              </Card>
              <Card>
                <Section title="Électricité" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {([
                    { value: 'non', label: 'Non', sub: '' },
                    { value: 'sbee', label: 'SBEE', sub: 'Branchement direct réseau national', logo: (
                      <svg width="36" height="20" viewBox="0 0 72 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="72" height="30" rx="4" fill="#F5A623"/>
                        <text x="36" y="21" textAnchor="middle" fontFamily="sans-serif" fontWeight="bold" fontSize="14" fill="white">SBEE</text>
                      </svg>
                    )},
                    { value: 'decompteur', label: 'Décompteur', sub: 'Compteur individuel dans le logement' },
                  ] as any[]).map(o => {
                    const isActive = electricite === o.value
                    return (
                      <button key={o.value} type="button" onClick={() => setElectricite(o.value)}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '12px 16px', borderRadius: 12, border: `2px solid ${isActive ? BLUE : 'var(--c-border)'}`, textAlign: 'left', transition: 'all 0.15s', background: isActive ? BLUE + '18' : 'var(--c-bg)', cursor: 'pointer' }}>
                        <span>
                          <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: isActive ? BLUE : 'var(--c-text)' }}>{o.label}</span>
                          {o.sub && <span style={{ display: 'block', fontSize: 12, marginTop: 2, color: 'var(--c-muted)' }}>{o.sub}</span>}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          {o.logo}
                          {isActive && <span style={{ fontWeight: 700, color: BLUE }}>✓</span>}
                        </div>
                      </button>
                    )
                  })}
                </div>
                {electricite === 'decompteur' && (
                  <div style={{ marginTop: 12 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: 'var(--c-muted)' }}>Prix du kWh</p>
                    <MoneyInput value={prixKwh} onChange={setPrixKwh} placeholder="Ex: 150" />
                  </div>
                )}
              </Card>
              <Card>
                <Section title="Eau" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {([
                    { value: 'non', label: 'Non', sub: '' },
                    { value: 'soneb', label: 'SONEB', sub: 'Branchement direct réseau SONEB', logo: (
                      <svg width="52" height="20" viewBox="0 0 90 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="90" height="30" rx="4" fill="#0077CC"/>
                        <text x="45" y="21" textAnchor="middle" fontFamily="sans-serif" fontWeight="bold" fontSize="14" fill="white">SONEB</text>
                      </svg>
                    )},
                    { value: 'decompteur_soneb', label: 'Décompteur SONEB', sub: 'Compteur individuel SONEB' },
                    { value: 'forage', label: 'Forage', sub: 'Forage dans la cour' },
                  ] as any[]).map(o => {
                    const isActive = eau === o.value
                    return (
                      <button key={o.value} type="button" onClick={() => setEau(o.value)}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '12px 16px', borderRadius: 12, border: `2px solid ${isActive ? BLUE : 'var(--c-border)'}`, textAlign: 'left', transition: 'all 0.15s', background: isActive ? BLUE + '18' : 'var(--c-bg)', cursor: 'pointer' }}>
                        <span>
                          <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: isActive ? BLUE : 'var(--c-text)' }}>{o.label}</span>
                          {o.sub && <span style={{ display: 'block', fontSize: 12, marginTop: 2, color: 'var(--c-muted)' }}>{o.sub}</span>}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          {o.logo}
                          {isActive && <span style={{ fontWeight: 700, color: BLUE }}>✓</span>}
                        </div>
                      </button>
                    )
                  })}
                </div>
                {eau === 'decompteur_soneb' && (
                  <div style={{ marginTop: 12 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: 'var(--c-muted)' }}>Prix du m³</p>
                    <MoneyInput value={prixM3} onChange={setPrixM3} placeholder="Ex: 150" />
                  </div>
                )}
                {eau === 'forage' && (
                  <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: 'var(--c-muted)' }}>Prix du forage</p>
                      <MoneyInput value={prixForage} onChange={setPrixForage} placeholder="Ex: 50000" />
                    </div>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: 'var(--c-muted)' }}>Comment c'est géré ?</p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <Chip label="Entre voisins"      active={forageGestion === 'voisins'} onClick={() => setForageGestion(g => g === 'voisins' ? null : 'voisins')} />
                        <Chip label="Abonnement mensuel" active={forageGestion === 'mensuel'} onClick={() => setForageGestion(g => g === 'mensuel' ? null : 'mensuel')} />
                      </div>
                      {forageGestion === 'voisins' && <p style={{ fontSize: 12, fontStyle: 'italic', marginTop: 8, color: BLUE }}>Le coût du forage est partagé entre les voisins.</p>}
                      {forageGestion === 'mensuel' && <p style={{ fontSize: 12, fontStyle: 'italic', marginTop: 8, color: BLUE }}>Chaque locataire paie un abonnement mensuel fixe.</p>}
                    </div>
                  </div>
                )}
              </Card>
              {(eau === 'soneb' || eau === 'decompteur_soneb' || electricite !== 'non') && (
                <Card>
                  <Section title="Caution" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {(eau === 'soneb' || eau === 'decompteur_soneb') && (
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--c-muted)' }}>Caution eau</p>
                        <MoneyInput value={cautionEau} onChange={setCautionEau} />
                        <p style={{ fontSize: 11, marginTop: 4, color: 'var(--c-muted)' }}>Saisir 0 si pas de caution eau</p>
                      </div>
                    )}
                    {electricite !== 'non' && (
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--c-muted)' }}>
                          Caution électricité ({electricite === 'sbee' ? 'SBEE' : 'Décompteur'})
                        </p>
                        <MoneyInput value={cautionElec} onChange={setCautionElec} />
                        <p style={{ fontSize: 11, marginTop: 4, color: 'var(--c-muted)' }}>Saisir 0 si pas de caution électricité</p>
                      </div>
                    )}
                  </div>
                </Card>
              )}
              {(!isSmallUnit || finition === 'haut_standing') && (
                <>
                  <button type="button" onClick={() => setShowMoreOptions(v => !v)} style={{ fontSize: 14, fontWeight: 700, color: BLUE, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}>
                    {showMoreOptions ? "Moins d'options" : "Plus d'options (facultatif)"}
                  </button>
                  {showMoreOptions && (
                    <>
                      {!isSmallUnit && (
                        <Card>
                          <Section title="Équipements & Atouts" />
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {EQUIPEMENTS_RESIDENTIEL.map(o => (
                              <Chip key={o.value} label={o.label} active={equipementsBonus.includes(o.value)}
                                onClick={() => setEquipementsBonus(e => e.includes(o.value) ? e.filter(x => x !== o.value) : [...e, o.value])} />
                            ))}
                          </div>
                          <div style={{ marginTop: 12 }}>
                            <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--c-muted)' }}>Autre équipement (à préciser)</p>
                            <input value={equipementsAutre} onChange={e => setEquipementsAutre(e.target.value)}
                              placeholder="Ex: Piscine, Salle de sport..."
                              style={baseInput}
                              onFocus={e => (e.currentTarget.style.borderColor = BLUE)}
                              onBlur={e => (e.currentTarget.style.borderColor = 'var(--c-border)')} />
                          </div>
                        </Card>
                      )}
                      <Card>
                        <Section title="À proximité du bien" />
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {ALENTOURS_OPTS.map(o => (
                            <Chip key={o.value} label={o.label} active={alentours.includes(o.value)}
                              onClick={() => setAlentours(a => a.includes(o.value) ? a.filter(x => x !== o.value) : [...a, o.value])} />
                          ))}
                        </div>
                        <div style={{ marginTop: 12 }}>
                          <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--c-muted)' }}>Autre lieu proche (à préciser)</p>
                          <input value={alentoursAutre} onChange={e => setAlentoursAutre(e.target.value)}
                            placeholder="Ex: Stade, Plage privée..."
                            style={baseInput}
                            onFocus={e => (e.currentTarget.style.borderColor = BLUE)}
                            onBlur={e => (e.currentTarget.style.borderColor = 'var(--c-border)')} />
                        </div>
                      </Card>
                    </>
                  )}
                </>
              )}
              <Card>
                <Section title="Disponibilité" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <Chip label="Immédiate"             active={disponibilite === 'immediate'}   onClick={() => setDisponibilite('immediate')}   />
                  <Chip label="En finition / Bientôt" active={disponibilite === 'en_finition'} onClick={() => setDisponibilite('en_finition')} />
                </div>
              </Card>
            </div>
          )}

          {/* ═══ ÉTAPE 3 : HONORAIRES ═══ */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Card>
                <Section title="Notes / Précisions (optionnel)" />
                <p style={{ fontSize: 12, marginBottom: 12, color: 'var(--c-muted)' }}>Ces informations s'afficheront dans votre annonce.</p>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={8}
                  placeholder="Points forts, accès, conditions particulières, règles de la maison..."
                  style={{ ...baseInput, resize: 'none' }}
                  onFocus={e => (e.currentTarget.style.borderColor = BLUE)}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--c-border)')} />
              </Card>
              {!isTerrain && (
                <Card>
                  <Section title="Autres frais (optionnel)" />
                  <p style={{ fontSize: 12, marginBottom: 12, color: 'var(--c-muted)' }}>Frais supplémentaires inclus dans le total à payer à l'intégration.</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {autresFrais.map((f, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input value={f.label}
                          onChange={e => setAutresFrais(a => a.map((x, idx) => idx === i ? { ...x, label: e.target.value } : x))}
                          placeholder="Libellé (ex: Frais de dossier)"
                          style={{ ...baseInput, flex: 1 }} />
                        <div style={{ width: 112 }}>
                          <MoneyInput value={f.prix} onChange={v => setAutresFrais(a => a.map((x, idx) => idx === i ? { ...x, prix: v } : x))} />
                        </div>
                        <button type="button" onClick={() => setAutresFrais(a => a.filter((_, idx) => idx !== i))} style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                      </div>
                    ))}
                    <button type="button" onClick={() => setAutresFrais(a => [...a, { label: '', prix: '' }])}
                      style={{ fontSize: 12, fontWeight: 700, color: BLUE, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>+ Ajouter un frais</button>
                  </div>
                </Card>
              )}
              {!isTerrain && typeTransaction === 'location' && montantBrut > 0 && (
                <div style={{ borderRadius: 16, border: `1px solid ${BLUE}30`, padding: 16, background: BLUE + '0E' }}>
                  <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, color: 'var(--c-muted)' }}>Montant minimum à verser avant intégration</p>
                  <p style={{ fontSize: 24, fontWeight: 700, color: BLUE }}>{formatFcfa(montantBrut)}</p>
                </div>
              )}
            </div>
          )}

          {/* ═══ ÉTAPE 4 : RÉCAP + PHOTOS + VIDÉO ═══ */}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Card>
                <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: 'var(--c-text)' }}>Récapitulatif de votre annonce</p>
                <RecapSection title="Type de bien" items={[
                  TYPES_BIEN.find(t => t.key === typeBien)?.label ?? typeBien,
                  ...(finition ? [labelFinition(finition)] : []),
                  ...(sanitaire ? [labelSanitaire(sanitaire)] : []),
                  ...(isMeuble ? ['Meublé / Guesthouse'] : []),
                ]} />
                <RecapSection title="Localisation" items={[
                  ...(quartier       ? [`Quartier : ${quartier}`]            : []),
                  ...(arrondissement ? [`Arrondissement : ${arrondissement}`] : []),
                  ...(ville          ? [`Ville : ${ville}`]                   : []),
                  ...(indicationAdresse.trim() ? [`Adresse : ${indicationAdresse.trim()}`] : []),
                ]} />
                {!isTerrain && (parsePrix(prix) ?? 0) > 0 && (
                  <RecapSection title="Prix" items={[
                    `${typeTransaction === 'location' ? 'Loyer mensuel' : 'Prix de vente'} : ${formatFcfa(parsePrix(prix) ?? 0)}`
                  ]} />
                )}
                {!isTerrain && !isBoutique && typeTransaction === 'location' && (
                  <>
                    <RecapSection title="Conditions d'entrée" items={[
                      avanceMois > 0
                        ? `Avance : ${avanceMois} mois × ${formatFcfa(parsePrix(prix) ?? 0)} = ${formatFcfa((parsePrix(prix) ?? 0) * avanceMois)}`
                        : 'Avance : Aucune',
                      ...(loyerPrepayeMois > 0 ? [`Loyer prépayé : ${loyerPrepayeMois} mois`] : []),
                      ...((parsePrix(cautionEau)  ?? 0) > 0 ? [`Caution eau : ${formatFcfa(parsePrix(cautionEau)  ?? 0)}`] : []),
                      ...((parsePrix(cautionElec) ?? 0) > 0 ? [`Caution électricité : ${formatFcfa(parsePrix(cautionElec) ?? 0)}`] : []),
                    ]} />
                    {montantBrut > 0 && (
                      <div style={{ borderRadius: 12, padding: '14px', marginBottom: 8, background: BLUE + '12', border: `1px solid ${BLUE}30` }}>
                        <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, color: 'var(--c-muted)' }}>Montant minimum à verser avant intégration</p>
                        <p style={{ fontSize: 20, fontWeight: 700, color: BLUE }}>{formatFcfa(montantBrut)}</p>
                      </div>
                    )}
                  </>
                )}
                {!isTerrain && !isBoutique && showPieces && (
                  <RecapSection title="Pièces" items={[
                    `${chambres} chambre${chambres > 1 ? 's' : ''}`,
                    `${salons} salon${salons > 1 ? 's' : ''}`,
                    ...(typeBien !== 'chambre_salon' ? [`${cuisines} cuisine${cuisines > 1 ? 's' : ''}`, `${douches} douche${douches > 1 ? 's' : ''}`] : []),
                  ]} />
                )}
                {!isTerrain && !isBoutique && (
                  <RecapSection title="Confort" items={[
                    `Cuisine : ${labelCuisine(typeCuisine)}`,
                    `Accès / Cour : ${labelCour(typeCour)}`,
                    ...(typeCour === 'commune' ? [`Voisins : ${nbVoisins}`] : []),
                    ...(typeCour === 'commune' && accesVehicule !== null ? [`Accès véhicule : ${accesVehicule ? `Oui (${nbVehicules} véhicule${nbVehicules > 1 ? 's' : ''})` : 'Non'}`] : []),
                    `Électricité : ${labelElec(electricite)}`,
                    `Eau : ${labelEau(eau)}`,
                    ...(typeBien === 'chambre_salon' ? [`Chambre à couloir : ${chambreACouloir ? 'Oui' : 'Non'}`] : []),
                  ]} />
                )}
                {equipementsBonus.length > 0 || equipementsAutre.trim() ? (
                  <RecapSection title="Équipements" items={[
                    ...equipementsBonus.map(e =>
                      (EQUIPEMENTS_RESIDENTIEL.find(o => o.value === e) ?? EQUIPEMENTS_BOUTIQUE.find(o => o.value === e))?.label ?? e
                    ),
                    ...(equipementsAutre.trim() ? [equipementsAutre.trim()] : []),
                  ]} />
                ) : null}
                {alentours.length > 0 || alentoursAutre.trim() ? (
                  <RecapSection title="À proximité" items={[
                    ...alentours.map(a => ALENTOURS_OPTS.find(o => o.value === a)?.label ?? a),
                    ...(alentoursAutre.trim() ? [alentoursAutre.trim()] : []),
                  ]} />
                ) : null}
                {!isTerrain && (
                  <RecapSection title="Disponibilité" items={[
                    disponibilite === 'immediate' ? 'Disponible immédiatement' : 'En finition — Bientôt disponible'
                  ]} />
                )}
                {autresFrais.filter(f => parsePrix(f.prix) !== undefined).length > 0 && (
                  <RecapSection title="Autres frais" items={autresFrais
                    .filter(f => parsePrix(f.prix) !== undefined)
                    .map(f => `${f.label.trim() || 'Autre frais'} : ${formatFcfa(parsePrix(f.prix)!)}`)} />
                )}
                {description.trim() && <RecapSection title="Notes" items={[description.trim()]} />}
                {proprietaireInfo && (
                  <RecapSection title="Propriétaire" items={[
                    `${proprietaireInfo.prenom} ${proprietaireInfo.nom}`,
                    proprietaireInfo.telephone,
                    ...(proprietaireInfo.email ? [proprietaireInfo.email] : []),
                  ]} />
                )}
              </Card>

              {/* Photos */}
              <Card>
                <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, color: 'var(--c-text)' }}>Photos du bien</p>
                <p style={{ fontSize: 12, marginBottom: 16, color: 'var(--c-muted)' }}>Maximum 5 photos (PNG, JPEG, WEBP) — les photos augmentent les visites de 3×</p>
                {photos.length < 5 && (
                  <label style={{ display: 'block', border: '2px dashed var(--c-border)', borderRadius: 16, padding: 32, textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = BLUE)}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--c-border)')}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                      <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} style={{ color: 'var(--c-muted)' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-text)' }}>Choisir des photos</p>
                    <p style={{ fontSize: 12, marginTop: 4, color: 'var(--c-muted)' }}>JPG, PNG, WEBP (max 5 photos)</p>
                    <input type="file" multiple accept="image/png,image/jpeg,image/webp" style={{ display: 'none' }}
                      onChange={e => {
                        const files = Array.from(e.target.files || []).slice(0, 5 - photos.length)
                        setPhotos(p => [...p, ...files].slice(0, 5))
                      }} />
                  </label>
                )}
                {photos.length > 0 && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 12 }}>
                      {photos.map((f, i) => (
                        <div key={i} style={{ position: 'relative', aspectRatio: '1/1' }}>
                          <img src={URL.createObjectURL(f)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }} />
                          <button type="button" onClick={() => setPhotos(p => p.filter((_, idx) => idx !== i))}
                            style={{ position: 'absolute', top: 4, right: 4, width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>
                            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                    <p style={{ fontSize: 11, marginTop: 8, color: 'var(--c-muted)' }}>
                      {photos.length}/5 photo{photos.length > 1 ? 's' : ''} — encore {5 - photos.length} possible{5 - photos.length > 1 ? 's' : ''}
                    </p>
                  </>
                )}
                {submitting && uploadProgress > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4, color: 'var(--c-muted)' }}>
                      <span>Upload photos…</span><span>{uploadProgress}%</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 4, background: 'var(--c-bg)' }}>
                      <div style={{ height: '100%', borderRadius: 4, transition: 'width 0.3s', width: `${uploadProgress}%`, background: BLUE }} />
                    </div>
                  </div>
                )}
              </Card>

              {/* Vidéo */}
              <Card>
                <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, color: 'var(--c-text)' }}>
                  Vidéo du bien <span style={{ fontWeight: 400, fontSize: 12, color: 'var(--c-muted)' }}>(optionnel)</span>
                </p>
                <p style={{ fontSize: 12, marginBottom: 16, color: 'var(--c-muted)' }}>Maximum 1 vidéo (MP4 uniquement)</p>
                {video ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, border: '1px solid var(--c-border)', background: 'var(--c-bg)' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: BLUE + '20' }}>
                      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ color: BLUE }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span style={{ flex: 1, fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--c-text)' }}>{video.name}</span>
                    <button type="button" onClick={() => setVideo(null)}
                      style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0, background: '#EF4444', border: 'none', cursor: 'pointer' }}>
                      <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <label style={{ display: 'block', border: '2px dashed var(--c-border)', borderRadius: 16, padding: 28, textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = BLUE)}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--c-border)')}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                      <svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} style={{ color: 'var(--c-muted)' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-text)' }}>Ajouter une vidéo (MP4)</p>
                    <input type="file" accept="video/mp4" style={{ display: 'none' }}
                      onChange={e => { const f = e.target.files?.[0]; if (f) setVideo(f) }} />
                  </label>
                )}
              </Card>
            </div>
          )}

      </div>

      {/* CTA fixé en bas */}
      <div style={{ position: 'sticky', bottom: 0, marginTop: 24, padding: '12px 0', background: 'var(--c-bg)', borderTop: '1px solid var(--c-border)' }}>
        <button onClick={goNext} disabled={submitting}
          style={{ display: 'block', width: '100%', maxWidth: 400, margin: '0 auto', padding: '12px 32px', borderRadius: 10, fontSize: 14, fontWeight: 700, background: BLUE, color: 'white', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1 }}>
          {submitting ? 'Publication...' : step < 4 ? 'Continuer' : 'Publier le bien'}
        </button>
      </div>
    </div>
    </>
  )
}
