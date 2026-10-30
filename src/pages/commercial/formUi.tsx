import type { ReactNode } from 'react'
import { blockInvalidNumberKey } from '../../utils/inputNumbers'
import { BLUE, S } from './formStyles'

/**
 * Éléments de formulaire partagés par les pages de publication
 * (PublierBienPage, PublierGuesthousePage). Déplacés tels quels depuis PublierBienPage.
 */


export function Card({ children }: { children: ReactNode }) {
  return <div style={S.card}>{children}</div>
}

export function Section({ title, required }: { title: string; required?: boolean }) {
  return (
    <div style={{ ...S.row, gap: 8, marginBottom: 12 }}>
      <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--c-muted)', margin: 0 }}>{title}</p>
      {required && (
        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, color: BLUE, background: BLUE + '22' }}>Obligatoire</span>
      )}
    </div>
  )
}

export function ChoiceList({ options, value, onChange, disabledValues, onDeselect }: {
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
              background: isActive ? BLUE + '12' : 'var(--c-surface-2)',
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

export function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
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

export function Counter({ label, value, onChange, min = 0 }: {
  label: string; value: number; onChange: (v: number) => void; min?: number
}) {
  return (
    <div style={{ ...S.row, justifyContent: 'space-between', padding: '10px 0' }}>
      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-text)' }}>{label}</span>
      <div style={{ ...S.row, gap: 12 }}>
        <button type="button" disabled={value <= min} onClick={() => onChange(value - 1)}
          style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, border: '1px solid var(--c-border)', background: 'var(--c-surface-2)', color: 'var(--c-text)', cursor: value <= min ? 'not-allowed' : 'pointer', opacity: value <= min ? 0.4 : 1 }}>−</button>
        <span style={{ width: 24, textAlign: 'center', fontWeight: 700, color: 'var(--c-text)' }}>{value}</span>
        <button type="button" onClick={() => onChange(value + 1)}
          style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, background: BLUE + '18', color: BLUE, border: 'none', cursor: 'pointer' }}>+</button>
      </div>
    </div>
  )
}

export function NumberPicker({ presets, unit, value, isCustom, onPick, onCustomStart, customText, onCustomText }: {
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
        <input type="number" min="0" max="9999" step="1" value={customText} onChange={e => onCustomText(e.target.value)} onKeyDown={e => blockInvalidNumberKey(e, true)} placeholder="Nombre"
          style={{ marginTop: 10, width: '100%', borderRadius: 10, padding: '10px 16px', fontSize: 14, outline: 'none', border: `1px solid ${BLUE}`, background: 'var(--c-surface-2)', color: 'var(--c-text)', boxSizing: 'border-box' }} />
      )}
    </div>
  )
}

export function MoneyInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div style={{ position: 'relative' }}>
      <input type="number" min="0" max="999999999" step="1" value={value} onChange={e => onChange(e.target.value)} onKeyDown={e => blockInvalidNumberKey(e, true)} placeholder={placeholder ?? '0'}
        style={{ width: '100%', borderRadius: 10, padding: '12px 56px 12px 16px', fontSize: 14, outline: 'none', border: '1px solid var(--c-border)', background: 'var(--c-surface-2)', color: 'var(--c-text)', transition: 'border-color 0.15s', boxSizing: 'border-box' }}
        onFocus={e => (e.currentTarget.style.borderColor = BLUE)}
        onBlur={e => (e.currentTarget.style.borderColor = 'var(--c-border)')} />
      <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 12, fontWeight: 600, color: 'var(--c-muted)', pointerEvents: 'none' }}>FCFA</span>
    </div>
  )
}


export function RecapSection({ title, items }: { title: string; items: string[] }) {
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

