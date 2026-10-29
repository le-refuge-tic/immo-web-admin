import { Chip } from '../formUi'
import type { GroupeEquipements } from '../../../api/guesthouse'

type Props = {
  groupes: GroupeEquipements[] | null
  erreur: string
  reessayer: () => void
  /** Codes cochés */
  selection: string[]
  basculer: (code: string) => void
}

/** Équipements du référentiel (GET /equipements), groupés par catégorie, à cocher. */
export default function ChoixEquipements({ groupes, erreur, reessayer, selection, basculer }: Props) {
  if (erreur) {
    return (
      <div role="alert" style={{ fontSize: 13, color: 'var(--s-red)' }}>
        {erreur}{' '}
        <button type="button" onClick={reessayer}
          style={{ border: 'none', background: 'none', color: 'inherit', textDecoration: 'underline', cursor: 'pointer', fontWeight: 700 }}>
          Réessayer
        </button>
      </div>
    )
  }
  if (!groupes) return <p style={{ fontSize: 13, color: 'var(--c-muted)' }}>Chargement des équipements…</p>
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {groupes.map(g => (
        <div key={g.categorie}>
          <p style={{ fontSize: 12, fontWeight: 700, margin: '0 0 8px', color: 'var(--c-text)' }}>{g.libelle}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {g.equipements.map(e => (
              <Chip key={e.code} label={e.libelle} active={selection.includes(e.code)} onClick={() => basculer(e.code)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
