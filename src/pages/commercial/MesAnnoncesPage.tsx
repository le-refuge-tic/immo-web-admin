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

export default function MesAnnoncesPage() {
  const navigate = useNavigate();
  const [biens, setBiens]       = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showProprietaireModal, setShowProprietaireModal] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);

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
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="immo-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Bien</th>
                  <th>Transaction</th>
                  <th>Prix</th>
                  <th>Localisation</th>
                  <th>Statut</th>
                  <th>Publié le</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {biens.map((b: any) => {
                  const m = mod(b);
                  return (
                    <tr key={b.id}>
                      <td style={{ color: 'var(--c-muted)', fontSize: 12 }}>{b.id}</td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{getBienLabel(b)}</div>
                        <div style={{ fontSize: 11, color: 'var(--c-muted)' }}>{b.nb_consultations ?? 0} vue(s)</div>
                      </td>
                      <td style={{ fontSize: 12 }}>{trans(b)}</td>
                      <td style={{ fontWeight: 700, fontSize: 13 }}>{formatFcfa(b.prix)}</td>
                      <td style={{ fontSize: 12 }}>
                        <div>{b.localisation?.ville ?? '—'}</div>
                        {b.localisation?.quartier && (
                          <div style={{ color: 'var(--c-muted)', fontSize: 11 }}>{b.localisation.quartier}</div>
                        )}
                      </td>
                      <td>
                        <span className={`immo-badge ${m.cls}`}>{m.label}</span>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--c-muted)' }}>
                        {b.created_at ? formatDate(b.created_at) : '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn-table-action"
                            onClick={() => navigate(`/annonces/${b.id}`)}
                            title="Voir le détail"
                          >
                            <EyeIcon size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
