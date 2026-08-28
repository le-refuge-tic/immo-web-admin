import { useState, useEffect } from 'react';
import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } });

const COLORS = ['#2563EB','#7C3AED','#DB2777','#D97706','#16A34A','#0891B2','#DC2626','#0284C7'];
function avatarColor(id: number) { return COLORS[Math.abs(id ?? 0) % COLORS.length]; }
function initials(u: any) { return `${u?.prenom?.[0] ?? ''}${u?.nom?.[0] ?? ''}`.toUpperCase() || (u?.email?.[0] ?? '#').toUpperCase(); }
function displayName(u: any) { return (u?.prenom || u?.nom) ? `${u?.prenom ?? ''} ${u?.nom ?? ''}`.trim() : (u?.email ?? `#${u?.id ?? '?'}`); }
function fmtDate(iso: string) { return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }

const STATUT_STYLES: Record<string, { label: string; color: string; bg: string; border: string }> = {
  en_attente: { label: 'En attente',  color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  traitee:    { label: 'Traitée',     color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
  rejetee:    { label: 'Rejetée',     color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
};

export default function PlaintesPage() {
  const [plaintes, setPlaintes] = useState<any[]>([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [filterStatut, setFilterStatut] = useState('');
  const [selected, setSelected] = useState<any | null>(null);
  const [reponse, setReponse]   = useState('');
  const [saving, setSaving]     = useState(false);

  const load = async (statut = filterStatut) => {
    setLoading(true);
    try {
      const params: any = { limit: 50 };
      if (statut) params.statut = statut;
      const res = await axios.get(`${BASE}/admin/plaintes`, { ...auth(), params });
      const d = res.data;
      setPlaintes(Array.isArray(d) ? d : (d?.data ?? []));
      setTotal(d?.total ?? 0);
    } catch { setPlaintes([]); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleUpdateStatut(id: number, statut: string, reponseAdmin?: string) {
    setSaving(true);
    try {
      await axios.patch(`${BASE}/admin/plaintes/${id}/statut`, { statut, reponse_admin: reponseAdmin }, auth());
      setPlaintes(prev => prev.map(p => p.id === id ? { ...p, statut, reponse_admin: reponseAdmin ?? p.reponse_admin } : p));
      if (selected?.id === id) setSelected((prev: any) => ({ ...prev, statut, reponse_admin: reponseAdmin ?? prev.reponse_admin }));
    } catch { /**/ } finally { setSaving(false); }
  }

  return (
    <>
      <div className="immo-topbar">
        <div>
          <h1 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: 'var(--c-text)' }}>Réclamations</h1>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--c-muted)' }}>
            {total} réclamation{total > 1 ? 's' : ''} reçue{total > 1 ? 's' : ''}
          </p>
        </div>
        <div className="immo-spacer" />
        <div style={{ display: 'flex', gap: 8 }}>
          {(['', 'en_attente', 'traitee', 'rejetee'] as const).map(s => (
            <button key={s} onClick={() => { setFilterStatut(s); load(s); }}
              style={{
                padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: filterStatut === s ? 'var(--c-blue)' : 'var(--c-card)',
                color: filterStatut === s ? '#fff' : 'var(--c-muted)',
                border: `1px solid ${filterStatut === s ? 'var(--c-blue)' : 'var(--c-border)'}`,
              }}
            >
              {s === '' ? 'Toutes' : STATUT_STYLES[s]?.label ?? s}
            </button>
          ))}
        </div>
      </div>

      <div className="immo-page" style={{ paddingTop: 0 }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          {/* Liste */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--c-muted)' }}>Chargement…</div>
            ) : plaintes.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--c-muted)', fontSize: 13 }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.35, marginBottom: 12 }}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
                </svg>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Aucune réclamation</div>
                <div style={{ fontSize: 12 }}>Les réclamations des utilisateurs apparaîtront ici</div>
              </div>
            ) : (
              <div className="immo-card" style={{ overflow: 'hidden', padding: 0 }}>
                {plaintes.map((p, idx) => {
                  const st = STATUT_STYLES[p.statut] ?? STATUT_STYLES['en_attente'];
                  const isSelected = selected?.id === p.id;
                  return (
                    <div key={p.id}
                      onClick={() => { setSelected(p); setReponse(p.reponse_admin ?? ''); }}
                      style={{
                        padding: '14px 20px', borderBottom: idx < plaintes.length - 1 ? '1px solid var(--c-border)' : 'none',
                        cursor: 'pointer', transition: 'background 0.1s',
                        background: isSelected ? '#EFF6FF' : 'transparent',
                        borderLeft: isSelected ? '3px solid var(--c-blue)' : '3px solid transparent',
                      }}
                    >
                      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <div style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0, background: avatarColor(p.user?.id ?? p.user_id), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff' }}>
                          {initials(p.user)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--c-text)' }}>{displayName(p.user)}</span>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                              {st.label}
                            </span>
                            {p.message_id && (
                              <span style={{ fontSize: 10, color: 'var(--c-muted)', background: 'var(--c-bg)', borderRadius: 4, padding: '1px 6px', border: '1px solid var(--c-border)' }}>
                                msg #{p.message_id}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--c-muted)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.contenu}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--c-muted)', marginTop: 4 }}>{fmtDate(p.created_at)}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Détail */}
          {selected && (
            <div style={{ width: 360, flexShrink: 0 }}>
              <div className="immo-card" style={{ padding: '20px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 42, height: 42, borderRadius: '50%', flexShrink: 0, background: avatarColor(selected.user?.id ?? selected.user_id), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: '#fff' }}>
                    {initials(selected.user)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--c-text)' }}>{displayName(selected.user)}</div>
                    <div style={{ fontSize: 11, color: 'var(--c-muted)' }}>{selected.user?.email ?? '—'}</div>
                  </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Réclamation</div>
                  <div style={{ fontSize: 13, color: 'var(--c-text)', lineHeight: 1.6, background: 'var(--c-bg)', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--c-border)' }}>
                    {selected.contenu}
                  </div>
                </div>

                {(selected.message_id || selected.conversation_id) && (
                  <div style={{ marginBottom: 14, fontSize: 12, color: 'var(--c-muted)' }}>
                    {selected.message_id && <span>Message supprimé #{selected.message_id}</span>}
                    {selected.conversation_id && <span> · Conv. #{selected.conversation_id}</span>}
                  </div>
                )}

                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Réponse admin</div>
                  <textarea
                    className="immo-form-input"
                    style={{ width: '100%', minHeight: 90, resize: 'vertical', fontFamily: 'inherit', fontSize: 13 }}
                    placeholder="Rédigez une réponse pour l'utilisateur…"
                    value={reponse}
                    onChange={e => setReponse(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleUpdateStatut(selected.id, 'traitee', reponse)}
                    disabled={saving}
                    style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#16A34A', color: '#fff', fontWeight: 600, fontSize: 12 }}
                  >
                    Marquer traitée
                  </button>
                  <button
                    onClick={() => handleUpdateStatut(selected.id, 'rejetee', reponse)}
                    disabled={saving}
                    style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#DC2626', color: '#fff', fontWeight: 600, fontSize: 12 }}
                  >
                    Rejeter
                  </button>
                </div>

                {selected.statut !== 'en_attente' && (
                  <button
                    onClick={() => handleUpdateStatut(selected.id, 'en_attente')}
                    disabled={saving}
                    style={{ width: '100%', marginTop: 8, padding: '7px 0', borderRadius: 8, border: '1px solid var(--c-border)', cursor: 'pointer', background: 'transparent', color: 'var(--c-muted)', fontWeight: 600, fontSize: 12 }}
                  >
                    Remettre en attente
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
