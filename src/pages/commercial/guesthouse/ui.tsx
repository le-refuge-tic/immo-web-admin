import type { ReactNode } from 'react'
import { BLUE, baseInput } from '../formStyles'
import type { GuesthouseForm } from './guesthouseForm'

/** Props communes à chaque étape du formulaire guesthouse. */
export type EtapeProps = {
  form: GuesthouseForm
  maj: (patch: Partial<GuesthouseForm>) => void
}

export function Libelle({ children, facultatif }: { children: ReactNode; facultatif?: boolean }) {
  return (
    <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 8, display: 'block', color: 'var(--c-muted)' }}>
      {children}
      {facultatif && <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}> (facultatif)</span>}
    </label>
  )
}

export function Texte({ value, onChange, placeholder, type = 'text', maxLength }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; maxLength?: number
}) {
  return (
    <input type={type} value={value} maxLength={maxLength} placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      style={baseInput}
      onFocus={e => (e.currentTarget.style.borderColor = BLUE)}
      onBlur={e => (e.currentTarget.style.borderColor = 'var(--c-border)')} />
  )
}

/** Choix Oui / Non ; `null` = pas encore répondu. */
export function OuiNon({ value, onChange, oui = 'Oui', non = 'Non' }: {
  value: boolean | null; onChange: (v: boolean) => void; oui?: string; non?: string
}) {
  const bouton = (actif: boolean, label: string, v: boolean) => (
    <button type="button" onClick={() => onChange(v)} aria-pressed={actif}
      style={{
        flex: 1, padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
        border: `2px solid ${actif ? BLUE : 'var(--c-border)'}`,
        background: actif ? BLUE + '12' : 'transparent', color: actif ? BLUE : 'var(--c-muted)',
      }}>
      {label}
    </button>
  )
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      {bouton(value === true, oui, true)}
      {bouton(value === false, non, false)}
    </div>
  )
}
