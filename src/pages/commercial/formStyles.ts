import type { CSSProperties } from 'react'

/** Constantes de style partagées par les formulaires de publication. */
export const BLUE = '#4B6BFF'

export const S: Record<string, CSSProperties> = {
  card: { background: 'var(--c-card)', border: '1px solid var(--c-border)', borderRadius: 14, padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: 0 },
  row:  { display: 'flex', alignItems: 'center' },
  col:  { display: 'flex', flexDirection: 'column' },
  wrap: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  g4:   { gap: 4 }, g8: { gap: 8 }, g10: { gap: 10 }, g12: { gap: 12 }, g16: { gap: 16 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 },
}

export const baseInput: CSSProperties = {
  width: '100%', borderRadius: 10, padding: '12px 16px', fontSize: 14, outline: 'none',
  border: '1px solid var(--c-border)', background: 'var(--c-surface-2)', color: 'var(--c-text)',
  boxSizing: 'border-box', transition: 'border-color 0.15s',
}
