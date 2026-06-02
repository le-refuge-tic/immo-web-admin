import { useState, useEffect, useCallback } from 'react';
import { StarIcon, AlertIcon, ChevronLeftIcon, ChevronRightIcon } from '../../components/Icons';
import { adminApi } from '../../api/admin.api';
import type { Feedback, TypeFeedback } from '../../types';

const LIMIT = 15;

const TYPE_LABELS: Record<TypeFeedback, string> = {
  post_visite:      'Post-visite',
  post_integration: 'Post-intégration',
  meteo:            'Météo',
};

const TYPE_COLORS: Record<TypeFeedback, string> = {
  post_visite:      '#2563EB',
  post_integration: '#16A34A',
  meteo:            '#9333EA',
};

function Stars({ note }: { note: number | null }) {
  if (note === null) return <span style={{ color: 'var(--c-muted)', fontSize: 12 }}>—</span>;
  return (
    <span style={{ color: '#F59E0B', fontSize: 14, letterSpacing: 1 }}>
      {'★'.repeat(Math.round(note))}{'☆'.repeat(5 - Math.round(note))}
      <span style={{ fontSize: 11, color: 'var(--c-muted)', marginLeft: 4 }}>{note}/5</span>
    </span>
  );
}

export default function FeedbacksPage() {
  const [feedbacks, setFeedbacks]   = useState<Feedback[]>([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [filtreType, setFiltreType] = useState<TypeFeedback | ''>('');
  const [meteoOnly, setMeteoOnly]   = useState(false);
  const [loading, setLoading]       = useState(false);
  const [totalMeteo, setTotalMeteo] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [res, meteo] = await Promise.all([
        adminApi.getFeedbacks({
          page, limit: LIMIT,
          ...(filtreType ? { type: filtreType } : {}),
          ...(meteoOnly  ? { probleme_meteo: 'true' } : {}),
        }),
        adminApi.getFeedbacks({ type: 'meteo', probleme_meteo: 'true', limit: 1, page: 1 }),
      ]);
      setFeedbacks(res.data);
      setTotal(res.total);
      setTotalMeteo(meteo.total);
    } finally {
      setLoading(false);
    }
  }, [page, filtreType, meteoOnly]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <>
      {/* Topbar */}
      <div className="immo-topbar">
        <div className="immo-topbar-title">
          <h1>Feedbacks utilisateurs</h1>
          <p>Avis post-visite, intégration et météo</p>
        </div>
        <div className="immo-spacer" />

        <select className="immo-select" value={filtreType}
          onChange={(e) => { setFiltreType(e.target.value as TypeFeedback | ''); setPage(1); }}>
          <option value="">Tous les types</option>
          <option value="post_visite">Post-visite</option>
          <option value="post_integration">Post-intégration</option>
          <option value="meteo">Météo</option>
        </select>

        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--c-text)', marginLeft: 12, cursor: 'pointer' }}>
          <input type="checkbox" checked={meteoOnly} onChange={(e) => { setMeteoOnly(e.target.checked); setPage(1); }} />
          Signalements météo uniquement
        </label>
      </div>

      <div className="immo-page">
        {/* Stat cards */}
        <div className="mod-stat-cards">
          <div className="mod-stat-card">
            <div>
              <div className="mod-stat-label">Total feedbacks</div>
              <div className="mod-stat-value">{total}</div>
            </div>
            <div className="mod-stat-icon"><StarIcon size={24} /></div>
          </div>
          <div className="mod-stat-card urgent">
            <div>
              <div className="mod-stat-label">Signalements météo</div>
              <div className="mod-stat-value">{totalMeteo}</div>
            </div>
            <div className="mod-stat-icon"><AlertIcon size={24} /></div>
          </div>
        </div>

        {/* Table */}
        <div className="immo-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="mod-table-header" style={{ gridTemplateColumns: '1fr 1fr 1fr 2fr 100px' }}>
            <span className="mod-table-col">Type</span>
            <span className="mod-table-col">Note</span>
            <span className="mod-table-col">Bien</span>
            <span className="mod-table-col">Commentaire</span>
            <span className="mod-table-col">Date</span>
          </div>

          {loading ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--c-muted)' }}>Chargement…</div>
          ) : feedbacks.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--c-muted)' }}>Aucun feedback trouvé.</div>
          ) : feedbacks.map((f) => (
            <div className="mod-row" key={f.id} style={{ gridTemplateColumns: '1fr 1fr 1fr 2fr 100px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                  background: TYPE_COLORS[f.type] + '18',
                  color: TYPE_COLORS[f.type], textTransform: 'uppercase',
                }}>
                  {TYPE_LABELS[f.type]}
                </span>
                {f.probleme_meteo && (
                  <span title="Signalement dégât météo" style={{ color: '#DC2626', fontSize: 14 }}>⚠️</span>
                )}
              </div>
              <div><Stars note={f.note} /></div>
              <div style={{ fontSize: 12, color: 'var(--c-muted)' }}>
                {f.bien_id ? `Bien #${f.bien_id}` : '—'}
              </div>
              <div style={{
                fontSize: 12, color: 'var(--c-text)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 300,
              }}>
                {f.commentaire ?? <span style={{ color: 'var(--c-muted)' }}>Aucun commentaire</span>}
              </div>
              <div style={{ fontSize: 12, color: 'var(--c-muted)' }}>
                {new Date(f.created_at).toLocaleDateString('fr-FR')}
              </div>
            </div>
          ))}

          {/* Pagination */}
          <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--c-border)' }}>
            <span style={{ fontSize: 12, color: 'var(--c-muted)' }}>
              {total === 0 ? '0 résultat' : `${(page - 1) * LIMIT + 1}–${Math.min(page * LIMIT, total)} sur ${total}`}
            </span>
            <div className="immo-pagination">
              <button className="page-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeftIcon /></button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                <button key={p} className={`page-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
              ))}
              <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}><ChevronRightIcon /></button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
