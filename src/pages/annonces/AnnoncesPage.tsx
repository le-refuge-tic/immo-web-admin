import { useState, useEffect, useCallback } from 'react';
import { SearchIcon, PinIcon, TrashIcon, ChevronLeftIcon, ChevronRightIcon } from '../../components/Icons';
import { adminApi } from '../../api/admin.api';
import type { Bien, TypeBien, StatutModeration } from '../../types';

const API_URL = import.meta.env.VITE_API_URL?.replace('/api/v1', '') ?? 'http://localhost:3000';

type FilterTab = 'tous' | TypeBien;

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'tous',          label: 'Tous les biens' },
  { key: 'maison',        label: 'Maisons' },
  { key: 'appart_vide',   label: 'Appartements vides' },
  { key: 'appart_meuble', label: 'Appartements meublés' },
  { key: 'guesthouse',    label: 'Guesthouses' },
  { key: 'terrain',       label: 'Terrains' },
];

const TYPE_LABELS: Record<string, string> = {
  maison:        'MAISON',
  appart_vide:   'APPART VIDE',
  appart_meuble: 'APPART MEUBLÉ',
  guesthouse:    'GUESTHOUSE',
  terrain:       'TERRAIN',
};

const MOD_BADGE: Record<StatutModeration, { label: string; className: string }> = {
  en_attente:  { label: 'EN ATTENTE',   className: 'pending'  },
  approuve:    { label: 'APPROUVÉ',     className: 'verified' },
  rejete:      { label: 'REJETÉ',       className: 'danger'   },
  conditionnel:{ label: 'CONDITIONNEL', className: 'pending'  },
};

const LIMIT = 12;

export default function AnnoncesPage() {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('tous');
  const [biens, setBiens]               = useState<Bien[]>([]);
  const [total, setTotal]               = useState(0);
  const [page, setPage]                 = useState(1);
  const [search, setSearch]             = useState('');
  const [loading, setLoading]           = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getBiens({
        page,
        limit: LIMIT,
        type:  activeFilter !== 'tous' ? activeFilter : undefined,
      });
      setBiens(res.data);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  }, [page, activeFilter]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / LIMIT);

  async function handleModerate(id: number, statut: StatutModeration) {
    await adminApi.moderateBien(id, { statut_moderation: statut });
    load();
  }

  async function handleDelete(id: number) {
    if (!confirm('Supprimer ce bien définitivement ?')) return;
    await adminApi.deleteBien(id);
    load();
  }

  function handleTabChange(t: FilterTab) {
    setActiveFilter(t);
    setPage(1);
  }

  const displayed = search
    ? biens.filter(
        (b) =>
          b.localisation?.ville?.toLowerCase().includes(search.toLowerCase()) ||
          b.localisation?.quartier?.toLowerCase().includes(search.toLowerCase()) ||
          b.description?.toLowerCase().includes(search.toLowerCase()),
      )
    : biens;

  return (
    <>
      {/* ── Topbar ── */}
      <div className="immo-topbar">
        <div className="immo-topbar-title">
          <h1>Catalogue Immobilier</h1>
          <p>{total} bien{total > 1 ? 's' : ''} au total</p>
        </div>
        <div className="immo-spacer" />
        <div className="immo-search-wrap">
          <SearchIcon />
          <input
            placeholder="Filtrer par ville, quartier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── Content ── */}
      <div className="immo-page">
        {/* Filter pills */}
        <div className="filter-pills" style={{ overflowX: 'auto', flexWrap: 'nowrap' }}>
          <span className="filter-label">Type :</span>
          {FILTER_TABS.map((p) => (
            <button
              key={p.key}
              className={`pill ${activeFilter === p.key ? 'active-blue' : ''}`}
              onClick={() => handleTabChange(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--c-muted)' }}>
            Chargement…
          </div>
        ) : displayed.length === 0 ? (
          <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--c-muted)' }}>
            Aucun bien trouvé.
          </div>
        ) : (
          <div className="annonce-grid">
            {displayed.map((b) => {
              const cover = b.photos?.find((p) => p.is_cover) ?? b.photos?.[0];
              const mod   = b.statut_moderation ?? 'en_attente';
              const badge = MOD_BADGE[mod as StatutModeration];

              return (
                <div className="annonce-card" key={b.id}>
                  {/* Image */}
                  <div className="annonce-img">
                    {cover ? (
                      <img src={`${API_URL}/${cover.url}`} alt={b.type} />
                    ) : (
                      <div style={{
                        width: '100%', height: '100%', background: '#E2E8F0',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--c-muted)', fontSize: 13,
                      }}>
                        Pas de photo
                      </div>
                    )}
                    <div className="annonce-img-badges">
                      <span className="badge-type">{TYPE_LABELS[b.type] ?? b.type.toUpperCase()}</span>
                    </div>
                    <span className={`badge-statut badge-verif ${badge.className}`} style={{
                      position: 'absolute', bottom: 8, right: 8, fontSize: 10,
                    }}>
                      {badge.label}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="annonce-body">
                    <div className="annonce-title-row">
                      <div className="annonce-name">
                        {b.type === 'maison' && 'Maison'}
                        {b.type === 'appart_vide' && 'Appart. vide'}
                        {b.type === 'appart_meuble' && 'Appart. meublé'}
                        {b.type === 'guesthouse' && 'Guesthouse'}
                        {b.type === 'terrain' && 'Terrain'}
                        {b.localisation?.quartier ? ` – ${b.localisation.quartier.toUpperCase()}` : ''}
                      </div>
                      <div className="annonce-price-block">
                        <div className="annonce-price">
                          {Number(b.prix).toLocaleString('fr-FR')}
                          <span style={{ fontSize: 13, fontWeight: 600 }}> F</span>
                        </div>
                        <div className="annonce-price-type">
                          {b.transaction === 'vente' ? 'PRIX DE VENTE' : 'LOYER MENSUEL'}
                        </div>
                      </div>
                    </div>

                    {b.localisation && (
                      <div className="annonce-location">
                        <PinIcon />
                        {b.localisation.ville}{b.localisation.quartier ? `, ${b.localisation.quartier}` : ''}
                      </div>
                    )}

                    <div className="annonce-meta">
                      <div className="annonce-meta-item">
                        <span className="annonce-meta-label">Auteur</span>
                        <span className="annonce-meta-value">
                          {b.user ? `${b.user.nom} ${b.user.prenom}` : `#${b.user_id}`}
                        </span>
                      </div>
                      <div className="annonce-meta-item">
                        <span className="annonce-meta-label">Photos</span>
                        <span className="annonce-meta-value">{b.photos?.length ?? 0}</span>
                      </div>
                    </div>

                    <div className="annonce-actions">
                      {mod === 'en_attente' && (
                        <>
                          <button
                            className="btn-validate-immo"
                            onClick={() => handleModerate(b.id, 'approuve')}
                          >
                            APPROUVER
                          </button>
                          <button
                            className="btn-icon-sm danger"
                            onClick={() => handleModerate(b.id, 'rejete')}
                            title="Rejeter"
                          >
                            ✗
                          </button>
                        </>
                      )}
                      {mod === 'approuve' && (
                        <button
                          className="btn-icon-sm"
                          onClick={() => handleModerate(b.id, 'rejete')}
                          title="Révoquer"
                          style={{ fontSize: 11, padding: '4px 10px', width: 'auto' }}
                        >
                          Révoquer
                        </button>
                      )}
                      {mod === 'rejete' && (
                        <button
                          className="btn-validate-immo"
                          onClick={() => handleModerate(b.id, 'approuve')}
                        >
                          RE-APPROUVER
                        </button>
                      )}
                      <button
                        className="btn-icon-sm danger"
                        onClick={() => handleDelete(b.id)}
                        title="Supprimer définitivement"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        <div className="annonce-pagination-row">
          <span>
            {total === 0 ? '0 résultat' : `Affichage de ${(page - 1) * LIMIT + 1}–${Math.min(page * LIMIT, total)} sur ${total}`}
          </span>
          <div className="immo-pagination">
            <button className="page-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeftIcon />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                className={`page-btn ${page === p ? 'active' : ''}`}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            ))}
            <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              <ChevronRightIcon />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
