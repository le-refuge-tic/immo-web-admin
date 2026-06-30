import { useState, useEffect, useCallback } from 'react';
import {
  SearchIcon, CheckIcon, XIcon, HomeIcon, AlertIcon,
  ChevronLeftIcon, ChevronRightIcon,
} from '../../components/Icons';
import { getAdminBien } from '../../api/getAdminBien';
import { patchAdminBien } from '../../api/patchAdminBien';
import ModerationRisqueLabel from './ModerationRisqueLabel';

const LIMIT = 10;

const TYPE_LABELS: any = {
  maison:        'Maison',
  appart_vide:   'Appartement vide',
  appart_meuble: 'Appartement meublé',
  guesthouse:    'Guesthouse',
  terrain:       'Terrain',
};

export default function ModerationPage() {
  const [biens, setBiens]               = useState([] as any[]);
  const [total, setTotal]               = useState(0);
  const [page, setPage]                 = useState(1);
  const [search, setSearch]             = useState('');
  const [loading, setLoading]           = useState(false);
  const [totalEnAttente, setTotalEnAttente] = useState(0);
  const [totalRejetes, setTotalRejetes]     = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [enAttente, rejetes] = await Promise.all([
        getAdminBien.list({ statut_moderation: 'en_attente', limit: LIMIT, page }),
        getAdminBien.list({ statut_moderation: 'rejete',     limit: 1,     page: 1 }),
      ]);
      setBiens(enAttente.data);
      setTotal(enAttente.total);
      setTotalEnAttente(enAttente.total);
      setTotalRejetes(rejetes.total);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / LIMIT);

  async function approve(id: number) {
    await patchAdminBien.moderate(id, { statut_moderation: 'approuve' });
    load();
  }

  async function reject(id: number) {
    const motif = window.prompt('Motif de refus (obligatoire) :');
    if (!motif) return;
    await patchAdminBien.moderate(id, { statut_moderation: 'rejete', motif_refus: motif });
    load();
  }

  const displayed = search
    ? biens.filter((b: any) =>
        b.localisation?.ville?.toLowerCase().includes(search.toLowerCase()) ||
        b.type.toLowerCase().includes(search.toLowerCase()),
      )
    : biens;

  return (
    <>
      <div className="immo-topbar">
        <div className="immo-topbar-title">
          <h1>File de Modération</h1>
          <p>Annonces en attente de validation</p>
        </div>
        <div className="immo-spacer" />
        <div className="mod-search-wrap">
          <SearchIcon />
          <input
            placeholder="Filtrer par ville, type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="immo-page">
        <div className="mod-stat-cards">
          <div className="mod-stat-card">
            <div>
              <div className="mod-stat-label">En attente</div>
              <div className="mod-stat-value">{totalEnAttente}</div>
            </div>
            <div className="mod-stat-icon"><HomeIcon size={24} /></div>
          </div>
          <div className="mod-stat-card urgent">
            <div>
              <div className="mod-stat-label">Rejetées</div>
              <div className="mod-stat-value">{totalRejetes}</div>
            </div>
            <div className="mod-stat-icon"><AlertIcon size={24} /></div>
          </div>
        </div>

        <div className="immo-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="mod-table-header">
            <span className="mod-table-col">Bien</span>
            <span className="mod-table-col">Localisation</span>
            <span className="mod-table-col">Auteur</span>
            <span className="mod-table-col">Niveau risque</span>
            <span className="mod-table-col">Actions</span>
          </div>

          {loading ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--c-muted)' }}>Chargement…</div>
          ) : displayed.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--c-muted)' }}>Aucune annonce en attente de modération.</div>
          ) : (
            displayed.map((b: any) => (
              <div className="mod-row" key={b.id}>
                <div className="mod-detail-cell">
                  <div className="mod-photo"><HomeIcon size={20} /></div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                      <span className="mod-type-tag">{TYPE_LABELS[b.type] ?? b.type}</span>
                      <span className="mod-type-name">
                        {Number(b.prix).toLocaleString('fr-FR')} F
                        {b.transaction === 'location' ? '/mois' : ''}
                      </span>
                    </div>
                    {b.description && (
                      <div className="mod-sub" style={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {b.description}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{b.localisation?.ville ?? '—'}</div>
                  <div style={{ fontSize: 11, color: 'var(--c-muted)' }}>{b.localisation?.quartier ?? ''}</div>
                </div>

                <div className="mod-agent-cell">
                  <div className="agent-av" style={{ background: '#94A3B8' }}>
                    {b.user ? `${b.user.nom[0]}${b.user.prenom[0]}`.toUpperCase() : `#${b.user_id}`}
                  </div>
                  <div>
                    <div className="agent-name">
                      {b.user ? `${b.user.nom} ${b.user.prenom}` : `Utilisateur #${b.user_id}`}
                    </div>
                    <div className="agent-status">
                      {b.user?.role === 'proprietaire' || b.user?.role === 'detenteur'
                        ? 'Propriétaire / Bailleur'
                        : b.user?.role === 'demarcheur' ? 'Démarcheur' : 'Particulier'}
                    </div>
                  </div>
                </div>

                <div className="risk-cell">
                  <ModerationRisqueLabel b={b} />
                </div>

                <div className="mod-actions-cell">
                  <button className="btn-validate-circle" onClick={() => approve(b.id)} title="Approuver">
                    <CheckIcon size={15} />
                  </button>
                  <button className="btn-reject-circle" onClick={() => reject(b.id)} title="Rejeter">
                    <XIcon size={14} />
                  </button>
                </div>
              </div>
            ))
          )}

          <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--c-border)' }}>
            <span style={{ fontSize: 12, color: 'var(--c-muted)' }}>
              {total === 0 ? '0 résultat' : `${(page - 1) * LIMIT + 1}–${Math.min(page * LIMIT, total)} sur ${total}`}
            </span>
            <div className="immo-pagination">
              <button className="page-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeftIcon /></button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                <button key={p} className={`page-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
              ))}
              <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}><ChevronRightIcon /></button>
            </div>
          </div>
        </div>

        <div className="mod-footer-row">
          <div className="regle-or-card">
            <div className="regle-or-title">
              <div className="regle-or-dot" />
              Règle d'or Modération
            </div>
            <p className="regle-or-text">
              "Toute annonce sans photos ou sans description doit être examinée avec attention
              avant validation. Un bien sans preuve visuelle représente un risque élevé."
            </p>
          </div>
          <div className="indices-card">
            <div className="indices-title">Critères de validation</div>
            {['Photos présentes (au moins 1)', 'Description renseignée', 'Localisation précise', 'Prix cohérent avec le marché'].map((label) => (
              <div className="indice-row" key={label}>
                <span>{label}</span>
                <span className="badge-actif">VÉRIFIER</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
