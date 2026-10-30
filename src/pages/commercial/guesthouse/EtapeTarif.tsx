import { Card, Section, Counter, MoneyInput } from '../formUi'
import { BLUE, baseInput } from '../formStyles'
import { TYPES_LIT, type Lit } from './guesthouseForm'
import { Libelle, type EtapeProps } from './ui'

export default function EtapeTarif({ form, maj }: EtapeProps) {
  const majLit = (i: number, patch: Partial<Lit>) =>
    maj({ lits: form.lits.map((l, j) => (j === i ? { ...l, ...patch } : l)) })
  const typeLibre = TYPES_LIT.find(t => !form.lits.some(l => l.type === t.value))?.value ?? 'simple'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Règles figées par le serveur : affichées, non modifiables */}
      <div role="note" style={{ padding: '12px 16px', borderRadius: 12, background: BLUE + '12', border: `1px solid ${BLUE}40`, color: BLUE, fontSize: 13, fontWeight: 700 }}>
        Location meublée · prix par nuitée
      </div>

      <Card>
        <Section title="Tarif" required />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <Libelle>Prix par nuit</Libelle>
            <MoneyInput value={form.prixNuitee} onChange={v => maj({ prixNuitee: v })} placeholder="25000" />
          </div>
          <div>
            <Libelle facultatif>Caution</Libelle>
            <MoneyInput value={form.caution} onChange={v => maj({ caution: v })} placeholder="0" />
          </div>
          <Counter label="Nuitées minimum" value={form.nuiteesMin} min={1} onChange={v => maj({ nuiteesMin: v })} />
        </div>
      </Card>

      <Card>
        <Section title="Capacité" required />
        <Counter label="Voyageurs" value={form.capacite} min={1} onChange={v => maj({ capacite: v })} />
        <Counter label="Chambres" value={form.nbChambres} min={1} onChange={v => maj({ nbChambres: v })} />
        <Counter label="Salles de bain" value={form.nbSallesBain} min={1} onChange={v => maj({ nbSallesBain: v })} />
      </Card>

      <Card>
        <Section title="Lits" required />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {form.lits.map((lit, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <select value={lit.type} onChange={e => majLit(i, { type: e.target.value })}
                aria-label={`Type du lit ${i + 1}`}
                style={{ ...baseInput, flex: '1 1 160px', width: 'auto' }}>
                {TYPES_LIT.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <div style={{ flex: '1 1 160px' }}>
                <Counter label="Nombre" value={lit.nombre} min={1} onChange={v => majLit(i, { nombre: v })} />
              </div>
              {form.lits.length > 1 && (
                <button type="button" aria-label={`Retirer le lit ${i + 1}`}
                  onClick={() => maj({ lits: form.lits.filter((_, j) => j !== i) })}
                  style={{ border: 'none', background: 'none', color: 'var(--s-red)', cursor: 'pointer', fontWeight: 700 }}>
                  Retirer
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={() => maj({ lits: [...form.lits, { type: typeLibre, nombre: 1 }] })}
            style={{ alignSelf: 'flex-start', padding: '8px 14px', borderRadius: 10, border: `1px dashed ${BLUE}`, background: 'transparent', color: BLUE, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
            + Ajouter un type de lit
          </button>
        </div>
      </Card>
    </div>
  )
}
