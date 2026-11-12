import { useNavigate } from 'react-router-dom';
import { useGestionEnvois } from '../shared/uploads/useGestionEnvois';
import { avancement } from '../shared/uploads/fileEnvoi';

/**
 * Lot 1 — suivi discret des envois de photos, visible sur toutes les pages :
 * « Envoi des photos de Villa Fidjrossè : 3/6 », reprise après un rechargement,
 * et en cas d'échec « Réessayer » ou « Compléter les photos ».
 */
export default function IndicateurEnvois() {
  const { lots, interrompus, reprendre, abandonner } = useGestionEnvois();
  const navigate = useNavigate();
  if (!lots.length && !interrompus.length) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed', right: 16, bottom: 16, zIndex: 9000,
        display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 'min(360px, calc(100vw - 32px))',
      }}
    >
      {interrompus.map(lot => {
        const { faits, total } = avancement(lot);
        return (
          <div key={lot.id} style={carte}>
            <div style={{ fontWeight: 700 }}>Envoi interrompu : {lot.libelle}</div>
            <div style={{ color: 'var(--c-muted)' }}>{faits}/{total} fichiers envoyés avant la fermeture de la page.</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button type="button" className="btn-submit" style={{ height: 32 }} onClick={() => reprendre(lot.id)}>Reprendre l’envoi</button>
              <button type="button" className="btn-cancel" style={{ height: 32 }} onClick={() => abandonner(lot.id)}>Ignorer</button>
            </div>
          </div>
        );
      })}
      {lots.map(lot => {
        const { faits, total, echecs, enCours } = avancement(lot);
        const pourcent = total ? Math.round((faits / total) * 100) : 100;
        return (
          <div key={lot.id} style={carte}>
            <div style={{ fontWeight: 700 }}>
              {enCours ? `Envoi des photos de ${lot.libelle} : ${faits}/${total}` : `${echecs} fichier${echecs > 1 ? 's' : ''} non envoyé${echecs > 1 ? 's' : ''} (${lot.libelle})`}
            </div>
            <div style={{ height: 4, background: 'var(--c-surface-2)', borderRadius: 4, marginTop: 6, overflow: 'hidden' }}>
              <div style={{ width: `${pourcent}%`, height: '100%', background: echecs && !enCours ? 'var(--c-red)' : 'var(--c-blue)', transition: 'width .3s' }} />
            </div>
            {!enCours && echecs > 0 && (
              <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                <button type="button" className="btn-submit" style={{ height: 32 }} onClick={() => reprendre(lot.id)}>Réessayer</button>
                {lot.lien && (
                  <button type="button" className="btn-cancel" style={{ height: 32 }} onClick={() => { abandonner(lot.id); navigate(lot.lien!); }}>
                    Compléter les photos
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const carte: React.CSSProperties = {
  background: 'var(--c-card)', border: '1px solid var(--c-border)', borderRadius: 12,
  boxShadow: '0 8px 24px rgba(15,23,42,0.14)', padding: '10px 14px', fontSize: 13, color: 'var(--c-text)',
};
