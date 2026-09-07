import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMesBiens } from '../../api/getMesBiens';
import { getMesVisites } from '../../api/getMesVisites';
import { getPortefeuille, type Portefeuille } from '../../api/getPortefeuille';
import PortefeuilleCard from './PortefeuilleCard';
import HistoriquePortefeuilleCard from './HistoriquePortefeuilleCard';
import BiensMap from './BiensMap';
import Skeleton from '../../components/Skeleton';

const TYPE_LABEL: Record<string, string> = {
  chambre_salon: 'Chambre-Salon', entree_coucher: 'Entrée-Coucher',
  appartement: 'Appartement', villa: 'Villa', duplex: 'Duplex / Grande propriété',
  maison_individuelle: 'Maison', boutique: 'Boutique / Local',
  terrain: 'Terrain', maison: 'Maison', appart_vide: 'Appartement',
  appart_meuble: 'Appart. meublé', guesthouse: 'Guesthouse',
};

const MOD: Record<string, { label: string; cls: string }> = {
  en_attente: { label: 'En attente', cls: 'badge-pending' },
  approuve:   { label: 'Publié',     cls: 'badge-active'  },
  rejete:     { label: 'Rejeté',     cls: 'badge-danger'  },
};

const VISIT_BADGE: Record<string, { label: string; cls: string }> = {
  en_attente:      { label: 'En attente',     cls: 'badge-pending'  },
  confirmee:       { label: 'Confirmée',      cls: 'badge-active'   },
  contre_proposee: { label: 'Contre-prop.',   cls: 'badge-warning'  },
  effectuee:       { label: 'Effectuée',      cls: 'badge-info'     },
  annulee:         { label: 'Annulée',        cls: 'badge-danger'   },
};

function formatDate(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}


export default function CommercialDashboardPage() {
  const navigate = useNavigate();
  const [biens, setBiens]     = useState<any[]>([]);
  const [visites, setVisites] = useState<any[]>([]);
  const [portefeuille, setPortefeuille] = useState<Portefeuille | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getMesBiens.list().catch(() => []),
      getMesVisites.list().catch(() => ({ visites: [] })),
      getPortefeuille.get().catch(() => null),
    ]).then(([b, v, p]) => {
      setBiens(Array.isArray(b) ? b : []);
      setVisites(Array.isArray(v) ? v : (v?.visites ?? []));
      setPortefeuille(p);
      setLoading(false);
    });
  }, []);

  const soumis     = biens.length;
  const enVerif    = biens.filter(b => b.statut_moderation === 'en_attente').length;
  const published  = biens.filter(b => b.statut_moderation === 'approuve').length;
  const totalViews = biens.reduce((acc, b) => acc + (b.nb_consultations ?? 0), 0);
  const pending    = visites.filter(v => v.statut === 'en_attente').length;
  const confirmed  = visites.filter(v => v.statut === 'confirmee').length;
  const totalV     = visites.length;
  const effectuees = visites.filter(v => v.statut === 'effectuee').length;

  const statCards = [
    {
      label: 'Biens soumis', value: soumis,
      iconBg: '#EDE9FE', iconColor: '#7C3AED',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
        </svg>
      ),
    },
    {
      label: 'En vérification', value: enVerif,
      iconBg: '#FEF3C7', iconColor: '#D97706',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
      ),
    },
    {
      label: 'Biens validés', value: published,
      iconBg: '#DCFCE7', iconColor: '#16A34A',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      ),
    },
    {
      label: 'Vues totales', value: totalViews,
      iconBg: '#EFF6FF', iconColor: '#2563EB',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
        </svg>
      ),
    },
    {
      label: 'Visites en attente', value: pending,
      iconBg: '#FEF3C7', iconColor: '#D97706',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      ),
    },
    {
      label: 'Visites confirmées', value: confirmed,
      iconBg: '#E0F2FE', iconColor: '#0891B2',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      ),
    },
  ];

  const recentBiens   = biens.slice(0, 5);
  const recentVisites = visites.slice(0, 4);

  return (
    <div className="immo-page">

      {/* ── Titre ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--c-text)', margin: 0, lineHeight: 1.2 }}>
            Tableau de bord
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--c-muted)', margin: '0.25rem 0 0' }}>
            Votre activité commerciale
          </p>
        </div>
        <button className="btn-submit" onClick={() => navigate('/mes-annonces')}
          style={{ display: 'flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nouveau bien
        </button>
      </div>

      {/* ── Portefeuille hebdomadaire ── */}
      <PortefeuilleCard loading={loading} portefeuille={portefeuille} />

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
              <div className="stat-value">{loading ? <Skeleton width={40} height={22} /> : s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Historique portefeuille (4 derniers) ── */}
      <div className="content-grid-2">
        <HistoriquePortefeuilleCard />
        <div className="immo-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, minHeight: 120 }}>
          <div style={{ fontSize: 13, color: 'var(--c-muted)', textAlign: 'center' }}>
            Gérez votre solde et vos demandes de retrait sur la page dédiée.
          </div>
          <button className="btn-submit" onClick={() => navigate('/portefeuille-commercial')}
            style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
            </svg>
            Mon portefeuille
          </button>
        </div>
      </div>

      {/* ── Géolocalisation de mes biens ── */}
      <div className="immo-card">
        <div className="section-header">
          <span className="section-title">Localisation de mes biens</span>
        </div>
        <BiensMap
          biens={biens
            .filter(b => b.localisation?.latitude != null && b.localisation?.longitude != null)
            .map(b => ({
              id: b.id,
              label: TYPE_LABEL[b.amenites?.sous_type] ?? TYPE_LABEL[b.type] ?? b.type,
              statut_moderation: b.statut_moderation,
              latitude: Number(b.localisation.latitude),
              longitude: Number(b.localisation.longitude),
            }))}
        />
      </div>

      {/* ── Bottom panels ── */}
      <div className="dashboard-bottom">

        {/* Dernières annonces */}
        <div className="immo-card">
          <div className="section-header">
            <span className="section-title">Dernières annonces</span>
            <Link to="/mes-annonces" className="section-link">VOIR TOUT</Link>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.75rem 0', borderTop: i === 0 ? 'none' : '1px solid var(--c-border)', gap: 10,
                }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <Skeleton width="60%" height={13} style={{ marginBottom: 6 }} />
                    <Skeleton width="40%" height={11} />
                  </div>
                  <Skeleton width={64} height={20} radius={999} style={{ flexShrink: 0 }} />
                </div>
              ))}
            </div>
          ) : recentBiens.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--c-muted)', fontSize: 13 }}>
              Aucun bien publié.{' '}
              <button onClick={() => navigate('/mes-annonces')}
                style={{ background: 'none', border: 'none', color: 'var(--c-blue)', cursor: 'pointer', fontWeight: 600, fontSize: 13, padding: 0 }}>
                Publier maintenant
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {recentBiens.map((b: any, i: number) => {
                const sous = b.amenites?.sous_type;
                const label = TYPE_LABEL[sous] ?? TYPE_LABEL[b.type] ?? b.type;
                const mod   = MOD[b.statut_moderation] ?? { label: b.statut_moderation, cls: 'badge-pending' };
                return (
                  <div key={b.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.75rem 0',
                    borderTop: i === 0 ? 'none' : '1px solid var(--c-border)',
                    gap: 10,
                  }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--c-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {label}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--c-muted)', marginTop: 2 }}>
                        {b.localisation?.ville ?? '—'} · {formatDate(b.created_at)}
                      </div>
                    </div>
                    <span className={`immo-badge ${mod.cls}`} style={{ flexShrink: 0 }}>{mod.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Résumé visites */}
        <div className="flux-momo-card">
          <div className="flux-header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span>Visites</span>
          </div>
          <div className="flux-amount">
            {loading ? <Skeleton onGlass width={48} height={30} radius={8} /> : totalV}
            {!loading && <span>total</span>}
          </div>
          {loading && (
            <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[0, 1].map(i => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <Skeleton onGlass width="70%" height={11} />
                  <Skeleton onGlass width={40} height={16} radius={999} style={{ flexShrink: 0 }} />
                </div>
              ))}
            </div>
          )}
          {!loading && recentVisites.length > 0 && (
            <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {recentVisites.map((v: any) => {
                const b = VISIT_BADGE[v.statut] ?? { label: v.statut, cls: 'badge-pending' };
                return (
                  <div key={v.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      {v.bien?.localisation?.adresse ?? `Bien #${v.bien_id}`}
                    </div>
                    <span className={`immo-badge ${b.cls}`} style={{ flexShrink: 0, fontSize: 9 }}>{b.label}</span>
                  </div>
                );
              })}
            </div>
          )}
          <div className="flux-split" style={{ marginTop: '1rem' }}>
            <div className="flux-split-item">
              <div className="flux-split-label">En attente</div>
              <div className="flux-split-pct orange">{loading ? <Skeleton onGlass width={22} height={20} /> : pending}</div>
            </div>
            <div className="flux-split-item">
              <div className="flux-split-label">Confirmées</div>
              <div className="flux-split-pct">{loading ? <Skeleton onGlass width={22} height={20} /> : confirmed}</div>
            </div>
            <div className="flux-split-item">
              <div className="flux-split-label">Effectuées</div>
              <div className="flux-split-pct">{loading ? <Skeleton onGlass width={22} height={20} /> : effectuees}</div>
            </div>
          </div>
          <Link to="/mes-visites" style={{ display: 'block', marginTop: '1rem', textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.6)', textDecoration: 'none', letterSpacing: '0.05em' }}>
            VOIR TOUTES LES VISITES
          </Link>
        </div>

      </div>
    </div>
  );
}
