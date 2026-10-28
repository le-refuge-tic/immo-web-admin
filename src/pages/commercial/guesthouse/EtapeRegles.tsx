import { Card, Section, Chip } from '../formUi'
import { baseInput } from '../formStyles'
import type { GroupeEquipements } from '../../../api/guesthouse'
import { Libelle, OuiNon, type EtapeProps } from './ui'

type Props = EtapeProps & {
  groupes: GroupeEquipements[] | null
  erreur: string
  reessayer: () => void
}

export default function EtapeRegles({ form, maj, groupes, erreur, reessayer }: Props) {
  const basculer = (code: string) =>
    maj({ equipements: form.equipements.includes(code)
      ? form.equipements.filter(c => c !== code)
      : [...form.equipements, code] })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card>
        <Section title="Équipements et services" />
        {erreur ? (
          <div role="alert" style={{ fontSize: 13, color: 'var(--s-red)' }}>
            {erreur}{' '}
            <button type="button" onClick={reessayer}
              style={{ border: 'none', background: 'none', color: 'inherit', textDecoration: 'underline', cursor: 'pointer', fontWeight: 700 }}>
              Réessayer
            </button>
          </div>
        ) : !groupes ? (
          <p style={{ fontSize: 13, color: 'var(--c-muted)' }}>Chargement des équipements…</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {groupes.map(g => (
              <div key={g.categorie}>
                <p style={{ fontSize: 12, fontWeight: 700, margin: '0 0 8px', color: 'var(--c-text)' }}>{g.libelle}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {g.equipements.map(e => (
                    <Chip key={e.code} label={e.libelle} active={form.equipements.includes(e.code)} onClick={() => basculer(e.code)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <Section title="Garage / parking" required />
        <OuiNon value={form.garage}
          onChange={v => maj({ garage: v, typeAccesGarage: v ? form.typeAccesGarage : null })} />
        {form.garage && (
          <div style={{ marginTop: 14 }}>
            <Libelle>Type d’accès</Libelle>
            <OuiNon value={form.typeAccesGarage === null ? null : form.typeAccesGarage === 'prive'}
              oui="Privé" non="Commun"
              onChange={v => maj({ typeAccesGarage: v ? 'prive' : 'commun' })} />
          </div>
        )}
      </Card>

      <Card>
        <Section title="Horaires" required />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <Libelle>Arrivée (check-in)</Libelle>
            <input type="time" value={form.heureArrivee} onChange={e => maj({ heureArrivee: e.target.value })} style={baseInput} />
          </div>
          <div>
            <Libelle>Départ (check-out)</Libelle>
            <input type="time" value={form.heureDepart} onChange={e => maj({ heureDepart: e.target.value })} style={baseInput} />
          </div>
        </div>
      </Card>

      <Card>
        <Section title="Règles de la maison" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div><Libelle>Animaux</Libelle><OuiNon value={form.animaux} oui="Autorisés" non="Interdits" onChange={v => maj({ animaux: v })} /></div>
          <div><Libelle>Fêtes</Libelle><OuiNon value={form.fetes} oui="Autorisées" non="Interdites" onChange={v => maj({ fetes: v })} /></div>
          <div><Libelle>Fumeur</Libelle><OuiNon value={form.fumeur} oui="Autorisé" non="Interdit" onChange={v => maj({ fumeur: v })} /></div>
        </div>
      </Card>
    </div>
  )
}
