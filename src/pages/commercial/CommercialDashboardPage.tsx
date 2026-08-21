import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMesBiens } from '../../api/getMesBiens';
import { getMesVisites } from '../../api/getMesVisites';

function StatCard({ label, value, color, bg, icon }: {
  label: string; value: number | string; color: string; bg: string; icon: React.ReactNode;
}) {
  return (
    <div style={{
      background: 'var(--c-card)', border: '1px solid var(--c-border)',
      borderRadius: 12, padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 16, flex: '1 1 180px',
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 10, background: bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 12, color: 'var(--c-muted)', marginTop: 4, fontWeight: 500 }}>{label}</div>
      </div>
    </div>
  );
}

function QuickLink({ label, sub, color, onClick, icon }: {
  label: string; sub: string; color: string; onClick: () => void; icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'var(--c-card)', border: '1px solid var(--c-border)',
        borderRadius: 12, padding: '18px 20px', cursor: 'pointer', textAlign: 'left',
        display: 'flex', alignItems: 'center', gap: 14, flex: '1 1 200px',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = color;
        (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 0 3px ${color}18`;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--c-border)';
        (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 10, background: `${color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--c-text)' }}>{label}</div>
        <div style={{ fontSize: 11, color: 'var(--c-muted)', marginTop: 2 }}>{sub}</div>
      </div>
      <svg style={{ marginLeft: 'auto', color: 'var(--c-muted)', flexShrink: 0 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </button>
  );
}

export default function CommercialDashboardPage() {
  const navigate = useNavigate();
  const [biens, setBiens]     = useState<any[]>([]);
  const [visites, setVisites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getMesBiens.list().catch(() => []),
      getMesVisites.list().catch(() => ({ visites: [] })),
    ]).then(([b, v]) => {
      setBiens(Array.isArray(b) ? b : []);
      setVisites(Array.isArray(v) ? v : (v?.visites ?? []));
      setLoading(false);
    });
  }, []);

  const published   = biens.filter(b => b.statut_moderation === 'approuve').length;
  const totalViews  = biens.reduce((acc, b) => acc + (b.nb_consultations ?? 0), 0);
  const pending     = visites.filter(v => v.statut === 'en_attente').length;
  const confirmed   = visites.filter(v => v.statut === 'confirmee').length;

  return (
    <div className="immo-page">

      {/* ── En-tête ── */}
      <div className="immo-page-header">
        <div>
          <h1 className="immo-page-title">Tableau de bord</h1>
          <p className="immo-page-sub">Vue d'ensemble de votre activité commerciale</p>
        </div>
        <button className="btn-submit" onClick={() => navigate('/publier-bien')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>＋</span>
          Publier un bien
        </button>
      </div>

      {/* ── KPIs ── */}
      {loading ? (
        <div style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)', borderRadius: 12, height: 84, flex: '1 1 180px', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
          <StatCard label="Biens publiés" value={published} color="#16A34A" bg="#F0FDF4" icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          } />
          <StatCard label="Vues totales" value={totalViews} color="#2563EB" bg="#EFF6FF" icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
            </svg>
          } />
          <StatCard label="Visites en attente" value={pending} color="#D97706" bg="#FFFBEB" icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          } />
          <StatCard label="Visites confirmées" value={confirmed} color="#0891B2" bg="#ECFEFF" icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0891B2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          } />
        </div>
      )}

      {/* ── Accès rapides ── */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-text)', marginBottom: 14, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
          Accès rapides
        </div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <QuickLink
            label="Mes annonces"
            sub={`${biens.length} bien${biens.length > 1 ? 's' : ''}`}
            color="#6366F1"
            onClick={() => navigate('/mes-annonces')}
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
                <rect x="9" y="3" width="6" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>
              </svg>
            }
          />
          <QuickLink
            label="Mes visites"
            sub={`${pending} en attente`}
            color="#D97706"
            onClick={() => navigate('/mes-visites')}
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="7.5" cy="15.5" r="5.5"/><path d="M7.5 15.5h.01"/><path d="M11 12l8-8"/><path d="M19 4l1 1-1.5 1.5"/><path d="M17 6l1 1"/>
              </svg>
            }
          />
          <QuickLink
            label="Mes clients"
            sub="Clients assignés"
            color="#16A34A"
            onClick={() => navigate('/mes-clients')}
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><path d="M19 8l2 2 4-4"/>
              </svg>
            }
          />
          <QuickLink
            label="Messages"
            sub="Discussions avec clients"
            color="#2563EB"
            onClick={() => navigate('/messages')}
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            }
          />
        </div>
      </div>

      <style>{`@keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }`}</style>
    </div>
  );
}
