import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMesBiens } from '../../api/getMesBiens';
import { getMesVisites } from '../../api/getMesVisites';

/* ── KPI card avec barre d'accent en haut ─────────────────── */
function KpiCard({ label, value, color, icon, loading }: {
  label: string; value: number | string; color: string; icon: React.ReactNode; loading?: boolean;
}) {
  if (loading) return (
    <div style={{ flex: '1 1 160px', borderRadius: 14, border: '1px solid var(--c-border)', background: 'var(--c-card)', height: 96, animation: 'pulse 1.5s ease-in-out infinite' }} />
  );
  return (
    <div style={{
      flex: '1 1 160px', borderRadius: 14, overflow: 'hidden',
      border: '1px solid var(--c-border)', background: 'var(--c-card)',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ height: 3, background: color }} />
      <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 30, fontWeight: 800, color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
          <div style={{ fontSize: 12, color: 'var(--c-muted)', marginTop: 5, fontWeight: 500 }}>{label}</div>
        </div>
        <div style={{ color, opacity: 0.35, flexShrink: 0 }}>{icon}</div>
      </div>
    </div>
  );
}

/* ── Tuile navigation ─────────────────────────────────────── */
function NavTile({ label, sub, color, onClick, icon }: {
  label: string; sub: string; color: string; onClick: () => void; icon: React.ReactNode;
}) {
  return (
    <button onClick={onClick} style={{
      background: 'var(--c-card)', border: '1px solid var(--c-border)', borderRadius: 12,
      padding: '14px 16px', cursor: 'pointer', textAlign: 'left', width: '100%',
      display: 'flex', alignItems: 'center', gap: 12,
      transition: 'border-color 0.15s, transform 0.1s',
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = color; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--c-border)'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}
    >
      <div style={{ width: 36, height: 36, borderRadius: 9, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-text)', whiteSpace: 'nowrap' }}>{label}</div>
        <div style={{ fontSize: 11, color: 'var(--c-muted)', marginTop: 2 }}>{sub}</div>
      </div>
      <svg style={{ marginLeft: 'auto', color: 'var(--c-muted)', flexShrink: 0 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

  const published  = biens.filter(b => b.statut_moderation === 'approuve').length;
  const totalViews = biens.reduce((acc, b) => acc + (b.nb_consultations ?? 0), 0);
  const pending    = visites.filter(v => v.statut === 'en_attente').length;
  const confirmed  = visites.filter(v => v.statut === 'confirmee').length;

  return (
    <div className="immo-page">

      {/* ── En-tête ── */}
      <div className="immo-page-header">
        <div>
          <h1 className="immo-page-title">Tableau de bord</h1>
          <p className="immo-page-sub">Votre activité commerciale</p>
        </div>
        <button className="btn-submit" onClick={() => navigate('/publier-bien')} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nouveau bien
        </button>
      </div>

      {/* ── KPIs ── */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <KpiCard label="Biens publiés" value={published} color="#16A34A" loading={loading} icon={
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        } />
        <KpiCard label="Vues totales" value={totalViews} color="#2563EB" loading={loading} icon={
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
          </svg>
        } />
        <KpiCard label="Visites en attente" value={pending} color="#D97706" loading={loading} icon={
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        } />
        <KpiCard label="Visites confirmées" value={confirmed} color="#0891B2" loading={loading} icon={
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        } />
      </div>

      {/* ── Accès rapides ── */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
          Accès rapides
        </p>

        {/* Publier un bien — action principale pleine largeur */}
        <button onClick={() => navigate('/publier-bien')} style={{
          width: '100%', marginBottom: 10, padding: '16px 20px', borderRadius: 14, cursor: 'pointer', textAlign: 'left',
          display: 'flex', alignItems: 'center', gap: 14, background: '#2563EB', border: 'none',
          transition: 'opacity 0.15s, transform 0.1s',
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.92'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}
        >
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><line x1="9" y1="22" x2="9" y2="12"/><line x1="15" y1="22" x2="15" y2="12"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>Publier un nouveau bien</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>Créez une annonce pour un client propriétaire</div>
          </div>
          <svg style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.6)', flexShrink: 0 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>

        {/* Grid 3 col pour le reste */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          <NavTile label="Mes annonces" sub={loading ? '—' : `${biens.length} bien${biens.length !== 1 ? 's' : ''}`}
            color="#6366F1" onClick={() => navigate('/mes-annonces')}
            icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>}
          />
          <NavTile label="Mes visites" sub={loading ? '—' : `${pending} en attente`}
            color="#D97706" onClick={() => navigate('/mes-visites')}
            icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
          />
          <NavTile label="Messages" sub="Discussions clients"
            color="#2563EB" onClick={() => navigate('/messages')}
            icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>}
          />
        </div>
      </div>

      <style>{`@keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }`}</style>
    </div>
  );
}
