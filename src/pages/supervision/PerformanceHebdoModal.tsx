import { useState, useEffect } from 'react';
import { getSupervisionPerformance, type PerformanceAdminHebdo } from '../../api/getSupervisionPerformance';

function formatSemaine(iso: string) {
  const debut = new Date(iso);
  const fin = new Date(debut.getTime() + 6 * 86_400_000);
  const fmt = (d: Date) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  return `${fmt(debut)} – ${fmt(fin)}`;
}

export default function PerformanceHebdoModal({ onClose }: { onClose: () => void }) {
  const [rows, setRows] = useState<PerformanceAdminHebdo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSupervisionPerformance.hebdo(8)
      .then(r => setRows(Array.isArray(r) ? r : []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="immo-modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="immo-modal" style={{ maxWidth: 640 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <div className="immo-modal-title" style={{ marginBottom: 2 }}>Performance hebdomadaire</div>
            <div style={{ fontSize: 12, color: 'var(--c-muted)' }}>Biens validés par admin, 8 dernières semaines</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-muted)', padding: 4 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
            <span style={{ width: 24, height: 24, border: '3px solid var(--c-border)', borderTopColor: 'var(--c-blue)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'block' }} />
          </div>
        ) : rows.length === 0 ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--c-muted)', fontSize: 13 }}>
            Aucune validation enregistrée sur cette période.
          </div>
        ) : (
          <div style={{ maxHeight: 420, overflowY: 'auto', border: '1px solid var(--c-border)', borderRadius: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--c-bg)', textAlign: 'left' }}>
                  <th style={{ padding: '8px 14px', fontSize: 11, fontWeight: 700, color: 'var(--c-muted)', textTransform: 'uppercase' }}>Admin</th>
                  <th style={{ padding: '8px 14px', fontSize: 11, fontWeight: 700, color: 'var(--c-muted)', textTransform: 'uppercase' }}>Semaine</th>
                  <th style={{ padding: '8px 14px', fontSize: 11, fontWeight: 700, color: 'var(--c-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Biens validés</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={`${r.admin_id}_${r.semaine_debut}`} style={{ borderTop: i === 0 ? 'none' : '1px solid var(--c-border)' }}>
                    <td style={{ padding: '8px 14px', fontWeight: 600, color: 'var(--c-text)' }}>
                      {r.nom || r.prenom ? `${r.prenom ?? ''} ${r.nom ?? ''}`.trim() : `Admin #${r.admin_id}`}
                    </td>
                    <td style={{ padding: '8px 14px', color: 'var(--c-muted)' }}>{formatSemaine(r.semaine_debut)}</td>
                    <td style={{ padding: '8px 14px', textAlign: 'right', fontWeight: 700, color: 'var(--c-text)' }}>{r.nb_biens_valides}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-cancel" onClick={onClose}>Fermer</button>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
