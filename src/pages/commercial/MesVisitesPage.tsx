import { useState, useEffect, useCallback } from 'react';
import { getMesVisites } from '../../api/getMesVisites';
import { patchVisite } from '../../api/patchVisite';
import { CalendarIcon, CheckCircleIcon } from '../../components/Icons';

/* ─── Helpers ─────────────────────────────────────────────── */

const STATUTS: { key: string; label: string }[] = [
  { key: '',                label: 'Toutes' },
  { key: 'en_attente',      label: 'En attente' },
  { key: 'confirmee',       label: 'Confirmées' },
  { key: 'contre_proposee', label: 'Contre-proposées' },
  { key: 'effectuee',       label: 'Effectuées' },
  { key: 'annulee',         label: 'Annulées' },
];

const STATUT_BADGE: Record<string, { label: string; cls: string }> = {
  en_attente:      { label: 'En attente',      cls: 'badge-pending'  },
  confirmee:       { label: 'Confirmée',        cls: 'badge-active'   },
  contre_proposee: { label: 'Contre-proposée',  cls: 'badge-warning'  },
  effectuee:       { label: 'Effectuée',        cls: 'badge-info'     },
  annulee:         { label: 'Annulée',          cls: 'badge-danger'   },
};

function formatDate(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

/* ─── Modal contre-proposition ── */
function ContreProposerModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: (date: string) => void }) {
  const [date, setDate] = useState('');
  return (
    <div className="immo-modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="immo-modal" style={{ maxWidth: 380 }}>
        <div className="immo-modal-title">Contre-proposer une date</div>
        <div className="immo-form-field" style={{ marginTop: 16 }}>
          <label className="immo-form-label">Nouvelle date de visite *</label>
          <input
            className="immo-form-input"
            type="datetime-local"
            value={date}
            onChange={e => setDate(e.target.value)}
            required
          />
        </div>
        <div className="immo-modal-actions">
          <button className="btn-cancel" onClick={onClose}>Annuler</button>
          <button className="btn-submit" onClick={() => date && onConfirm(date)} disabled={!date}>
            Envoyer
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────── */

export default function MesVisitesPage() {
  const [visites, setVisites]   = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [statut, setStatut]     = useState('');
  const [acting, setActing]     = useState<number | null>(null);
  const [cpModal, setCpModal]   = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMesVisites.list(statut || undefined);
      // On ne garde que les visites où on est gestionnaire (côté bien)
      setVisites(Array.isArray(data) ? data : (data?.visites ?? []));
    } catch {
      setVisites([]);
    } finally {
      setLoading(false);
    }
  }, [statut]);

  useEffect(() => { load(); }, [load]);

  const act = async (action: () => Promise<any>, visitId: number) => {
    setActing(visitId);
    try {
      const updated = await action();
      setVisites(prev => prev.map(v => v.id === visitId ? { ...v, ...updated } : v));
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Erreur');
    } finally {
      setActing(null);
    }
  };

  const handleConfirmer = (v: any) =>
    act(() => patchVisite.confirmer(v.id), v.id);

  const handleContreProposer = (id: number, date: string) => {
    setCpModal(null);
    act(() => patchVisite.contreProposer(id, date), id);
  };

  const handleAnnuler = (v: any) => {
    const motif = prompt('Motif d\'annulation (optionnel) :') ?? '';
    act(() => patchVisite.annuler(v.id, motif), v.id);
  };

  const handleEffectuee = (v: any) => {
    if (!confirm('Marquer cette visite comme effectuée ?')) return;
    act(() => patchVisite.effectuee(v.id), v.id);
  };

  const badge = (v: any) => STATUT_BADGE[v.statut] ?? { label: v.statut, cls: 'badge-pending' };

  const countBy = (s: string) => visites.filter(v => v.statut === s).length;

  const statCards = [
    {
      label: 'En attente', value: countBy('en_attente'),
      iconBg: '#FEF3C7', iconColor: '#D97706',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
      ),
    },
    {
      label: 'Confirmées', value: countBy('confirmee'),
      iconBg: '#DCFCE7', iconColor: '#16A34A',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      ),
    },
    {
      label: 'Contre-proposées', value: countBy('contre_proposee'),
      iconBg: '#EDE9FE', iconColor: '#6366F1',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      ),
    },
    {
      label: 'Effectuées', value: countBy('effectuee'),
      iconBg: '#E0F2FE', iconColor: '#0891B2',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      ),
    },
  ];

  return (
    <div className="immo-page">

      {/* ── Titre ── */}
      <div>
        <h2 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--c-text)', margin: 0, lineHeight: 1.2 }}>
          Mes visites
        </h2>
        <p style={{ fontSize: '0.8125rem', color: 'var(--c-muted)', margin: '0.25rem 0 0' }}>
          Demandes de visites liées à vos biens
        </p>
      </div>

      {/* ── KPI cards ── */}
      <div className="stat-grid">
        {statCards.map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-card-top">
              <div className="stat-icon-wrap" style={{ background: s.iconBg, color: s.iconColor }}>
                {s.icon}
              </div>
            </div>
            <div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{loading ? '—' : s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filtres ── */}
      <div style={{ display: 'flex', borderBottom: '2px solid var(--c-border)', gap: 0, overflowX: 'auto' }}>
        {STATUTS.map(s => {
          const count = s.key ? countBy(s.key) : visites.length;
          const isActive = statut === s.key;
          return (
            <button key={s.key} onClick={() => setStatut(s.key)} style={{
              padding: '9px 16px', fontSize: 12, fontWeight: isActive ? 700 : 500, cursor: 'pointer',
              border: 'none', background: 'none', whiteSpace: 'nowrap',
              color: isActive ? 'var(--c-blue)' : 'var(--c-muted)',
              borderBottom: `2px solid ${isActive ? 'var(--c-blue)' : 'transparent'}`,
              marginBottom: -2, transition: 'color 0.15s',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              {s.label}
              {!loading && s.key && count > 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 10,
                  background: isActive ? 'var(--c-blue)' : 'var(--c-border)',
                  color: isActive ? '#fff' : 'var(--c-muted)',
                }}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Tableau ── */}
      <div className="immo-card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--c-muted)' }}>Chargement…</div>
        ) : visites.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}>
              <CalendarIcon size={48} />
            </div>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Aucune visite</div>
            <div style={{ color: 'var(--c-muted)', fontSize: 13 }}>
              Les demandes de visites sur vos biens apparaîtront ici.
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="immo-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Bien</th>
                  <th>Client</th>
                  <th>Date souhaitée</th>
                  <th>Contre-proposition</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visites.map((v: any) => {
                  const b = badge(v);
                  const peutConfirmer = v.statut === 'en_attente';
                  const peutContreProposer = v.statut === 'en_attente' || v.statut === 'contre_proposee';
                  const peutEffectuee = v.statut === 'confirmee';
                  const peutAnnuler = !['annulee', 'effectuee'].includes(v.statut);
                  const isActing = acting === v.id;

                  return (
                    <tr key={v.id}>
                      <td style={{ color: 'var(--c-muted)', fontSize: 12 }}>{v.id}</td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>
                          {v.bien?.localisation?.adresse ?? `Bien #${v.bien_id}`}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--c-muted)' }}>
                          {v.bien?.localisation?.ville ?? ''}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: 13 }}>
                          {v.client ? `${v.client.prenom} ${v.client.nom}` : '—'}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--c-muted)' }}>{v.client?.telephone ?? ''}</div>
                      </td>
                      <td style={{ fontSize: 12 }}>{formatDate(v.date_souhaitee)}</td>
                      <td style={{ fontSize: 12 }}>
                        {v.date_contre_proposee ? formatDate(v.date_contre_proposee) : <span style={{ color: 'var(--c-muted)' }}>—</span>}
                      </td>
                      <td><span className={`immo-badge ${b.cls}`}>{b.label}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                          {peutConfirmer && (
                            <button
                              className="btn-table-action"
                              style={{ background: '#DCFCE7', color: '#166534', border: '1px solid #BBF7D0' }}
                              onClick={() => handleConfirmer(v)}
                              disabled={isActing}
                              title="Confirmer"
                            >
                              ✓
                            </button>
                          )}
                          {peutContreProposer && (
                            <button
                              className="btn-table-action"
                              style={{ background: '#FEF9C3', color: '#854D0E', border: '1px solid #FDE68A' }}
                              onClick={() => setCpModal(v.id)}
                              disabled={isActing}
                              title="Contre-proposer une date"
                            >
                              <CalendarIcon size={14} />
                            </button>
                          )}
                          {peutEffectuee && (
                            <button
                              className="btn-table-action"
                              style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}
                              onClick={() => handleEffectuee(v)}
                              disabled={isActing}
                              title="Marquer effectuée"
                            >
                              <CheckCircleIcon size={14} />
                            </button>
                          )}
                          {peutAnnuler && (
                            <button
                              className="btn-table-action btn-table-danger"
                              onClick={() => handleAnnuler(v)}
                              disabled={isActing}
                              title="Annuler"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {cpModal != null && (
        <ContreProposerModal
          onClose={() => setCpModal(null)}
          onConfirm={date => handleContreProposer(cpModal, date)}
        />
      )}
    </div>
  );
}
