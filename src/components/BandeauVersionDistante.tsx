/**
 * Lot 6 — le brouillon ouvert a été modifié sur un autre appareil : l'utilisateur choisit la
 * version à garder (rien n'est écrit entre-temps).
 */
export default function BandeauVersionDistante({ onCharger, onGarder }: { onCharger: () => void; onGarder: () => void }) {
  return (
    <div role="alert" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 14px', marginBottom: 14, borderRadius: 10, background: 'var(--t-yellow-bg)', border: '1px solid var(--t-yellow-bd)', color: 'var(--c-text)', fontSize: 13 }}>
      <span>Ce brouillon a été modifié sur un autre appareil depuis l’ouverture de cette page.</span>
      <span style={{ display: 'flex', gap: 8 }}>
        <button type="button" className="btn-submit" onClick={onCharger}>Charger cette version</button>
        <button type="button" className="btn-cancel" onClick={onGarder}>Garder ma saisie</button>
      </span>
    </div>
  )
}
