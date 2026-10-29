import { BLUE, S } from '../formStyles'
import { blockInvalidNumberKey } from '../../../utils/inputNumbers'
import type { SalleFeteForm } from './salleFeteForm'

/** Props communes à chaque étape du formulaire salle de fêtes. */
export type EtapeProps = {
  form: SalleFeteForm
  maj: (patch: Partial<SalleFeteForm>) => void
}

/** Saisie d'un nombre entier (personnes, m², tables…) avec son unité à droite. */
export function NombreEntier({ value, onChange, unite, placeholder, max, ariaLabel }: {
  value: string
  onChange: (v: string) => void
  unite: string
  placeholder?: string
  max?: number
  ariaLabel?: string
}) {
  return (
    <div style={{ position: 'relative' }}>
      <input type="number" inputMode="numeric" min="0" max={max} step="1" value={value} aria-label={ariaLabel}
        onChange={e => onChange(e.target.value)} onKeyDown={e => blockInvalidNumberKey(e, true)}
        placeholder={placeholder ?? '0'}
        style={{ width: '100%', borderRadius: 10, padding: '12px 76px 12px 16px', fontSize: 14, outline: 'none', border: '1px solid var(--c-border)', background: 'var(--c-surface-2)', color: 'var(--c-text)', transition: 'border-color 0.15s', boxSizing: 'border-box' }}
        onFocus={e => (e.currentTarget.style.borderColor = BLUE)}
        onBlur={e => (e.currentTarget.style.borderColor = 'var(--c-border)')} />
      <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 12, fontWeight: 600, color: 'var(--c-muted)', pointerEvents: 'none' }}>{unite}</span>
    </div>
  )
}

/** Choix unique parmi quelques valeurs ; `null` = pas encore choisi. */
export function ChoixUnique<T extends string>({ options, value, onChange, ariaLabel }: {
  options: { value: T; label: string }[]
  value: T | null
  onChange: (v: T) => void
  ariaLabel: string
}) {
  return (
    <div role="group" aria-label={ariaLabel} style={{ ...S.wrap }}>
      {options.map(o => {
        const actif = value === o.value
        return (
          <button key={o.value} type="button" aria-pressed={actif} onClick={() => onChange(o.value)}
            style={{
              flex: '1 1 90px', padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
              border: `2px solid ${actif ? BLUE : 'var(--c-border)'}`,
              background: actif ? BLUE + '12' : 'transparent', color: actif ? BLUE : 'var(--c-muted)',
            }}>
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
