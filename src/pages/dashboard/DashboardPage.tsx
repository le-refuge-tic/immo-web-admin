import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SearchIcon, CardIcon, UsersIcon, HomeIcon, AlertIcon } from '../../components/Icons';
import { adminApi } from '../../api/admin.api';
import type { AdminStats } from '../../types';

export default function DashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    adminApi.getStats().then(setStats).catch(() => {});
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
      {/* ── Topbar ── */}
      <div className="immo-topbar">
        <div className="immo-search-wrap">
          <SearchIcon />
          <input placeholder="Rechercher utilisateur, annonce..." readOnly />
        </div>
      </div>

      {/* ── Content ── */}
      <div className="immo-page">
        <div>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: 'var(--c-text)', margin: 0 }}>
            Akwaba, Admin !
          </h2>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-muted)', letterSpacing: '0.7px', textTransform: 'uppercase', marginTop: 4 }}>
            Vue d'ensemble — MY HAVENKEY
          </p>
        </div>

        {/* Stat cards */}
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

        {/* Bottom section */}
        <div className="dashboard-bottom">
          {/* Biens en attente de modération */}
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

          {/* Résumé plateforme */}
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
      </div>
    </>
  );
}
