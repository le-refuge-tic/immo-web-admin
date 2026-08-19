import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMesBiens } from '../../api/getMesBiens';
import { postBien } from '../../api/postBien';
import PublierBienModal from './PublierBienModal';

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

/* ─── Page ────────────────────────────────────────────────── */

export default function MesAnnoncesPage() {
  const navigate = useNavigate();
  const [biens, setBiens]         = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [deleting, setDeleting]   = useState<number | null>(null);

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

  const handleDelete = async (b: any) => {
    if (!confirm(`Supprimer « ${getBienLabel(b)} » ? Cette action est irréversible.`)) return;
    setDeleting(b.id);
    try {
      await postBien.delete(b.id);
      setBiens(prev => prev.filter(x => x.id !== b.id));
    } catch {
      alert('Erreur lors de la suppression.');
    } finally {
      setDeleting(null);
    }
  };

  const handleCreated = (b: any) => {
    setBiens(prev => [b, ...prev]);
    setShowModal(false);
  };

  const getBienLabel = (b: any) => {
    const sous = b.amenites?.sous_type;
    return TYPE_LABEL[sous] ?? TYPE_LABEL[b.type] ?? b.type;
  };

  const mod   = (b: any) => MOD[b.statut_moderation] ?? { label: b.statut_moderation, cls: 'badge-pending' };
  const trans = (b: any) => TRANS[b.transaction] ?? b.transaction;

  return (
    <div className="immo-page">

      {/* ── En-tête ── */}
      <div className="immo-page-header">
        <div>
          <h1 className="immo-page-title">Mes annonces</h1>
          <p className="immo-page-sub">Vos biens publiés sur la plateforme</p>
        </div>
        <button className="btn-submit" onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>＋</span>
          Publier un bien
        </button>
      </div>

      {/* ── Stat chips ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'Total',       value: biens.length,                                         color: '#6366F1' },
          { label: 'Publiés',     value: biens.filter(b => b.statut_moderation === 'approuve').length, color: '#16A34A' },
          { label: 'En attente',  value: biens.filter(b => b.statut_moderation === 'en_attente').length, color: '#D97706' },
          { label: 'Rejetés',     value: biens.filter(b => b.statut_moderation === 'rejete').length,    color: '#DC2626' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--c-card)', border: '1px solid var(--c-border)',
            borderRadius: 10, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10,
            minWidth: 120,
          }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</span>
            <span style={{ fontSize: 12, color: 'var(--c-muted)', fontWeight: 500 }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── Tableau ── */}
      <div className="immo-card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--c-muted)' }}>Chargement…</div>
        ) : biens.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🏠</div>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Aucun bien publié</div>
            <div style={{ color: 'var(--c-muted)', fontSize: 13, marginBottom: 18 }}>
              Commencez par publier votre première annonce.
            </div>
            <button className="btn-submit" onClick={() => setShowModal(true)}>Publier un bien</button>
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
                            👁
                          </button>
                          <button
                            className="btn-table-action"
                            onClick={() => navigate(`/annonces/${b.id}/modifier`)}
                            title="Modifier"
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-table-action btn-table-danger"
                            onClick={() => handleDelete(b)}
                            disabled={deleting === b.id}
                            title="Supprimer"
                          >
                            {deleting === b.id ? '…' : '🗑'}
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

      {showModal && (
        <PublierBienModal
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
