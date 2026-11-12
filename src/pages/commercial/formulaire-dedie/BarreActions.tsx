import { BLUE } from '../formStyles'

/**
 * Lot 3 — barre d'actions des formulaires dédiés, toujours visible : ce qui manque, puis
 * « Annuler », « Précédent » (« Changer de type » à la 1re étape) et « Suivant » / « Envoyer ».
 * Les dialogues (annulation, changement de type) sont fournis par la page.
 */
export default function BarreActions({ etape, derniere, manques, enCours, libelleEnvoyer, onAnnuler, onPrecedent, onSuivant }: {
  etape: number
  derniere: boolean
  manques: string[]
  enCours: boolean
  libelleEnvoyer: string
  onAnnuler: () => void
  onPrecedent: () => void
  onSuivant: () => void
}) {
  const bloque = manques.length > 0 || enCours
  return (
    <div style={{ position: 'sticky', bottom: 0, marginTop: 16, padding: '12px 0 16px', background: 'var(--c-bg)', borderTop: '1px solid var(--c-border)' }}>
      {manques.length > 0 && (
        <p aria-live="polite" style={{ fontSize: 12, color: 'var(--s-red)', margin: '0 0 10px' }}>
          Il manque : {manques.join(' · ')}
        </p>
      )}
      {enCours && <p aria-live="polite" style={{ fontSize: 12, color: BLUE, margin: '0 0 10px' }}>Enregistrement…</p>}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button type="button" className="btn-cancel" disabled={enCours} onClick={onAnnuler}>Annuler</button>
        <button type="button" className="btn-cancel" disabled={enCours} onClick={onPrecedent}>
          {etape > 0 ? 'Précédent' : 'Changer de type'}
        </button>
        <button type="button" className="btn-submit" disabled={bloque} aria-disabled={bloque} onClick={onSuivant}
          style={{ flex: 1, minWidth: 140, opacity: bloque ? 0.5 : 1, cursor: bloque ? 'not-allowed' : 'pointer' }}>
          {derniere ? (enCours ? 'Envoi…' : libelleEnvoyer) : 'Suivant'}
        </button>
      </div>
    </div>
  )
}
