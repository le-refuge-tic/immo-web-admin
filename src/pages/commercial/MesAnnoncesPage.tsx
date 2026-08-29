import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMesBiens } from '../../api/getMesBiens';
import { EyeIcon } from '../../components/Icons';

/* ─── Helpers ─────────────────────────────────────────────── */

const TYPE_LABEL: Record<string, string> = {
  chambre_salon:       'Chambre-Salon',
  entree_coucher:      'Entrée-Coucher',
  appartement:         'Appartement',
  villa:               'Villa',
  maison_individuelle: 'Maison',
  villa_maison:        'Villa / Maison',
  boutique:            'Boutique / Local',
  terrain:             'Terrain',
  maison:              'Maison',
  appart_vide:         'Appartement',
  appart_meuble:       'Appart. meublé',
  guesthouse:          'Guesthouse',
};

const MOD: Record<string, { label: string; cls: string }> = {
  en_attente:   { label: 'En attente',   cls: 'badge-pending'  },
  approuve:     { label: 'Publié',        cls: 'badge-active'   },
  rejete:       { label: 'Rejeté',        cls: 'badge-danger'   },
  conditionnel: { label: 'Conditionnel',  cls: 'badge-warning'  },
};

const TRANS: Record<string, string> = {
  location: 'Location',
  vente:    'Vente',
};

function formatFcfa(v: number) {
  if (!v) return '—';
  return new Intl.NumberFormat('fr-FR').format(v) + ' FCFA';
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* ─── Modal : informations du propriétaire ───────────────── */

function ProprietaireInfoModal({ onConfirm, onClose }: {
  onConfirm: (info: { nom: string; prenom: string; telephone: string; email: string }) => void;
  onClose: () => void;
}) {
  const [nom, setNom]           = useState('');
  const [prenom, setPrenom]     = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail]       = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!nom.trim() || !prenom.trim() || !telephone.trim()) return;
    onConfirm({ nom: nom.trim(), prenom: prenom.trim(), telephone: telephone.trim(), email: email.trim() });
  };

  return (
    <div className="immo-modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="immo-modal" style={{ maxWidth: 440 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <div className="immo-modal-title" style={{ marginBottom: 4 }}>Informations du propriétaire</div>
            <div style={{ fontSize: 12, color: 'var(--c-muted)' }}>
              Renseignez les coordonnées du propriétaire du bien que vous allez publier.
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-muted)', padding: 4 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="immo-form-field">
              <label className="immo-form-label">Prénom *</label>
              <input className="immo-form-input" placeholder="Ex: Koffi" value={prenom} onChange={e => setPrenom(e.target.value)} required autoFocus />
            </div>
            <div className="immo-form-field">
              <label className="immo-form-label">Nom *</label>
              <input className="immo-form-input" placeholder="Ex: Adjovi" value={nom} onChange={e => setNom(e.target.value)} required />
            </div>
          </div>
          <div className="immo-form-field">
            <label className="immo-form-label">Téléphone *</label>
            <input className="immo-form-input" type="tel" placeholder="+229 XX XX XX XX" value={telephone} onChange={e => setTelephone(e.target.value)} required />
          </div>
          <div className="immo-form-field">
            <label className="immo-form-label">Email (optionnel)</label>
            <input className="immo-form-input" type="email" placeholder="proprio@email.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" className="btn-cancel" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn-submit" disabled={!nom.trim() || !prenom.trim() || !telephone.trim()}>
              Continuer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────── */

const DRAFT_KEY = 'publier_bien_draft';

const STATUS_FILTER = [
  { key: '',            label: 'Tous' },
  { key: 'approuve',    label: 'Publiés' },
  { key: 'en_attente',  label: 'En attente' },
  { key: 'rejete',      label: 'Rejetés' },
  { key: 'conditionnel',label: 'Conditionnel' },
];

const STATUS_CARD: Record<string, { label: string; bg: string; color: string; shadow: string }> = {
  approuve:     { label: 'Publié',       bg: '#16A34A', color: '#fff', shadow: 'rgba(22,163,74,0.30)'   },
  en_attente:   { label: 'En attente',   bg: '#D97706', color: '#fff', shadow: 'rgba(217,119,6,0.30)'   },
  rejete:       { label: 'Rejeté',       bg: '#DC2626', color: '#fff', shadow: 'rgba(220,38,38,0.30)'   },
  conditionnel: { label: 'Conditionnel', bg: '#7C3AED', color: '#fff', shadow: 'rgba(124,58,237,0.30)'  },
};

export default function MesAnnoncesPage() {
  const navigate = useNavigate();
  const [biens, setBiens]       = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showProprietaireModal, setShowProprietaireModal] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [filterType, setFilterType]     = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    try {
      const d = sessionStorage.getItem(DRAFT_KEY);
      setHasDraft(!!d);
    } catch { /* ignore */ }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMesBiens.list();
      setBiens(data ?? []);
    } catch {
      setBiens([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const getBienLabel = (b: any) => {
    const sous = b.amenites?.sous_type;
    return TYPE_LABEL[sous] ?? TYPE_LABEL[b.type] ?? b.type;
  };

  const mod   = (b: any) => MOD[b.statut_moderation] ?? { label: b.statut_moderation, cls: 'badge-pending' };
  const trans = (b: any) => TRANS[b.transaction] ?? b.transaction;

  // Types présents dans les biens chargés
  const typeOptions = [...new Set(biens.map(b => b.amenites?.sous_type ?? b.type).filter(Boolean))]
    .map(t => ({ key: t, label: TYPE_LABEL[t] ?? t }));

  const biensFiltered = biens
    .filter(b => !filterType   || (b.amenites?.sous_type ?? b.type) === filterType)
    .filter(b => !filterStatus || b.statut_moderation === filterStatus);

  const totalBiens  = biens.length;
  const publies     = biens.filter(b => b.statut_moderation === 'approuve').length;
  const enAttente   = biens.filter(b => b.statut_moderation === 'en_attente').length;
  const rejetes     = biens.filter(b => b.statut_moderation === 'rejete').length;

  const statCards = [
    {
      label: 'Total', value: totalBiens,
      iconBg: '#EFF6FF', iconColor: '#2563EB',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>
        </svg>
      ),
    },
    {
      label: 'Publiés', value: publies,
      iconBg: '#DCFCE7', iconColor: '#16A34A',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      ),
    },
    {
      label: 'En attente', value: enAttente,
      iconBg: '#FEF3C7', iconColor: '#D97706',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
      ),
    },
    {
      label: 'Rejetés', value: rejetes,
      iconBg: '#FEE2E2', iconColor: '#DC2626',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
      ),
    },
  ];

  return (
    <>
    <div className="immo-page">

      {/* ── Titre ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--c-text)', margin: 0, lineHeight: 1.2 }}>
            Mes annonces
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--c-muted)', margin: '0.25rem 0 0' }}>
            Vos biens publiés sur la plateforme
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {hasDraft && (
            <button onClick={() => navigate('/publier-bien')} title="Reprendre l'annonce en cours"
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, fontWeight: 700, fontSize: 12, background: 'rgba(99,102,241,0.10)', color: '#6366F1', border: '1px solid rgba(99,102,241,0.30)', cursor: 'pointer' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Brouillon
            </button>
          )}
          <button className="btn-submit" onClick={() => setShowProprietaireModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nouveau bien
          </button>
        </div>
      </div>

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
              <div className="stat-value">{loading ? '—' : s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filtres type de bien ── */}
      {!loading && (typeOptions.length > 0 || biens.length > 0) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Filtre par type */}
          {typeOptions.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--c-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: 2 }}>Type</span>
              {[{ key: '', label: 'Tous' }, ...typeOptions].map(opt => {
                const active = filterType === opt.key;
                return (
                  <button key={opt.key} onClick={() => setFilterType(opt.key)} style={{
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
          {/* Filtre par statut */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--c-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: 2 }}>Statut</span>
            {STATUS_FILTER.map(opt => {
              const active = filterStatus === opt.key;
              return (
                <button key={opt.key} onClick={() => setFilterStatus(opt.key)} style={{
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
        </div>
      )}

      {/* ── Tableau ── */}
      <div className="immo-card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--c-muted)' }}>Chargement…</div>
        ) : biens.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--c-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Aucun bien publié</div>
            <div style={{ color: 'var(--c-muted)', fontSize: 13, marginBottom: 18 }}>
              Commencez par publier votre première annonce.
            </div>
            <button className="btn-submit" onClick={() => setShowProprietaireModal(true)}>Publier un bien</button>
          </div>
        ) : biensFiltered.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--c-muted)', fontSize: 13 }}>
            Aucun bien ne correspond aux filtres sélectionnés.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 16, padding: 16 }}>
            {biensFiltered.map((b: any) => {
              const cover = b.photos?.find((p: any) => p.is_cover) ?? b.photos?.[0];
              const sc = STATUS_CARD[b.statut_moderation];
              return (
                <div key={b.id} style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--c-border)', background: 'var(--c-card)', display: 'flex', flexDirection: 'column', transition: 'box-shadow 0.15s', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
                  onClick={() => navigate(`/annonces/${b.id}`)}>
                  {/* Photo */}
                  <div style={{ position: 'relative', height: 160, background: 'var(--c-border)', flexShrink: 0 }}>
                    {cover ? (
                      <img src={cover.url} alt={getBienLabel(b)} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--c-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                        </svg>
                      </div>
                    )}
                    {/* Badge statut */}
                    <div style={{ position: 'absolute', top: 8, left: 8 }}>
                      {sc ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 3, background: sc.bg, boxShadow: `0 2px 8px ${sc.shadow}`, transform: 'skewX(-10deg)' }}>
                          <span style={{ display: 'inline-block', transform: 'skewX(10deg)', fontSize: 9, fontWeight: 800, letterSpacing: '0.5px', color: sc.color, lineHeight: 1.5 }}>{sc.label}</span>
                        </span>
                      ) : (
                        <span className={`immo-badge ${(mod(b)).cls}`} style={{ fontSize: 9 }}>{(mod(b)).label}</span>
                      )}
                    </div>
                    {/* Transaction */}
                    <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.55)', color: '#fff', borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 700 }}>
                      {trans(b)}
                    </div>
                  </div>
                  {/* Infos */}
                  <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--c-text)' }}>{getBienLabel(b)}</div>
                    <div style={{ fontSize: 12, color: 'var(--c-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                      </svg>
                      {[b.localisation?.quartier, b.localisation?.ville].filter(Boolean).join(', ') || '—'}
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--c-text)', marginTop: 4 }}>{formatFcfa(b.prix)}</div>
                    <div style={{ marginTop: 'auto', paddingTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 10, color: 'var(--c-muted)' }}>{b.nb_consultations ?? 0} vue(s)</span>
                      <span style={{ fontSize: 10, color: 'var(--c-muted)' }}>{b.created_at ? formatDate(b.created_at) : '—'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
    {showProprietaireModal && (
      <ProprietaireInfoModal
        onClose={() => setShowProprietaireModal(false)}
        onConfirm={(info) => {
          sessionStorage.setItem('proprietaire_info', JSON.stringify(info));
          setShowProprietaireModal(false);
          navigate('/publier-bien');
        }}
      />
    )}
    </>
  );
}
