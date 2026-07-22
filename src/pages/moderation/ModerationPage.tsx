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

// ── Modal d'action (approbation ou refus) ───────────────────────────────────

type ActionType = 'approuve' | 'rejete';

function ModerationModal({
  bien,
  type,
  onClose,
  onDone,
}: {
  bien: any;
  type: ActionType;
  onClose: () => void;
  onDone: () => void;
}) {
  const [fraisVisite, setFraisVisite] = useState('');
  const [motif, setMotif]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  const isApprove = type === 'approuve';

  const canSubmit = isApprove
    ? fraisVisite.trim() !== '' && Number(fraisVisite) >= 0
    : motif.trim().length >= 5;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError('');
    try {
      if (isApprove) {
        await patchAdminBien.moderate(bien.id, {
          statut_moderation: 'approuve',
          frais_visite: Number(fraisVisite),
        });
      } else {
        await patchAdminBien.moderate(bien.id, {
          statut_moderation: 'rejete',
          motif_refus: motif.trim(),
        });
      }
      onDone();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Une erreur est survenue.');
      setLoading(false);
    }
  }

  return (
    <div className="immo-modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="immo-modal">
        {/* Contexte du bien */}
        <div style={{
          background: isApprove ? 'var(--c-green-bg, #F0FDF4)' : 'var(--c-red-bg)',
          border: `1px solid ${isApprove ? 'var(--c-green, #16A34A)' : 'var(--c-red)'}`,
          borderRadius: 10,
          padding: '10px 14px',
          marginBottom: 18,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <span style={{ fontSize: 20 }}>{isApprove ? '✅' : '❌'}</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: isApprove ? 'var(--c-green, #16A34A)' : 'var(--c-red)' }}>
              {isApprove ? 'Approuver cette annonce' : 'Rejeter cette annonce'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--c-muted)', marginTop: 2 }}>
              {TYPE_LABELS[bien.type] ?? bien.type} — {Number(bien.prix).toLocaleString('fr-FR')} FCFA
              {bien.transaction === 'location' ? '/mois' : ''}
              {bien.localisation?.quartier ? ` · ${bien.localisation.quartier}` : ''}
              {bien.localisation?.ville ? `, ${bien.localisation.ville}` : ''}
            </div>
          </div>
        </div>

        <div className="immo-modal-title">
          {isApprove ? 'Définir les frais de visite' : 'Motif de refus'}
        </div>
        <div className="immo-modal-sub">
          {isApprove
            ? 'Entrez le montant des frais de visite (FCFA) que le client devra payer pour visiter ce bien. Mettez 0 si la visite est gratuite.'
            : 'Expliquez pourquoi cette annonce est rejetée. Le propriétaire recevra ce motif.'}
        </div>

        {error && (
          <div style={{
            background: 'var(--c-red-bg)', color: 'var(--c-red)',
            border: '1px solid #FECACA', borderRadius: 8,
            padding: '9px 13px', fontSize: 12, fontWeight: 500, marginBottom: 14,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isApprove ? (
            <div className="immo-form-field">
              <label className="immo-form-label">Frais de visite (FCFA) *</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="immo-form-input"
                  type="number"
                  min={0}
                  step={500}
                  placeholder="ex : 2000"
                  value={fraisVisite}
                  onChange={e => setFraisVisite(e.target.value)}
                  required
                  autoFocus
                  style={{ paddingRight: 52 }}
                />
                <span style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  fontSize: 11, fontWeight: 600, color: 'var(--c-muted)',
                }}>FCFA</span>
              </div>
              {fraisVisite && Number(fraisVisite) === 0 && (
                <div style={{ fontSize: 11, color: 'var(--c-muted)', marginTop: 4 }}>
                  Visite gratuite — le client ne paiera rien.
                </div>
              )}
            </div>
          ) : (
            <div className="immo-form-field">
              <label className="immo-form-label">Motif de refus *</label>
              <textarea
                className="immo-form-input"
                rows={3}
                placeholder="Ex : Photos manquantes, description insuffisante, localisation imprécise…"
                value={motif}
                onChange={e => setMotif(e.target.value)}
                required
                autoFocus
                style={{ resize: 'vertical', minHeight: 80 }}
              />
            </div>
          )}

          <div className="immo-modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>
              Annuler
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={!canSubmit || loading}
              style={!isApprove ? { background: 'var(--c-red)', borderColor: 'var(--c-red)' } : undefined}
            >
              {loading ? (
                <>
                  <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
                  Envoi…
                </>
              ) : isApprove ? 'Approuver le bien' : 'Confirmer le refus'}
            </button>
          </div>
        </form>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

// ── Page principale ──────────────────────────────────────────────────────────

export default function ModerationPage() {
  const [biens, setBiens]               = useState([] as any[]);
  const [total, setTotal]               = useState(0);
  const [page, setPage]                 = useState(1);
  const [search, setSearch]             = useState('');
  const [loading, setLoading]           = useState(false);
  const [totalEnAttente, setTotalEnAttente] = useState(0);
  const [totalRejetes, setTotalRejetes]     = useState(0);

  // Modal state : { bien, type } ou null
  const [modal, setModal] = useState<{ bien: any; type: ActionType } | null>(null);

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

  const displayed = search
    ? biens.filter((b: any) =>
        b.localisation?.ville?.toLowerCase().includes(search.toLowerCase()) ||
        b.type.toLowerCase().includes(search.toLowerCase()),
      )
    : biens;

  return (
    <>
      {modal && (
        <ModerationModal
          bien={modal.bien}
          type={modal.type}
          onClose={() => setModal(null)}
          onDone={load}
        />
      )}

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
                  <button
                    className="btn-validate-circle"
                    onClick={() => setModal({ bien: b, type: 'approuve' })}
                    title="Approuver"
                  >
                    <CheckIcon size={15} />
                  </button>
                  <button
                    className="btn-reject-circle"
                    onClick={() => setModal({ bien: b, type: 'rejete' })}
                    title="Rejeter"
                  >
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
