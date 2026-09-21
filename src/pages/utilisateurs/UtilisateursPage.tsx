import { useState, useEffect, useCallback } from 'react';
import { SearchIcon, TrashIcon, ChevronLeftIcon, ChevronRightIcon } from '../../components/Icons';
import { getAdminUser } from '../../api/getAdminUser';
import { patchAdminUser } from '../../api/patchAdminUser';
import { deleteAdminUser } from '../../api/deleteAdminUser';

const TABS = [
  { key: '',             label: 'Tous'          },
  { key: 'prospect',     label: 'Prospects'     },
  { key: 'proprietaire', label: 'Propriétaires' },
  { key: 'demarcheur',   label: 'Démarcheurs'   },
  { key: 'locataire',    label: 'Locataires'    },
];

const ROLE_CONFIG: any = {
  prospect:     { label: 'Prospect',     color: '#2563EB', bg: '#EFF6FF' },
  proprietaire: { label: 'Propriétaire', color: '#16A34A', bg: '#F0FDF4' },
  demarcheur:   { label: 'Démarcheur',   color: '#D97706', bg: '#FFFBEB' },
  locataire:    { label: 'Locataire',    color: '#7C3AED', bg: '#F5F3FF' },
};

const AVATAR_COLORS = ['#2563EB', '#7C3AED', '#DB2777', '#D97706', '#16A34A', '#0891B2'];

function initials(u: any) {
  return `${u.prenom?.[0] ?? ''}${u.nom?.[0] ?? ''}`.toUpperCase();
}
function avatarColor(id: number) {
  return AVATAR_COLORS[Math.abs(id) % AVATAR_COLORS.length];
}
function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

const LIMIT = 12;

export default function UtilisateursPage() {
  const [activeTab, setActiveTab]         = useState('');
  const [users, setUsers]                 = useState([] as any[]);
  const [total, setTotal]                 = useState(0);
  const [page, setPage]                   = useState(1);
  const [search, setSearch]               = useState('');
  const [loading, setLoading]             = useState(false);
  const [loadError, setLoadError]         = useState(false);
  const [togglingId, setTogglingId]       = useState(null as any);
  const [deletingId, setDeletingId]       = useState(null as any);
  const [confirmId, setConfirmId]         = useState(null as any);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const res = await getAdminUser.list({
        page,
        limit:  LIMIT,
        role:   activeTab || undefined,
        search: search || undefined,
      });
      setUsers(res.data ?? []);
      setTotal(res.total ?? 0);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [page, activeTab, search]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / LIMIT);

  async function toggleActif(u: any) {
    setTogglingId(u.id);
    try {
      await patchAdminUser.update(u.id, { actif: !u.actif });
      await load();
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(id: number) {
    setDeletingId(id);
    try {
      await deleteAdminUser.byId(id);
      setConfirmId(null);
      await load();
    } finally {
      setDeletingId(null);
    }
  }

  function handleTabChange(key: string) {
    setActiveTab(key);
    setPage(1);
  }

  function handleSearch(e: any) {
    setSearch(e.target.value);
    setPage(1);
  }

  return (
    <>
      <div className="immo-topbar">
        <div className="immo-topbar-title">
          <h1>Gestion des Utilisateurs</h1>
          <p>{total} utilisateur{total !== 1 ? 's' : ''} au total</p>
        </div>
        <div className="immo-spacer" />
        <div className="immo-search-wrap">
          <SearchIcon />
          <input
            placeholder="Rechercher par nom, email…"
            value={search}
            onChange={handleSearch}
          />
        </div>
      </div>

      <div className="immo-page">

        {loadError && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 16px', fontSize: 13, color: '#DC2626', fontWeight: 500 }}>
            Erreur lors du chargement des utilisateurs.{' '}
            <button onClick={load} style={{ background: 'none', border: 'none', color: '#DC2626', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
              Réessayer
            </button>
          </div>
        )}

        {/* ── Onglets ── */}
        <div className="ut-tabs">
          {TABS.map(t => (
            <button
              key={t.key}
              className={`ut-tab${activeTab === t.key ? ' active' : ''}`}
              onClick={() => handleTabChange(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Vue tableau (≥ 768px) ── */}
        <div className="ut-table-wrap ut-desktop-only">
          <table className="ut-table">
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Rôle</th>
                <th>Téléphone</th>
                <th>Statut</th>
                <th>Inscription</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="ut-state-cell">Chargement…</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="ut-state-cell">Aucun utilisateur trouvé.</td></tr>
              ) : users.map((u: any) => {
                const rc = ROLE_CONFIG[u.role];
                const isToggling = togglingId === u.id;
                const isDeleting = deletingId === u.id;
                const isConfirm  = confirmId  === u.id;
                return (
                  <tr key={u.id} className="ut-row">
                    <td>
                      <div className="ut-user-cell">
                        <div className="ut-avatar" style={{ background: avatarColor(u.id) }}>{initials(u)}</div>
                        <div className="ut-user-info">
                          <div className="ut-user-name">{u.prenom} {u.nom}</div>
                          <div className="ut-user-email">{u.email ?? '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="ut-role-badge" style={{ color: rc?.color ?? '#64748B', background: rc?.bg ?? '#F1F5F9' }}>
                        {rc?.label ?? u.role}
                      </span>
                    </td>
                    <td className="ut-phone">{u.telephone ?? '—'}</td>
                    <td>
                      <button className={`ut-status-btn${u.actif ? ' actif' : ' bloque'}`}
                        onClick={() => toggleActif(u)} disabled={isToggling} title="Cliquer pour basculer">
                        <span className="ut-status-dot" />
                        {isToggling ? '…' : u.actif ? 'Actif' : 'Bloqué'}
                      </button>
                    </td>
                    <td className="ut-date">{formatDate(u.created_at)}</td>
                    <td>
                      <div className="ut-actions">
                        {isConfirm ? (
                          <>
                            <button className="ut-action-btn ut-action-btn--confirm" onClick={() => handleDelete(u.id)} disabled={isDeleting}>
                              {isDeleting ? '…' : 'Confirmer'}
                            </button>
                            <button className="ut-action-btn ut-action-btn--cancel" onClick={() => setConfirmId(null)}>Annuler</button>
                          </>
                        ) : (
                          <button className="ut-action-btn ut-action-btn--delete" onClick={() => setConfirmId(u.id)} title="Supprimer">
                            <TrashIcon size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Vue cartes (< 768px) ── */}
        <div className="ut-card-list ut-mobile-only">
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--c-muted)' }}>Chargement…</div>
          ) : users.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--c-muted)', fontSize: 13 }}>Aucun utilisateur trouvé.</div>
          ) : users.map((u: any) => {
            const rc = ROLE_CONFIG[u.role];
            const isToggling = togglingId === u.id;
            const isDeleting = deletingId === u.id;
            const isConfirm  = confirmId  === u.id;
            return (
              <div key={u.id} className="ut-card">
                {/* En-tête de la carte */}
                <div className="ut-card-header">
                  <div className="ut-avatar" style={{ background: avatarColor(u.id), width: 40, height: 40, fontSize: '0.875rem' }}>
                    {initials(u)}
                  </div>
                  <div className="ut-card-info">
                    <div className="ut-user-name">{u.prenom} {u.nom}</div>
                    <div className="ut-user-email">{u.email ?? '—'}</div>
                    {u.telephone && <div className="ut-card-phone">{u.telephone}</div>}
                  </div>
                  <div className="ut-card-right">
                    <span className="ut-role-badge" style={{ color: rc?.color ?? '#64748B', background: rc?.bg ?? '#F1F5F9' }}>
                      {rc?.label ?? u.role}
                    </span>
                  </div>
                </div>
                {/* Pied de carte */}
                <div className="ut-card-footer">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button className={`ut-status-btn${u.actif ? ' actif' : ' bloque'}`}
                      onClick={() => toggleActif(u)} disabled={isToggling}>
                      <span className="ut-status-dot" />
                      {isToggling ? '…' : u.actif ? 'Actif' : 'Bloqué'}
                    </button>
                    <span style={{ fontSize: 11, color: 'var(--c-muted)' }}>{formatDate(u.created_at)}</span>
                  </div>
                  {isConfirm ? (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="ut-action-btn ut-action-btn--confirm" onClick={() => handleDelete(u.id)} disabled={isDeleting}>
                        {isDeleting ? '…' : 'Supprimer'}
                      </button>
                      <button className="ut-action-btn ut-action-btn--cancel" onClick={() => setConfirmId(null)}>✕</button>
                    </div>
                  ) : (
                    <button className="ut-action-btn ut-action-btn--delete" onClick={() => setConfirmId(u.id)} title="Supprimer">
                      <TrashIcon size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Pagination ── */}
        <div className="ut-footer">
          <span className="ut-count">
            {total === 0
              ? 'Aucun résultat'
              : `${(page - 1) * LIMIT + 1}–${Math.min(page * LIMIT, total)} sur ${total} utilisateurs`}
          </span>
          <div className="immo-pagination">
            <button className="page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeftIcon />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                className={`page-btn${page === p ? ' active' : ''}`}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            ))}
            <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              <ChevronRightIcon />
            </button>
          </div>
        </div>

      </div>

      {/* ── Backdrop confirmation suppression ── */}
      {confirmId !== null && (
        <div className="immo-modal-backdrop" onClick={() => setConfirmId(null)}>
          <div className="ut-confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="ut-confirm-icon">🗑️</div>
            <div className="ut-confirm-title">Supprimer l'utilisateur ?</div>
            <div className="ut-confirm-sub">Cette action est irréversible. Toutes les données associées seront perdues.</div>
            <div className="ut-confirm-actions">
              <button className="ut-action-btn ut-action-btn--cancel" onClick={() => setConfirmId(null)}>
                Annuler
              </button>
              <button
                className="ut-action-btn ut-action-btn--confirm"
                onClick={() => handleDelete(confirmId)}
                disabled={deletingId !== null}
              >
                {deletingId !== null ? 'Suppression…' : 'Supprimer définitivement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
