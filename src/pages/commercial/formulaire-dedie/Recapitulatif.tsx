import type { ReactNode } from 'react'
import { BLUE } from '../formStyles'
import type { SectionRecap } from '../../../shared/biens/formulaires/recapitulatif'

export type { SectionRecap }


/**
 * Lot 3 — récapitulatif final : sections avec « Modifier » (retour à l'étape concernée),
 * bloc des totaux mis en valeur, champs manquants listés en clair.
 */
export default function Recapitulatif({ sections, totaux, manques, allerA }: {
  sections: SectionRecap[]
  totaux: ReactNode
  /** Manques par étape (libellé de l'étape → champs). */
  manques: { etape: number; libelle: string; champs: string[] }[]
  allerA: (etape: number) => void
}) {
  const aCompleter = manques.filter(m => m.champs.length)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h2 style={{ margin: 0, fontSize: 15, color: 'var(--c-text)' }}>Récapitulatif</h2>
      {aCompleter.length > 0 && (
        <div role="alert" style={{ borderRadius: 12, border: '1px solid var(--s-red)', background: 'var(--c-red-bg)', padding: '12px 14px', fontSize: 12.5 }}>
          <strong style={{ color: 'var(--s-red)' }}>À compléter avant l’envoi</strong>
          <ul style={{ margin: '6px 0 0', paddingLeft: 18, color: 'var(--c-text)' }}>
            {aCompleter.map(m => (
              <li key={m.etape}>
                {m.libelle} : {m.champs.join(', ')}{' '}
                <button type="button" onClick={() => allerA(m.etape)}
                  style={{ border: 'none', background: 'none', color: BLUE, fontWeight: 700, cursor: 'pointer', padding: 0 }}>
                  Compléter
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {totaux}
      {sections.map(s => (
        <section key={s.titre} aria-label={s.titre}
          style={{ borderRadius: 12, border: '1px solid var(--c-border)', background: 'var(--c-card)', padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <h3 style={{ margin: 0, fontSize: 12, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--c-muted)' }}>{s.titre}</h3>
            <button type="button" onClick={() => allerA(s.etape)} aria-label={`Modifier : ${s.titre}`}
              style={{ border: 'none', background: 'none', color: BLUE, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
              Modifier
            </button>
          </div>
          {s.lignes.length
            ? <ul style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: 13, color: 'var(--c-text)', lineHeight: 1.6 }}>{s.lignes.map(l => <li key={l}>{l}</li>)}</ul>
            : <p style={{ margin: '6px 0 0', fontSize: 12.5, color: 'var(--c-muted)' }}>Rien de renseigné.</p>}
        </section>
      ))}
    </div>
  )
}
