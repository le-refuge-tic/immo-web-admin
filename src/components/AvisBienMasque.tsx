import { libelleStatutBien, INFO_BULLE_BIEN_MASQUE } from '../utils/statutBien';

/** Badge du statut « masqué » d'un bien. */
export function BadgeBienMasque({ statut }: { statut: string }) {
  return (
    <span
      title={INFO_BULLE_BIEN_MASQUE}
      style={{
        display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
        color: 'var(--s-red)', background: 'var(--t-red-bg)', border: '1px solid var(--t-red-bd)',
      }}
    >
      {libelleStatutBien(statut)}
    </span>
  );
}

/**
 * Bandeau affiché sur un bien masqué (compte du propriétaire en cours de
 * suppression ou supprimé) : aucune écriture n'est possible.
 */
export default function AvisBienMasque({ statut, onRetour }: { statut: string; onRetour?: () => void }) {
  return (
    <div
      role="note"
      style={{
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        background: 'var(--t-red-bg)', border: '1px solid var(--t-red-bd)', borderRadius: 10,
        padding: '12px 16px', fontSize: 13, color: 'var(--s-red)',
      }}
    >
      <BadgeBienMasque statut={statut} />
      <span style={{ fontWeight: 600, flex: 1, minWidth: 200 }}>{INFO_BULLE_BIEN_MASQUE}.</span>
      {onRetour && (
        <button type="button" className="btn-cancel" onClick={onRetour}>Retour</button>
      )}
    </div>
  );
}
