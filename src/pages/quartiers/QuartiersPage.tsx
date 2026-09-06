import { useState, useEffect, useCallback } from 'react';
import { getQuartiers, type QuartierPropose } from '../../api/getQuartiers';

const STATUT_LABEL: Record<string, string> = {
  en_attente: 'En attente', valide: 'Validé', rejete: 'Rejeté',
};
const STATUT_COLOR: Record<string, string> = {
  en_attente: '#f59e0b', valide: '#10b981', rejete: '#ef4444',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function QuartiersPage() {
  const [items, setItems]     = useState<QuartierPropose[]>([]);
  const [filtre, setFiltre]   = useState<string>('en_attente');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy]       = useState<number | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await getQuartiers.lister(filtre || undefined).catch(() => []);
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [filtre]);

  useEffect(() => { refresh(); }, [refresh]);

  const traiter = async (id: number, action: 'valider' | 'rejeter') => {
    setBusy(id);
    try {
      await (action === 'valider' ? getQuartiers.valider(id) : getQuartiers.rejeter(id));
      await refresh();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Quartiers proposés</h1>
          <p style={{ fontSize: 13, color: 'var(--c-muted)', margin: '4px 0 0' }}>
            Quartiers saisis par les commerciaux lorsqu'ils sont absents de la liste officielle.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { v: 'en_attente', l: 'En attente' },
            { v: 'valide', l: 'Validés' },
            { v: 'rejete', l: 'Rejetés' },
            { v: '', l: 'Tous' },
          ].map(f => (
            <button key={f.v} onClick={() => setFiltre(f.v)}
              style={{
                padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                border: '1px solid var(--c-border)',
                background: filtre === f.v ? 'var(--c-blue)' : '#fff',
                color: filtre === f.v ? '#fff' : 'var(--c-text)',
              }}>
              {f.l}
            </button>
          ))}
        </div>
      </div>

      <div className="immo-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <p style={{ padding: 24, color: 'var(--c-muted)' }}>Chargement…</p>
        ) : items.length === 0 ? (
          <p style={{ padding: 24, color: 'var(--c-muted)' }}>Aucun quartier {filtre ? STATUT_LABEL[filtre]?.toLowerCase() : ''}.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--c-muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '12px 16px' }}>Quartier</th>
                <th style={{ padding: '12px 16px' }}>Ville</th>
                <th style={{ padding: '12px 16px' }}>Proposé le</th>
                <th style={{ padding: '12px 16px' }}>Statut</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(q => (
                <tr key={q.id} style={{ borderTop: '1px solid var(--c-border)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>{q.nom}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--c-muted)' }}>{q.ville ?? '—'}{q.arrondissement ? ` · ${q.arrondissement}` : ''}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--c-muted)' }}>{formatDate(q.created_at)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 999, color: STATUT_COLOR[q.statut], background: `${STATUT_COLOR[q.statut]}18` }}>
                      {STATUT_LABEL[q.statut] ?? q.statut}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    {q.statut === 'en_attente' ? (
                      <div style={{ display: 'inline-flex', gap: 8 }}>
                        <button disabled={busy === q.id} onClick={() => traiter(q.id, 'valider')}
                          style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: '#10b981', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: busy === q.id ? 0.6 : 1 }}>
                          Valider
                        </button>
                        <button disabled={busy === q.id} onClick={() => traiter(q.id, 'rejeter')}
                          style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--c-border)', background: '#fff', color: '#ef4444', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: busy === q.id ? 0.6 : 1 }}>
                          Rejeter
                        </button>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--c-muted)', fontSize: 13 }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
