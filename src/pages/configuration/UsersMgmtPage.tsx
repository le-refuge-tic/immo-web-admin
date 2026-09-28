import { useState, useEffect, useCallback } from 'react';
import { getAdminUser } from '../../api/getAdminUser';
import { patchAdminUser } from '../../api/patchAdminUser';
import { deleteAdminUser } from '../../api/deleteAdminUser';
import { SearchIcon, TrashIcon } from '../../components/Icons';

const AVATAR_COLORS = ['#2563EB', '#7C3AED', '#DB2777', '#D97706', '#16A34A'];

function getColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffff;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

const ROLE_LABELS: any = {
  prospect:     'Prospect',
  locataire:    'Locataire',
  proprietaire: 'Propriétaire',
  demarcheur:   'Démarcheur',
  detenteur:    'Propriétaire (dépr.)',
  admin:        'Administrateur',
  super_admin:  'Super Admin',
};

export default function UsersMgmtPage({ title, subtitle, roleFilter, emptyLabel }: {
  title: string;
  subtitle: string;
  roleFilter?: string;
  emptyLabel: string;
}) {
  const [users, setUsers]           = useState([] as any[]);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [actifFilter, setActifFilter] = useState('');
  const [page, setPage]             = useState(1);
  const [togglingId, setTogglingId]     = useState(null as any);
  const [deletingId, setDeletingId]     = useState(null as any);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null as any);
  const [toggleError, setToggleError]   = useState('');
  const [deleteError, setDeleteError]   = useState('');

  const limit = 10;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminUser.list({
        page,
        limit,
        role:   roleFilter,
        actif:  actifFilter || undefined,
        search: search || undefined,
      });
      setUsers(res.data);
      setTotal(res.total);
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, [page, roleFilter, actifFilter, search]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, actifFilter, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const actifs     = users.filter((u: any) => u.actif).length;
  const inactifs   = users.filter((u: any) => !u.actif).length;

  const handleToggleActif = async (u: any) => {
    setToggleError('');
    setTogglingId(u.id);
    try {
      const updated = await patchAdminUser.update(u.id, { actif: !u.actif });
      setUsers(prev => prev.map((x: any) => x.id === u.id ? updated : x));
    } catch (err: any) {
      setToggleError(err?.response?.data?.message ?? 'Erreur');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (u: any) => {
    setDeleteError('');
    setDeletingId(u.id);
    try {
      await deleteAdminUser.byId(u.id);
      setUsers(prev => prev.filter((x: any) => x.id !== u.id));
      setTotal(t => t - 1);
      setConfirmDeleteId(null);
    } catch (err: any) {
      setDeleteError(err?.response?.data?.message ?? 'Erreur');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <div className="immo-topbar">
        <div className="immo-topbar-title">
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </div>

      <div className="immo-page">
        <div className="mgmt-stats">
          <div className="mgmt-stat-card">
            <div className="mgmt-stat-icon" style={{ background: '#EFF6FF' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
              </svg>
            </div>
            <div>
              <div className="mgmt-stat-label">Total</div>
              <div className="mgmt-stat-value">{total}</div>
            </div>
          </div>
          <div className="mgmt-stat-card">
            <div className="mgmt-stat-icon" style={{ background: '#F0FDF4' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div>
              <div className="mgmt-stat-label">Actifs</div>
              <div className="mgmt-stat-value">{actifs}</div>
            </div>
          </div>
          <div className="mgmt-stat-card">
            <div className="mgmt-stat-icon" style={{ background: '#FEF2F2' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </div>
            <div>
              <div className="mgmt-stat-label">Inactifs</div>
              <div className="mgmt-stat-value">{inactifs}</div>
            </div>
          </div>
        </div>

        <div className="mgmt-toolbar">
          <div style={{ position: 'relative', flex: 1, maxWidth: 340 }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--c-muted)', pointerEvents: 'none' }}>
              <SearchIcon size={14} />
            </span>
            <input
              className="mgmt-filter-select"
              style={{ paddingLeft: 34, width: '100%', boxSizing: 'border-box' }}
              placeholder="Rechercher par nom, prénom, email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="mgmt-filter-select" value={actifFilter} onChange={e => setActifFilter(e.target.value)}>
            <option value="">Tous les statuts</option>
            <option value="true">Actifs</option>
            <option value="false">Inactifs</option>
          </select>
        </div>

        {toggleError && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 8, background: '#FEF2F2', border: '1px solid #FECACA', marginBottom: 12, fontSize: 13, color: '#DC2626' }}>
            {toggleError}
            <button onClick={() => setToggleError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', fontSize: 16, lineHeight: 1, padding: '0 4px' }}>✕</button>
          </div>
        )}

        <div className="mgmt-table-wrap">
          <div className="mgmt-table-head">
            <div className="mgmt-table-col">Utilisateur</div>
            <div className="mgmt-table-col">Contact</div>
            <div className="mgmt-table-col">Inscrit le</div>
            <div className="mgmt-table-col">Statut</div>
            <div className="mgmt-table-col">Actions</div>
          </div>

          {loading ? (
            <div className="mgmt-empty">
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                <span style={{ width: 32, height: 32, border: '3px solid var(--c-border)', borderTopColor: 'var(--c-blue)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'block' }} />
              </div>
            </div>
          ) : users.length === 0 ? (
            <div className="mgmt-empty">
              <div className="mgmt-empty-icon">👤</div>
              <div style={{ fontWeight: 600, color: 'var(--c-text)', marginBottom: 6 }}>{emptyLabel}</div>
              <div style={{ fontSize: 13 }}>Essayez de modifier vos filtres de recherche.</div>
            </div>
          ) : (
            users.map((u: any) => {
              const inits = `${u.nom[0] ?? ''}${u.prenom[0] ?? ''}`.toUpperCase();
              const color = getColor(u.nom + u.prenom);
              return (
                <div className="mgmt-row" key={u.id}>
                  <div className="mgmt-user-cell">
                    <div className="mgmt-avatar" style={{ background: color }}>{inits}</div>
                    <div>
                      <div className="mgmt-user-name">{u.prenom} {u.nom}</div>
                      <div className="mgmt-user-email">{u.email ?? '—'}</div>
                    </div>
                  </div>
                  <div>
                    <div className="mgmt-contact">{u.telephone ?? '—'}</div>
                    <div className="mgmt-contact-sub">{ROLE_LABELS[u.role]}</div>
                  </div>
                  <div className="mgmt-date">{formatDate(u.created_at)}</div>
                  <div>
                    <button
                      className={`toggle-active-btn ${u.actif ? 'actif' : 'inactif'}`}
                      onClick={() => handleToggleActif(u)}
                      disabled={togglingId === u.id}
                    >
                      {togglingId === u.id ? (
                        <span style={{ width: 10, height: 10, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'block' }} />
                      ) : (
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
                      )}
                      {u.actif ? 'Actif' : 'Inactif'}
                    </button>
                  </div>
                  <div className="mgmt-actions">
                    {confirmDeleteId === u.id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-end' }}>
                        {deleteError && <span style={{ fontSize: 10, color: '#DC2626', maxWidth: 120, textAlign: 'right' }}>{deleteError}</span>}
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn-icon-sm danger" onClick={() => handleDelete(u)} disabled={deletingId === u.id} style={{ padding: '2px 8px', fontSize: 11, fontWeight: 600, borderRadius: 5 }}>
                            {deletingId === u.id ? '…' : 'Supprimer'}
                          </button>
                          <button className="btn-icon-sm" onClick={() => { setConfirmDeleteId(null); setDeleteError(''); }} style={{ padding: '2px 7px', fontSize: 11, borderRadius: 5 }}>✕</button>
                        </div>
                      </div>
                    ) : (
                      <button
                        className="btn-icon-sm danger"
                        onClick={() => setConfirmDeleteId(u.id)}
                        title="Supprimer cet utilisateur"
                      >
                        <TrashIcon size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ fontSize: 12, color: 'var(--c-muted)' }}>
              {(page - 1) * limit + 1}–{Math.min(page * limit, total)} sur {total}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{
                    width: 32, height: 32, borderRadius: 8, border: '1.5px solid',
                    borderColor: p === page ? 'var(--c-blue)' : 'var(--c-border)',
                    background: p === page ? 'var(--c-blue)' : '#fff',
                    color: p === page ? '#fff' : 'var(--c-text)',
                    fontWeight: p === page ? 700 : 500,
                    fontSize: 12, cursor: 'pointer',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
