import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { commerciauxApi } from '../../api/getClientsCommercial';

const COLORS = ['#2563EB', '#7C3AED', '#DB2777', '#D97706', '#16A34A', '#0891B2', '#DC2626', '#0284C7'];
function avatarColor(id: number) { return COLORS[Math.abs(id ?? 0) % COLORS.length]; }
function initials(u: any) { return `${u.prenom?.[0] ?? ''}${u.nom?.[0] ?? ''}`.toUpperCase() || '?'; }

const ROLE_LABELS: Record<string, string> = {
  prospect:     'Prospect',
  locataire:    'Locataire',
  proprietaire: 'Propriétaire',
  client:       'Client',
};

export default function MesClientsPage() {
  const { user: me }              = useAuth();
  const navigate                  = useNavigate();
  const [clients, setClients]     = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');

  const load = useCallback(async () => {
    if (!me?.id) return;
    setLoading(true);
    try {
      const data = await commerciauxApi.getClients(me.id);
      setClients(Array.isArray(data) ? data : []);
    } catch {
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, [me?.id]);

  useEffect(() => { load(); }, [load]);

  const filtered = clients.filter(c => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.prenom?.toLowerCase().includes(q) ||
      c.nom?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.telephone?.includes(q)
    );
  });

  return (
    <div className="immo-page">

      {/* ── En-tête ── */}
      <div className="immo-page-header">
        <div>
          <h1 className="immo-page-title">Mes clients</h1>
          <p className="immo-page-sub">Clients qui vous ont été assignés</p>
        </div>
        <span style={{
          background: 'var(--c-card)', border: '1px solid var(--c-border)',
          borderRadius: 20, padding: '6px 14px', fontSize: 13, fontWeight: 700, color: 'var(--c-text)',
        }}>
          {clients.length} client{clients.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Recherche ── */}
      <div style={{ marginBottom: 20, position: 'relative', maxWidth: 360 }}>
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

      {/* ── Liste ── */}
      <div className="immo-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
            <span style={{ width: 32, height: 32, border: '3px solid var(--c-border)', borderTopColor: 'var(--c-blue)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'block' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--c-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
              </svg>
            </div>
            <div style={{ fontWeight: 700, color: 'var(--c-text)', marginBottom: 6 }}>
              {search ? 'Aucun résultat' : 'Aucun client assigné'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--c-muted)' }}>
              {search ? 'Essayez d\'autres termes de recherche.' : 'Votre responsable vous assignera des clients.'}
            </div>
          </div>
        ) : (
          <div>
            {filtered.map((c: any, idx: number) => {
              const role = c.role_principal ?? c.role ?? '';
              const roleLabel = ROLE_LABELS[role] ?? role;
              return (
                <div
                  key={c.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 20px',
                    borderBottom: idx < filtered.length - 1 ? '1px solid var(--c-border)' : 'none',
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                    background: avatarColor(c.id ?? 0),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 15, fontWeight: 700, color: '#fff',
                  }}>
                    {initials(c)}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--c-text)' }}>
                      {c.prenom} {c.nom}
                    </div>
                    {c.email && (
                      <div style={{ fontSize: 12, color: 'var(--c-muted)', marginTop: 1 }}>{c.email}</div>
                    )}
                    {c.telephone && (
                      <div style={{ fontSize: 12, color: 'var(--c-muted)' }}>{c.telephone}</div>
                    )}
                  </div>

                  {/* Badge rôle */}
                  {roleLabel && (
                    <span style={{
                      padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                      letterSpacing: '0.5px', textTransform: 'uppercase',
                      background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE',
                      flexShrink: 0,
                    }}>
                      {roleLabel}
                    </span>
                  )}

                  {/* Action : ouvrir le chat */}
                  <button
                    onClick={() => navigate('/messages')}
                    title="Ouvrir la messagerie"
                    style={{
                      width: 34, height: 34, borderRadius: 8, border: '1px solid var(--c-border)',
                      background: 'var(--c-card)', cursor: 'pointer', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', color: 'var(--c-blue)',
                      flexShrink: 0,
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
