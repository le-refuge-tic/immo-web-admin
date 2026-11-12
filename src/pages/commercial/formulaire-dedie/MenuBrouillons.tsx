import { useState } from 'react'
import { useConfirm } from '../../../shared/dialogues/useConfirm'
import { lienBrouillon, type Brouillon, type FamilleBrouillon } from '../brouillons/brouillonsLocaux'
import { BLUE } from '../formStyles'

const dateCourte = (t: number) =>
  new Date(t).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

/**
 * Lot 3 — menu « Brouillons (n) » des pages de publication : reprendre (lien `?draft=<id>`),
 * supprimer (avec confirmation) ou démarrer une nouvelle saisie.
 */
export default function MenuBrouillons({ famille, lister, courantId, nbEtapes, onReprendre, onSupprimer, onNouveau }: {
  famille: FamilleBrouillon
  lister: () => Brouillon[]
  courantId: string | null
  nbEtapes: number
  onReprendre: (lien: string) => void
  onSupprimer: (id: string) => void
  onNouveau: () => void
}) {
  const [ouvert, setOuvert] = useState(false)
  const { confirmer } = useConfirm()
  const brouillons = ouvert ? lister() : []
  const nb = lister().length

  const supprimer = async (b: Brouillon) => {
    const ok = await confirmer({
      titre: 'Supprimer ce brouillon ?',
      message: `« ${b.libelle} » sera définitivement effacé de cet appareil.`,
      confirmer: 'Supprimer',
      danger: true,
    })
    if (ok) onSupprimer(b.id)
  }

  return (
    <div style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOuvert(o => !o)} aria-expanded={ouvert} aria-haspopup="true"
        style={{ padding: '6px 12px', borderRadius: 999, border: `1px solid ${BLUE}40`, background: BLUE + '12', color: BLUE, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
        Brouillons ({nb})
      </button>
      {ouvert && (
        <div role="menu" style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 50, width: 'min(320px, 86vw)', background: 'var(--c-card)', border: '1px solid var(--c-border)', borderRadius: 12, boxShadow: '0 12px 32px rgba(15,23,42,.16)', padding: 8 }}>
          <button type="button" role="menuitem" onClick={() => { setOuvert(false); onNouveau() }}
            style={{ width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 8, border: 'none', background: 'transparent', color: BLUE, fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}>
            + Nouvelle saisie
          </button>
          {brouillons.length === 0 && <p style={{ fontSize: 12, color: 'var(--c-muted)', padding: '6px 10px', margin: 0 }}>Aucun brouillon.</p>}
          {brouillons.map(b => (
            <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button type="button" role="menuitem" onClick={() => { setOuvert(false); onReprendre(lienBrouillon(famille, b.id)) }}
                aria-current={b.id === courantId}
                style={{ flex: 1, minWidth: 0, textAlign: 'left', padding: '8px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', background: b.id === courantId ? BLUE + '12' : 'transparent', color: 'var(--c-text)' }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.libelle}</div>
                <div style={{ fontSize: 11, color: 'var(--c-muted)' }}>
                  {dateCourte(b.updatedAt)} · étape {Math.min(b.etape, nbEtapes - 1) + 1}/{nbEtapes}{b.id === courantId ? ' · en cours' : ''}
                </div>
              </button>
              <button type="button" onClick={() => void supprimer(b)} aria-label={`Supprimer le brouillon ${b.libelle}`}
                style={{ border: 'none', background: 'transparent', color: 'var(--s-red)', cursor: 'pointer', fontSize: 12, fontWeight: 700, padding: 6 }}>
                Supprimer
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
