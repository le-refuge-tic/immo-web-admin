import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SearchIcon, CardIcon, UsersIcon, HomeIcon, AlertIcon } from '../../components/Icons';
import { getAdminStats } from '../../api/getAdminStats';
import { getMessages } from '../../api/getMessages';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats]             = useState(null as any);
  const [totalUnread, setTotalUnread] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    getAdminStats.get().then(setStats).catch(() => {});
  }, []);

  useEffect(() => {
    const load = () =>
      getMessages.supervision().then(r => setTotalUnread(r.total_unread)).catch(() => {});
    load();
    pollRef.current = setInterval(load, 20_000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const statCards = [
    {
      label:   'UTILISATEURS TOTAUX',
      value:   stats ? stats.total_users.toLocaleString('fr-FR') : '—',
      badge:   stats ? `${stats.prospects} prospects` : '',
      sign:    'pos',
      iconBg:  '#EFF6FF',
      icon:    <UsersIcon size={22} />,
      iconColor: '#2563EB',
    },
    {
      label:   'ANNONCES ACTIVES',
      value:   stats ? stats.biens_approuves.toLocaleString('fr-FR') : '—',
      badge:   stats ? `${stats.total_biens} total` : '',
      sign:    'pos',
      iconBg:  '#FFF7ED',
      icon:    <HomeIcon size={22} />,
      iconColor: '#F97316',
    },
    {
      label:   'EN ATTENTE MODÉRATION',
      value:   stats ? stats.biens_en_attente.toLocaleString('fr-FR') : '—',
      badge:   'À traiter',
      sign:    stats && stats.biens_en_attente > 0 ? 'neg' : 'pos',
      iconBg:  '#FEF2F2',
      icon:    <AlertIcon size={22} />,
      iconColor: '#DC2626',
    },
    {
      label:   'PROPRIÉTAIRES & DÉMARCHEURS',
      value:   stats ? ((stats.proprietaires ?? 0) + (stats.demarcheurs ?? 0)).toLocaleString('fr-FR') : '—',
      badge:   stats ? `${stats.locataires} locataires` : '',
      sign:    'pos',
      iconBg:  '#F0FDF4',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
      iconColor: '#16A34A',
    },
  ];

  return (
    <>
      <div className="immo-topbar">
        <div className="immo-search-wrap">
          <SearchIcon />
          <input placeholder="Rechercher utilisateur, annonce..." readOnly />
        </div>
      </div>

      <div className="immo-page">
        <div>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: 'var(--c-text)', margin: 0 }}>
            LeRefugeTIC
          </h2>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-muted)', letterSpacing: '0.7px', textTransform: 'uppercase', marginTop: 4 }}>
            Vue d'ensemble — REFUGE
          </p>
        </div>

        <div className="stat-grid">
          {statCards.map((s) => (
            <div className="stat-card" key={s.label}>
              <div className="stat-card-top">
                <div className="stat-icon-wrap" style={{ background: s.iconBg, color: s.iconColor }}>
                  {s.icon}
                </div>
                {s.badge && (
                  <span className={`stat-badge ${s.sign}`}>{s.badge}</span>
                )}
              </div>
              <div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value">{s.value}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="dashboard-bottom">
          <div className="immo-card" style={{ padding: '20px 24px' }}>
            <div className="section-header">
              <span className="section-title">Annonces en attente de modération</span>
              <Link to="/moderation" className="section-link" style={{ textDecoration: 'none' }}>
                VOIR TOUT
              </Link>
            </div>
            {stats && stats.biens_en_attente === 0 ? (
              <p style={{ color: 'var(--c-muted)', fontSize: 13, marginTop: 16 }}>
                Aucune annonce en attente. Tout est à jour !
              </p>
            ) : (
              <div className="verif-more" style={{ marginTop: 16 }}>
                {stats ? stats.biens_en_attente : '…'} annonce(s) en attente de validation
              </div>
            )}
          </div>

          <div className="flux-momo-card">
            <div className="flux-header">
              <CardIcon size={18} />
              RÉSUMÉ PLATEFORME
            </div>
            <div>
              <div className="flux-amount">
                {stats ? stats.total_biens : '—'}
                <span style={{ fontSize: 18 }}> biens</span>
              </div>
              <div className="flux-today" style={{ marginTop: 6 }}>
                <div className="flux-today-dot" />
                Total des annonces publiées
              </div>
            </div>
            <div className="flux-split">
              <div className="flux-split-item">
                <div className="flux-split-label">PROPRIÉTAIRES</div>
                <div className="flux-split-pct orange">{stats?.proprietaires ?? '—'}</div>
              </div>
              <div className="flux-split-item">
                <div className="flux-split-label">DÉMARCHEURS</div>
                <div className="flux-split-pct">{stats?.demarcheurs ?? '—'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Supervision commerciaux ── */}
        <div
          onClick={() => navigate('/supervision')}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '18px 24px', borderRadius: 14, cursor: 'pointer',
            background: totalUnread > 0 ? '#FEF2F2' : 'var(--c-card, #fff)',
            border: `1.5px solid ${totalUnread > 0 ? '#FECACA' : 'var(--c-border)'}`,
            transition: 'all 0.18s',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: totalUnread > 0 ? '#FEE2E2' : '#EFF6FF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: totalUnread > 0 ? '#DC2626' : '#2563EB',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: totalUnread > 0 ? '#DC2626' : 'var(--c-text)' }}>
                Supervision commerciaux
              </div>
              <div style={{ fontSize: 12, color: 'var(--c-muted)', marginTop: 2 }}>
                {totalUnread > 0
                  ? `${totalUnread} message${totalUnread > 1 ? 's' : ''} non lu${totalUnread > 1 ? 's' : ''} — cliquez pour répondre`
                  : 'Aucun message en attente — tout est à jour'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {totalUnread > 0 && (
              <span style={{
                background: '#DC2626', color: '#fff', borderRadius: '50%',
                minWidth: 28, height: 28, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 13, fontWeight: 800, padding: '0 6px',
              }}>{totalUnread}</span>
            )}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--c-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>
        </div>

      </div>
    </>
  );
}
