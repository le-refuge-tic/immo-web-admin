import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } });

const STATUT_LABELS: Record<string, string> = {
  en_attente: 'En attente',
  approuve:   'Approuvé',
  rejete:     'Rejeté',
  envoye:     'Envoyé',
  echoue:     'Échoué',
};

const STATUT_COLORS: Record<string, string> = {
  en_attente: '#f59e0b',
  approuve:   '#3b82f6',
  rejete:     '#ef4444',
  envoye:     '#10b981',
  echoue:     '#ef4444',
};

function fmtMontant(n: number) {
  return n?.toLocaleString('fr-FR') + ' FCFA';
}

function fmtDate(raw: string) {
  if (!raw) return '—';
  return new Date(raw).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function walletLabel(type: string) {
  switch (type) {
    case 'epargne':          return 'Épargne';
    case 'revenus_locatifs': return 'Revenus locatifs';
    default:                 return type;
  }
}

export default function RetraitsPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';

  const [retraits, setRetraits]         = useState<any[]>([]);
  const [loading, setLoading]           = useState(false);
  const [filtreStatut, setFiltreStatut] = useState('en_attente');
  const [actionId, setActionId]         = useState<number | null>(null);
  const [motifRejet, setMotifRejet]     = useState('');
  const [rejectingId, setRejectingId]   = useState<number | null>(null);
  const [toast, setToast]               = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = filtreStatut ? `?statut=${filtreStatut}` : '';
      const res = await fetch(`${BASE}/retraits/admin${params}`, auth() as any);
      const data = await res.json();
      setRetraits(Array.isArray(data) ? data : data.data ?? []);
    } catch {
      showToast('Erreur lors du chargement', false);
    } finally {
      setLoading(false);
    }
  }, [filtreStatut]);

  useEffect(() => { load(); }, [load]);

  const valider = async (id: number) => {
    setActionId(id);
    try {
      const res = await fetch(`${BASE}/retraits/admin/${id}/valider`, {
        method: 'PATCH',
        ...(auth() as any),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? 'Erreur');
      }
      showToast('Retrait validé et envoyé avec succès');
      load();
    } catch (e: any) {
      showToast(e.message ?? 'Erreur lors de la validation', false);
    } finally {
      setActionId(null);
    }
  };

  const rejeter = async (id: number) => {
    setActionId(id);
    try {
      const res = await fetch(`${BASE}/retraits/admin/${id}/rejeter`, {
        method: 'PATCH',
        headers: {
          ...((auth() as any).headers),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ motif: motifRejet || undefined }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? 'Erreur');
      }
      showToast('Retrait rejeté');
      setRejectingId(null);
      setMotifRejet('');
      load();
    } catch (e: any) {
      showToast(e.message ?? 'Erreur lors du rejet', false);
    } finally {
      setActionId(null);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>
        <p style={{ fontSize: 18, fontWeight: 600 }}>Accès réservé au Super Admin</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 9999,
          background: toast.ok ? '#10b981' : '#ef4444',
          color: '#fff', padding: '12px 20px', borderRadius: 10,
          fontWeight: 600, fontSize: 14, boxShadow: '0 4px 16px rgba(0,0,0,.2)',
        }}>
          {toast.msg}
        </div>
      )}

      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
        Demandes de retrait
      </h1>
      <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 20 }}>
        Validez ou rejetez les demandes de retrait Mobile Money.
      </p>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['en_attente', 'approuve', 'envoye', 'rejete', 'echoue', ''].map(s => (
          <button
            key={s}
            onClick={() => setFiltreStatut(s)}
            style={{
              padding: '6px 16px',
              borderRadius: 20,
              border: '1.5px solid',
              borderColor: filtreStatut === s ? '#1a3a6b' : '#e5e7eb',
              background: filtreStatut === s ? '#1a3a6b' : '#fff',
              color: filtreStatut === s ? '#fff' : '#374151',
              fontWeight: 600, fontSize: 13, cursor: 'pointer',
            }}
          >
            {s ? STATUT_LABELS[s] : 'Tous'}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>Chargement…</div>
      ) : retraits.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af', fontSize: 15 }}>
          Aucune demande de retrait
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['Bénéficiaire', 'Montant', 'Wallet', 'Numéro', 'Statut', 'Date', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: 12 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {retraits.map((r: any, i: number) => {
                const isLast     = i === retraits.length - 1;
                const pending    = r.statut === 'en_attente';
                const isRejecting = rejectingId === r.id;
                const isActing   = actionId === r.id;
                const nom = [r.user?.prenom, r.user?.nom].filter(Boolean).join(' ') || `User #${r.user_id}`;

                return (
                  <tr
                    key={r.id}
                    style={{ borderBottom: isLast ? 'none' : '1px solid #f3f4f6', verticalAlign: 'top' }}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 600 }}>{nom}</div>
                      {r.user?.email && (
                        <div style={{ color: '#9ca3af', fontSize: 12 }}>{r.user.email}</div>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: '#1a3a6b' }}>
                      {fmtMontant(Number(r.montant))}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#6b7280' }}>
                      {walletLabel(r.wallet?.type ?? '')}
                    </td>
                    <td style={{ padding: '14px 16px', fontFamily: 'monospace', letterSpacing: 1 }}>
                      {r.numero_telephone}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        padding: '3px 10px',
                        borderRadius: 20,
                        background: (STATUT_COLORS[r.statut] ?? '#9ca3af') + '18',
                        color: STATUT_COLORS[r.statut] ?? '#9ca3af',
                        fontWeight: 700, fontSize: 12,
                      }}>
                        {STATUT_LABELS[r.statut] ?? r.statut}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#6b7280', fontSize: 12, whiteSpace: 'nowrap' }}>
                      {fmtDate(r.created_at)}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {pending && !isRejecting && (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={() => valider(r.id)}
                            disabled={isActing}
                            style={{
                              padding: '6px 14px', borderRadius: 8, border: 'none',
                              background: '#10b981', color: '#fff', fontWeight: 600,
                              fontSize: 13, cursor: isActing ? 'not-allowed' : 'pointer',
                              opacity: isActing ? 0.7 : 1,
                            }}
                          >
                            {isActing ? '…' : 'Valider'}
                          </button>
                          <button
                            onClick={() => setRejectingId(r.id)}
                            disabled={isActing}
                            style={{
                              padding: '6px 14px', borderRadius: 8, border: 'none',
                              background: '#fee2e2', color: '#ef4444', fontWeight: 600,
                              fontSize: 13, cursor: isActing ? 'not-allowed' : 'pointer',
                            }}
                          >
                            Rejeter
                          </button>
                        </div>
                      )}
                      {pending && isRejecting && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 200 }}>
                          <input
                            placeholder="Motif (optionnel)"
                            value={motifRejet}
                            onChange={e => setMotifRejet(e.target.value)}
                            style={{
                              padding: '6px 10px', borderRadius: 8,
                              border: '1.5px solid #e5e7eb', fontSize: 13,
                            }}
                          />
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              onClick={() => rejeter(r.id)}
                              disabled={isActing}
                              style={{
                                flex: 1, padding: '6px 0', borderRadius: 8, border: 'none',
                                background: '#ef4444', color: '#fff', fontWeight: 600,
                                fontSize: 13, cursor: isActing ? 'not-allowed' : 'pointer',
                                opacity: isActing ? 0.7 : 1,
                              }}
                            >
                              {isActing ? '…' : 'Confirmer rejet'}
                            </button>
                            <button
                              onClick={() => { setRejectingId(null); setMotifRejet(''); }}
                              style={{
                                padding: '6px 12px', borderRadius: 8, border: '1px solid #e5e7eb',
                                background: '#fff', fontSize: 13, cursor: 'pointer',
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      )}
                      {!pending && (
                        <span style={{ color: '#9ca3af', fontSize: 12 }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
