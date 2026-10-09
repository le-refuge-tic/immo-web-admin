import { useState, useEffect, useCallback, useRef } from 'react';
import { SearchIcon, ChevronLeftIcon, ChevronRightIcon } from '../../components/Icons';
import { blockInvalidNumberKey } from '../../utils/inputNumbers';
import { getAdminBien } from '../../api/getAdminBien';
import { patchAdminBien } from '../../api/patchAdminBien';
import { refreshSidebarBadges } from '../../hooks/useSidebarBadges';
import ModerationRisqueLabel from './ModerationRisqueLabel';
import ModerationDetail from './ModerationDetail';
import { MOTIFS_REFUS, TYPE_LABELS, formatPrix, auteurNom } from './moderationChecks';
import { apiMessage } from '../../utils/apiMessage';

const LIMIT = 10;
const SEARCH_DEBOUNCE_MS = 350;

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
  // Pré-rempli avec les frais déjà saisis par l'auteur, s'il y en a.
  const [fraisVisite, setFraisVisite] = useState(bien.frais_visite != null ? String(bien.frais_visite) : '');
  const [motif, setMotif]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  const isApprove = type === 'approuve';

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

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
      const msg = apiMessage(err);
      setError(msg || 'La décision n’a pas pu être enregistrée. Vérifiez votre connexion et réessayez.');
      setLoading(false);
    }
  }

  return (
    <div className="immo-modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()} role="dialog" aria-modal="true" aria-label={isApprove ? 'Approuver l\'annonce' : 'Rejeter l\'annonce'}>
      <div className="immo-modal">
        {/* Contexte du bien */}
        <div style={{
          background: isApprove ? 'var(--c-green-bg, var(--t-green-bg))' : 'var(--c-red-bg)',
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
            <div style={{ fontSize: 13, fontWeight: 700, color: isApprove ? 'var(--c-green, var(--s-green))' : 'var(--c-red)' }}>
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
            border: '1px solid var(--t-red-bd)', borderRadius: 8,
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
                  max={999999}
                  step={500}
                  placeholder="ex : 2000"
                  value={fraisVisite}
                  onChange={e => setFraisVisite(e.target.value)}
                  onKeyDown={e => blockInvalidNumberKey(e, true)}
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
              <div className="mod-motifs" role="group" aria-label="Motifs fréquents">
                {MOTIFS_REFUS.map(m => (
                  <button key={m} type="button" className="mod-motif-chip" onClick={() => setMotif(prev => (prev.trim() ? `${prev.trim()} ${m}` : m))}>
                    {m}
                  </button>
                ))}
              </div>
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

type Stats = { en_attente: number; rejete: number; traitees_7j: number };

export default function ModerationPage() {
  const [biens, setBiens]       = useState<any[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState('');
  const [query, setQuery]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [loadError, setLoadError] = useState('');
  const [stats, setStats]       = useState<Stats | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  // Téléphone : la file et le détail s'affichent l'un après l'autre.
  const [showDetailMobile, setShowDetailMobile] = useState(false);
  const [modal, setModal] = useState<{ bien: any; type: ActionType } | null>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Recherche envoyée à l'API (et non filtrée sur la seule page affichée).
  useEffect(() => {
    const t = setTimeout(() => { setQuery(search.trim()); setPage(1); }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [res, st] = await Promise.all([
        getAdminBien.list({ statut_moderation: 'en_attente', limit: LIMIT, page, ...(query ? { search: query } : {}) }),
        getAdminBien.moderationStats().catch(() => null),
      ]);
      const list: any[] = res.data ?? [];
      setBiens(list);
      setTotal(res.total ?? 0);
      if (st) setStats(st);
      setSelectedId(prev => (list.some(b => b.id === prev) ? prev : (list[0]?.id ?? null)));
    } catch {
      setLoadError('Impossible de charger la file de modération. Vérifiez votre connexion puis réessayez.');
    } finally {
      setLoading(false);
    }
  }, [page, query]);

  useEffect(() => {
    // Chargement différé : les setState arrivent hors du rendu de l'effet.
    void Promise.resolve().then(load);
  }, [load]);

  const selected = biens.find(b => b.id === selectedId) ?? null;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));
  const aRisque = biens.filter(b => !b.photos?.length || !b.description).length;

  const onDecision = useCallback(() => {
    refreshSidebarBadges();
    void load();
  }, [load]);

  // Raccourcis clavier : ↑/↓ pour naviguer, A pour approuver, R pour rejeter.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (modal || e.ctrlKey || e.metaKey || e.altKey) return;
      const el = e.target as HTMLElement;
      if (el.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        if (!biens.length) return;
        e.preventDefault();
        const idx = biens.findIndex(b => b.id === selectedId);
        const next = biens[Math.min(biens.length - 1, Math.max(0, idx + (e.key === 'ArrowDown' ? 1 : -1)))];
        setSelectedId(next.id);
        listRef.current?.querySelector<HTMLElement>(`[data-id="${next.id}"]`)?.scrollIntoView({ block: 'nearest' });
      } else if (selected && e.key.toLowerCase() === 'a') {
        setModal({ bien: selected, type: 'approuve' });
      } else if (selected && e.key.toLowerCase() === 'r') {
        setModal({ bien: selected, type: 'rejete' });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [biens, selectedId, selected, modal]);

  const select = (id: number) => { setSelectedId(id); setShowDetailMobile(true); };

  return (
    <>
      {modal && (
        <ModerationModal
          bien={modal.bien}
          type={modal.type}
          onClose={() => setModal(null)}
          onDone={onDecision}
        />
      )}

      <div className="immo-topbar">
        <div className="immo-topbar-title">
          <h1>Modération</h1>
          <p>Annonces en attente de validation</p>
        </div>
        <div className="immo-spacer" />
        <div className="mod-search-wrap">
          <SearchIcon />
          <input
            placeholder="Ville, quartier, auteur ou n° d’annonce"
            aria-label="Rechercher une annonce en attente"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="immo-page">
        <div className="mod-kpis">
          <div className="mod-kpi"><b>{stats?.en_attente ?? total}</b><span>en attente</span></div>
          <div className="mod-kpi"><b>{aRisque}</b><span>sans photo ou description (cette page)</span></div>
          <div className="mod-kpi"><b>{stats?.traitees_7j ?? '—'}</b><span>traitées sur 7 jours</span></div>
          <div className="mod-kpi"><b>{stats?.rejete ?? '—'}</b><span>rejetées au total</span></div>
          <div className="mod-shortcuts" aria-hidden="true"><kbd>↑</kbd><kbd>↓</kbd> naviguer · <kbd>A</kbd> approuver · <kbd>R</kbd> rejeter</div>
        </div>

        {loadError ? (
          <div className="immo-card mod-empty" role="alert">
            <span>{loadError}</span>
            <button type="button" className="btn-cancel" onClick={() => void load()}>Réessayer</button>
          </div>
        ) : (
          <div className={`mod-split${showDetailMobile ? ' show-detail' : ''}`}>
            <div className="mod-queue-col">
              {loading && biens.length === 0 ? (
                <div className="immo-card mod-empty">Chargement…</div>
              ) : biens.length === 0 ? (
                <div className="immo-card mod-empty">
                  {query ? `Aucune annonce en attente ne correspond à « ${query} ».` : 'Aucune annonce en attente. Tout est à jour.'}
                </div>
              ) : (
                <ul className="mod-queue" ref={listRef} aria-label="Annonces en attente" aria-busy={loading}>
                  {biens.map(b => {
                    const cover = b.photos?.find((p: any) => p.is_cover)?.url ?? b.photos?.[0]?.url;
                    const isSel = b.id === selectedId;
                    return (
                      <li key={b.id}>
                        <button
                          type="button"
                          data-id={b.id}
                          className={`mod-q${isSel ? ' is-selected' : ''}`}
                          aria-current={isSel ? 'true' : undefined}
                          onClick={() => select(b.id)}
                        >
                          {cover
                            ? <img className="mod-q-thumb" src={cover} alt="" loading="lazy" />
                            : <span className="mod-q-thumb mod-q-thumb--empty" aria-hidden="true" />}
                          <span className="mod-q-body">
                            <span className="mod-q-title">{TYPE_LABELS[b.type] ?? b.type} · {b.localisation?.quartier || b.localisation?.ville || '—'}</span>
                            <span className="mod-sub">{formatPrix(b)} · {auteurNom(b)}</span>
                          </span>
                          <span className="mod-q-risk"><ModerationRisqueLabel b={b} /></span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}

              <div className="mod-pager">
                <span>{total === 0 ? '0 résultat' : `${(page - 1) * LIMIT + 1}–${Math.min(page * LIMIT, total)} sur ${total}`}</span>
                <div className="immo-pagination">
                  <button className="page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)} aria-label="Page précédente"><ChevronLeftIcon /></button>
                  <span className="mod-page-num">{page} / {totalPages}</span>
                  <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} aria-label="Page suivante"><ChevronRightIcon /></button>
                </div>
              </div>
            </div>

            <div className="mod-detail-col">
              {selected ? (
                <ModerationDetail
                  key={selected.id}
                  bien={selected}
                  onApprove={() => setModal({ bien: selected, type: 'approuve' })}
                  onReject={() => setModal({ bien: selected, type: 'rejete' })}
                  onBack={() => setShowDetailMobile(false)}
                />
              ) : (
                <div className="immo-card mod-empty">Sélectionnez une annonce pour l’examiner.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
