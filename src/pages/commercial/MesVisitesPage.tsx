import { useState, useEffect, useCallback } from 'react';
import { getMesVisites } from '../../api/getMesVisites';
import { patchVisite } from '../../api/patchVisite';

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

  const badge = (v: any) => STATUT_BADGE[v.statut] ?? { label: v.statut, cls: 'badge-pending' };

  const countBy = (s: string) => visites.filter(v => v.statut === s).length;

  return (
    <div className="immo-page">

      {/* ── En-tête ── */}
      <div className="immo-page-header">
        <div>
          <h1 className="immo-page-title">Mes visites</h1>
          <p className="immo-page-sub">Demandes de visites liées à vos biens</p>
        </div>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'En attente',  value: countBy('en_attente'),      color: '#D97706' },
          { label: 'Confirmées',  value: countBy('confirmee'),        color: '#16A34A' },
          { label: 'Contre-prop', value: countBy('contre_proposee'),  color: '#6366F1' },
          { label: 'Effectuées',  value: countBy('effectuee'),        color: '#0891B2' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--c-card)', border: '1px solid var(--c-border)',
            borderRadius: 10, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10,
            minWidth: 120,
          }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</span>
            <span style={{ fontSize: 12, color: 'var(--c-muted)', fontWeight: 500 }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── Filtres statut ── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
        {STATUTS.map(s => (
          <button
            key={s.key}
            onClick={() => setStatut(s.key)}
            style={{
              padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              border: '1.5px solid',
              borderColor: statut === s.key ? 'var(--c-blue)' : 'var(--c-border)',
              background: statut === s.key ? 'var(--c-blue)' : 'var(--c-card)',
              color: statut === s.key ? '#fff' : 'var(--c-text)',
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* ── Tableau ── */}
      <div className="immo-card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--c-muted)' }}>Chargement…</div>
        ) : visites.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📅</div>
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
                              📅
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
