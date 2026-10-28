import { useMemo, useState } from 'react'
import { Card, Section } from '../formUi'
import { BLUE, baseInput } from '../formStyles'
import { BENIN_LOCATION_DATA } from '../../../data/beninLocations'
import { getGeocoding } from '../../../api/getGeocoding'
import { apiMessage } from '../../../utils/apiMessage'
import { adresseComplete } from './guesthouseForm'
import { Libelle, Texte, type EtapeProps } from './ui'

type Quartier = { nom: string; arrondissement: string; ville: string }

const QUARTIERS: Quartier[] = Object.entries(BENIN_LOCATION_DATA).flatMap(([ville, arrs]) =>
  Object.entries(arrs).flatMap(([arrondissement, qs]) => qs.map(nom => ({ nom, arrondissement, ville }))),
)

const normaliser = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export default function EtapeLocalisation({ form, maj }: EtapeProps) {
  const [recherche, setRecherche] = useState('')
  const [manuel, setManuel] = useState(false)
  const [verification, setVerification] = useState<'idle' | 'en_cours' | 'ok' | 'erreur'>(
    form.latitude !== null ? 'ok' : 'idle',
  )
  const [erreurPosition, setErreurPosition] = useState('')

  const resultats = useMemo(() => {
    const q = normaliser(recherche.trim())
    return q ? QUARTIERS.filter(x => normaliser(x.nom).includes(q)).slice(0, 30) : []
  }, [recherche])

  // Toute modification de l'adresse invalide la position vérifiée
  const majAdresse = (patch: Parameters<EtapeProps['maj']>[0]) => {
    maj({ ...patch, latitude: null, longitude: null })
    setVerification('idle')
  }

  const choisir = (q: Quartier) => {
    majAdresse({ quartier: q.nom, arrondissement: q.arrondissement, ville: q.ville })
    setRecherche('')
    setManuel(false)
  }

  const verifierPosition = async () => {
    setVerification('en_cours')
    setErreurPosition('')
    try {
      const res = await getGeocoding.geocoder(adresseComplete(form))
      maj({ latitude: res.latitude, longitude: res.longitude })
      setVerification('ok')
    } catch (err) {
      setVerification('erreur')
      setErreurPosition(apiMessage(err) ?? 'Adresse introuvable : précisez le repère et réessayez.')
    }
  }

  return (
    <Card>
      <Section title="Localisation" required />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <Libelle>Quartier</Libelle>
          {form.quartier && !manuel ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, border: '1px solid var(--t-green-bd)', background: 'var(--t-green-bg)' }}>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--s-green)' }}>
                {[form.quartier, form.arrondissement, form.ville].filter(Boolean).join(', ')}
              </span>
              <button type="button" aria-label="Changer de quartier"
                onClick={() => majAdresse({ quartier: '', arrondissement: '', ville: '' })}
                style={{ border: 'none', background: 'none', cursor: 'pointer', fontWeight: 700, color: 'var(--s-green)' }}>✕</button>
            </div>
          ) : manuel ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
              <Texte value={form.quartier} onChange={v => majAdresse({ quartier: v })} placeholder="Quartier" maxLength={100} />
              <Texte value={form.arrondissement} onChange={v => majAdresse({ arrondissement: v })} placeholder="Arrondissement (facultatif)" maxLength={100} />
              <Texte value={form.ville} onChange={v => majAdresse({ ville: v })} placeholder="Ville" maxLength={100} />
            </div>
          ) : (
            <>
              <input value={recherche} onChange={e => setRecherche(e.target.value)}
                placeholder="Rechercher un quartier…" style={baseInput} />
              {recherche.trim() && (
                <div style={{ marginTop: 6, border: '1px solid var(--c-border)', borderRadius: 12, maxHeight: 240, overflowY: 'auto', background: 'var(--c-card)' }}>
                  {resultats.map(q => (
                    <button key={`${q.ville}-${q.arrondissement}-${q.nom}`} type="button" onClick={() => choisir(q)}
                      style={{ width: '100%', display: 'flex', justifyContent: 'space-between', padding: '10px 16px', border: 'none', borderBottom: '1px solid var(--c-border)', background: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--c-text)', textAlign: 'left' }}>
                      <span>{q.nom}</span>
                      <span style={{ fontSize: 11, color: 'var(--c-muted)' }}>{q.arrondissement} · {q.ville}</span>
                    </button>
                  ))}
                  <button type="button" onClick={() => { setManuel(true); majAdresse({ quartier: recherche.trim(), arrondissement: '', ville: '' }) }}
                    style={{ width: '100%', padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: BLUE, textAlign: 'left' }}>
                    Le quartier n’est pas dans la liste : saisir « {recherche.trim()} »
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <div>
          <Libelle facultatif>Repère d’accès</Libelle>
          <Texte value={form.repere} onChange={v => majAdresse({ repere: v })} maxLength={150}
            placeholder="Ex. Derrière la station Total, portail bleu" />
        </div>

        <div>
          <button type="button" onClick={verifierPosition}
            disabled={!form.quartier.trim() || verification === 'en_cours'}
            style={{ padding: '10px 16px', borderRadius: 10, border: `1px solid ${BLUE}`, background: 'transparent', color: BLUE, fontWeight: 700, fontSize: 13, cursor: 'pointer', opacity: !form.quartier.trim() ? 0.5 : 1 }}>
            {verification === 'en_cours' ? 'Vérification…' : 'Vérifier la position sur la carte'}
          </button>
          <p role="status" style={{ fontSize: 12, marginTop: 8, color: verification === 'erreur' ? 'var(--s-red)' : verification === 'ok' ? 'var(--s-green)' : 'var(--c-muted)' }}>
            {verification === 'ok' && 'Position trouvée.'}
            {verification === 'erreur' && erreurPosition}
            {verification === 'idle' && 'Facultatif : sans vérification, la position par défaut de Cotonou est utilisée.'}
          </p>
        </div>
      </div>
    </Card>
  )
}
