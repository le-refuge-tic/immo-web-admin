import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { commerciauxApi } from '../../api/getClientsCommercial';
import { supervisionApi } from '../../api/commercialSupervisionApi';

const COLORS = ['#2563EB', '#7C3AED', '#DB2777', '#D97706', '#16A34A', '#0891B2', '#DC2626', '#0284C7'];
function avatarColor(id: number) { return COLORS[Math.abs(id ?? 0) % COLORS.length]; }
function initials(u: any) { return `${u.prenom?.[0] ?? ''}${u.nom?.[0] ?? ''}`.toUpperCase() || (u.email?.[0] ?? '#').toUpperCase(); }
function displayName(u: any) { return (u.prenom || u.nom) ? `${u.prenom ?? ''} ${u.nom ?? ''}`.trim() : (u.email ?? u.telephone ?? `Utilisateur #${u.id}`); }

const ROLE_LABELS: Record<string, string> = {
  prospect:     'Prospect',
  locataire:    'Locataire',
  proprietaire: 'Propriétaire',
  client:       'Client',
};

const ROLE_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  prospect:     { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
  locataire:    { bg: '#F5F3FF', color: '#7C3AED', border: '#DDD6FE' },
  proprietaire: { bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0' },
  client:       { bg: '#FFFBEB', color: '#B45309', border: '#FDE68A' },
};

export default function MesClientsPage() {
  const { user: me }                    = useAuth();
  const navigate                        = useNavigate();
  const [clients, setClients]           = useState<any[]>([]);
  const [proprietairesData, setProprietairesData] = useState<any>(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [search, setSearch]             = useState('');
  const [filterRole, setFilterRole]     = useState('');

  const load = useCallback(async () => {
    if (!me?.id) return;
    setLoading(true);
    setError('');
    try {
      const [clientsData, propData] = await Promise.all([
        commerciauxApi.getClients(me.id),
        supervisionApi.getProprietairesBiensParCommercial(me.id).catch(() => null),
      ]);
      setClients(Array.isArray(clientsData) ? clientsData : []);
      setProprietairesData(propData);
    } catch (err: any) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message;
      setError(status === 403
        ? 'Accès refusé — contactez votre responsable.'
        : (msg ?? 'Impossible de charger vos clients.'));
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, [me?.id]);

  useEffect(() => { load(); }, [load]);

  const proprietaires: any[] = proprietairesData?.proprietaires ?? [];
  const nbVerifies   = proprietairesData?.nb_verifies   ?? 0;
  const nbEnAttente  = proprietairesData?.nb_en_attente ?? 0;

  const rolesPresents = [...new Set(clients.map(c => c.role_principal ?? c.role ?? '').filter(Boolean))];

  const filtered = clients.filter(c => {
    const q = search.toLowerCase().trim();
    if (q && !(
      c.prenom?.toLowerCase().includes(q) ||
      c.nom?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.telephone?.includes(q)
    )) return false;
    if (filterRole && (c.role_principal ?? c.role) !== filterRole) return false;
    return true;
  });

  const filteredProprios = proprietaires.filter(p => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      p.prenom?.toLowerCase().includes(q) ||
      p.nom?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      p.telephone?.includes(q)
    );
  });

  const statCards = [
    {
      label: 'Propriétaires',
      value: proprietaires.length,
      iconBg: '#EFF6FF', iconColor: '#2563EB',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      ),
    },
    {
      label: 'Vérifiés',
      value: nbVerifies,
      iconBg: '#DCFCE7', iconColor: '#16A34A',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      ),
    },
    {
      label: 'En attente',
      value: nbEnAttente,
      iconBg: '#FEF3C7', iconColor: '#D97706',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      ),
    },
    {
      label: 'Clients assignés',
      value: clients.length,
      iconBg: '#F5F3FF', iconColor: '#7C3AED',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
        </svg>
      ),
    },
  ];

  return (
    <div className="immo-page">

      {/* ── Titre ── */}
      <div>
        <h2 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--c-text)', margin: 0, lineHeight: 1.2 }}>
          Mes clients
        </h2>
        <p style={{ fontSize: '0.8125rem', color: 'var(--c-muted)', margin: '0.25rem 0 0' }}>
          Propriétaires de vos annonces et clients assignés
        </p>
      </div>

      {/* ── KPI cards ── */}
      {!loading && (
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
                <div className="stat-value">{s.value}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Recherche + filtre rôle ── */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: 380 }}>
          <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--c-muted)' }}
            width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className="immo-form-input"
            style={{ paddingLeft: 36 }}
            placeholder="Rechercher un client…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {rolesPresents.length > 1 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[{ key: '', label: 'Tous' }, ...rolesPresents.map(r => ({ key: r, label: ROLE_LABELS[r] ?? r }))].map(opt => {
              const active = filterRole === opt.key;
              return (
                <button key={opt.key} onClick={() => setFilterRole(opt.key)} style={{
                  padding: '5px 13px', borderRadius: 20, fontSize: 12, fontWeight: active ? 700 : 500,
                  border: `1.5px solid ${active ? 'var(--c-blue)' : 'var(--c-border)'}`,
                  background: active ? 'var(--c-blue)' : 'transparent',
                  color: active ? '#fff' : 'var(--c-muted)',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}>
                  {opt.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Erreur ── */}
      {error && (
        <div style={{ padding: '10px 16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, fontSize: 13, color: '#DC2626' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
          <span style={{ width: 32, height: 32, border: '3px solid var(--c-border)', borderTopColor: 'var(--c-blue)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'block' }} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: '52rem' }}>

          {/* ═══ Section 1 : Propriétaires ═══ */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--c-text)' }}>Propriétaires</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--c-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>biens publiés par vous</span>
              <span style={{ marginLeft: 'auto', background: 'var(--c-card)', border: '1px solid var(--c-border)', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700, color: 'var(--c-text)' }}>
                {filteredProprios.length}
              </span>
            </div>
            <div className="immo-card" style={{ padding: 0, overflow: 'hidden' }}>
              {filteredProprios.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--c-muted)', fontSize: 13 }}>
                  {search ? 'Aucun propriétaire ne correspond.' : 'Aucun propriétaire renseigné sur vos annonces.'}
                </div>
              ) : (
                filteredProprios.map((p: any, idx: number) => (
                  <div key={idx} style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 20px',
                    borderBottom: idx < filteredProprios.length - 1 ? '1px solid var(--c-border)' : 'none',
                    transition: 'background 0.12s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--c-bg)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                      background: '#7C3AED',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 700, color: '#fff',
                    }}>
                      {`${p.prenom?.[0] ?? ''}${p.nom?.[0] ?? ''}`.toUpperCase() || '?'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--c-text)' }}>
                        {`${p.prenom ?? ''} ${p.nom ?? ''}`.trim() || '—'}
                      </div>
                      {p.telephone && <div style={{ fontSize: 12, color: 'var(--c-muted)', marginTop: 2 }}>{p.telephone}</div>}
                      {p.email    && <div style={{ fontSize: 12, color: 'var(--c-muted)' }}>{p.email}</div>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                        letterSpacing: '0.5px', textTransform: 'uppercase',
                        background: p.verifie ? '#F0FDF4' : '#FFFBEB',
                        color:      p.verifie ? '#15803D' : '#B45309',
                        border: `1px solid ${p.verifie ? '#BBF7D0' : '#FDE68A'}`,
                      }}>
                        {p.verifie ? 'Vérifié' : 'En attente'}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--c-muted)' }}>
                        {p.biens?.length ?? 0} bien{(p.biens?.length ?? 0) > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ═══ Section 2 : Clients assignés ═══ */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--c-text)' }}>Clients assignés</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--c-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>par votre responsable</span>
              <span style={{ marginLeft: 'auto', background: 'var(--c-card)', border: '1px solid var(--c-border)', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700, color: 'var(--c-text)' }}>
                {filtered.length}
              </span>
            </div>
            <div className="immo-card" style={{ padding: 0, overflow: 'hidden' }}>
              {filtered.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center' }}>
                  <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--c-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                    </svg>
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--c-text)', marginBottom: 6 }}>
                    {search ? 'Aucun résultat' : 'Aucun client assigné'}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--c-muted)' }}>
                    {search ? 'Essayez d\'autres termes.' : 'Votre responsable vous assignera des clients.'}
                  </div>
                </div>
              ) : (
                filtered.map((c: any, idx: number) => {
                  const role = c.role_principal ?? c.role ?? '';
                  const roleLabel = ROLE_LABELS[role] ?? role;
                  const roleStyle = ROLE_COLORS[role] ?? { bg: '#F1F5F9', color: '#64748B', border: '#E2E8F0' };
                  return (
                    <div key={c.id} style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '14px 20px',
                      borderBottom: idx < filtered.length - 1 ? '1px solid var(--c-border)' : 'none',
                      transition: 'background 0.12s',
                    }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--c-bg)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div style={{
                        width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                        background: avatarColor(c.id ?? 0),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, fontWeight: 700, color: '#fff',
                      }}>
                        {initials(c)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--c-text)' }}>{displayName(c)}</div>
                        {(c.prenom || c.nom) && c.email     && <div style={{ fontSize: 12, color: 'var(--c-muted)', marginTop: 2 }}>{c.email}</div>}
                        {(c.prenom || c.nom) && c.telephone && <div style={{ fontSize: 12, color: 'var(--c-muted)' }}>{c.telephone}</div>}
                      </div>
                      {roleLabel && (
                        <span style={{
                          padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                          letterSpacing: '0.5px', textTransform: 'uppercase',
                          background: roleStyle.bg, color: roleStyle.color,
                          border: `1px solid ${roleStyle.border}`,
                          flexShrink: 0,
                        }}>
                          {roleLabel}
                        </span>
                      )}
                      <button onClick={() => navigate('/messages')} title="Messagerie"
                        style={{
                          width: 34, height: 34, borderRadius: 8,
                          border: '1px solid var(--c-border)', background: 'var(--c-card)',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'var(--c-blue)', flexShrink: 0,
                          transition: 'background 0.12s, border-color 0.12s',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#EFF6FF'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--c-blue)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--c-card)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--c-border)'; }}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
