import { Card, Section, Counter, MoneyInput } from '../formUi'
import { BLUE, baseInput } from '../formStyles'
import { Libelle } from '../guesthouse/ui'
import {
  CAPACITE_MAX,
  CONFIGURATIONS,
  DUREE_HEURES_MAX,
  apercuPrix,
} from './salleFeteForm'
import { ChoixUnique, NombreEntier, type EtapeProps } from './ui'

const DUREES = Array.from({ length: DUREE_HEURES_MAX }, (_, i) => i + 1)

export default function EtapeTarif({ form, maj }: EtapeProps) {
  const apercu = apercuPrix(form.prix, form.dureeHeures)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Règles figées par le serveur : affichées, non modifiables */}
      <div role="note" style={{ padding: '12px 16px', borderRadius: 12, background: BLUE + '12', border: `1px solid ${BLUE}40`, color: BLUE, fontSize: 13, fontWeight: 700 }}>
        Location · prix à l’heure
      </div>

      <Card>
        <Section title="Tarif" required />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
            <div>
              <Libelle>Prix</Libelle>
              <MoneyInput value={form.prix} onChange={v => maj({ prix: v })} placeholder="45000" />
            </div>
            <div>
              <Libelle>Pour combien d’heures ?</Libelle>
              <select value={form.dureeHeures} onChange={e => maj({ dureeHeures: Number(e.target.value) })}
                aria-label="Heures couvertes par le prix" style={baseInput}>
                {DUREES.map(h => <option key={h} value={h}>{h} {h > 1 ? 'heures' : 'heure'}</option>)}
              </select>
            </div>
          </div>

          {apercu && (
            <p role="status" style={{ margin: 0, padding: '10px 14px', borderRadius: 10, background: 'var(--c-surface-2)', fontSize: 13, color: 'var(--c-text)' }}>
              Affiché : <strong>{apercu.affiche}</strong>
              {apercu.parHeure && <span style={{ color: 'var(--c-muted)' }}> · soit {apercu.parHeure}</span>}
            </p>
          )}

          <Counter label="Durée minimum de location (heures)" value={form.heuresMin} min={1}
            onChange={v => maj({ heuresMin: v })} />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
            <div>
              <Libelle facultatif>Caution</Libelle>
              <MoneyInput value={form.caution} onChange={v => maj({ caution: v })} placeholder="0" />
            </div>
            <div>
              <Libelle facultatif>Frais de ménage</Libelle>
              <MoneyInput value={form.fraisMenage} onChange={v => maj({ fraisMenage: v })} placeholder="0" />
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <Section title="Capacité et configuration" required />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
            <div>
              <Libelle>Capacité</Libelle>
              <NombreEntier value={form.capacite} onChange={v => maj({ capacite: v })} unite="personnes"
                placeholder="300" max={CAPACITE_MAX} ariaLabel="Capacité en personnes" />
            </div>
            <div>
              <Libelle facultatif>Superficie</Libelle>
              <NombreEntier value={form.superficie} onChange={v => maj({ superficie: v })} unite="m²"
                placeholder="400" ariaLabel="Superficie en mètres carrés" />
            </div>
          </div>
          <div>
            <Libelle>Configuration</Libelle>
            <ChoixUnique ariaLabel="Configuration de la salle" options={CONFIGURATIONS}
              value={form.configuration} onChange={v => maj({ configuration: v })} />
          </div>
        </div>
      </Card>

      <Card>
        <Section title="Mobilier fourni" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
          <div>
            <Libelle facultatif>Tables</Libelle>
            <NombreEntier value={form.nbTables} onChange={v => maj({ nbTables: v })} unite="tables"
              placeholder="30" ariaLabel="Nombre de tables" />
          </div>
          <div>
            <Libelle facultatif>Chaises</Libelle>
            <NombreEntier value={form.nbChaises} onChange={v => maj({ nbChaises: v })} unite="chaises"
              placeholder="300" ariaLabel="Nombre de chaises" />
          </div>
        </div>
      </Card>
    </div>
  )
}
