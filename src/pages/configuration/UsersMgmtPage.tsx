import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../api/admin.api';
import { SearchIcon, TrashIcon } from '../../components/Icons';
import type { User, UserRole } from '../../types';

const AVATAR_COLORS = ['#2563EB', '#7C3AED', '#DB2777', '#D97706', '#16A34A'];
function getColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffff;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

const ROLE_LABELS: Record<UserRole, string> = {
  prospect:    'Prospect',
  locataire:   'Locataire',
  proprietaire: 'Propriétaire',
  demarcheur:  'Démarcheur',
  detenteur:   'Propriétaire (dépr.)',   // rétrocompat
  admin:       'Administrateur',
  super_admin: 'Super Admin',
};

// ── Props ────────────────────────────────────────────────────────────────────

export interface UsersMgmtConfig {
  title: string;
  subtitle: string;
  roleFilter?: string;
  emptyLabel: string;
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function UsersMgmtPage({ title, subtitle, roleFilter, emptyLabel }: UsersMgmtConfig) {
  const [users, setUsers]       = useState<User[]>([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [actifFilter, setActifFilter] = useState<string>('');
  const [page, setPage]         = useState(1);
  const [togglingId, setTogglingId]   = useState<number | null>(null);
  const [deletingId, setDeletingId]   = useState<number | null>(null);

  const limit = 10;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getUsers({
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

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [search, actifFilter, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  // Stats
  const actifs   = users.filter(u => u.actif).length;
  const inactifs = users.filter(u => !u.actif).length;

  const handleToggleActif = async (u: User) => {
    setTogglingId(u.id);
    try {
      const updated = await adminApi.updateUser(u.id, { actif: !u.actif });
      setUsers(prev => prev.map(x => x.id === u.id ? updated : x));
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Erreur');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (u: User) => {
    if (!confirm(`Supprimer définitivement ${u.prenom} ${u.nom} ?`)) return;
    setDeletingId(u.id);
    try {
      await adminApi.deleteUser(u.id);
      setUsers(prev => prev.filter(x => x.id !== u.id));
      setTotal(t => t - 1);
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Erreur');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      {/* Topbar */}
      <div className="immo-topbar">
        <div className="immo-topbar-title">
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </div>

      <div className="immo-page">
        {/* Stats */}
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

        {/* Toolbar */}
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

        {/* Table */}
        <div className="mgmt-table-wrap">
          {/* Header */}
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
            users.map(u => {
              const initials = `${u.nom[0] ?? ''}${u.prenom[0] ?? ''}`.toUpperCase();
              const color    = getColor(u.nom + u.prenom);
              return (
                <div className="mgmt-row" key={u.id}>
                  {/* User */}
                  <div className="mgmt-user-cell">
                    <div className="mgmt-avatar" style={{ background: color }}>{initials}</div>
                    <div>
                      <div className="mgmt-user-name">{u.prenom} {u.nom}</div>
                      <div className="mgmt-user-email">{u.email ?? '—'}</div>
                    </div>
                  </div>

                  {/* Contact */}
                  <div>
                    <div className="mgmt-contact">{u.telephone ?? '—'}</div>
                    <div className="mgmt-contact-sub">{ROLE_LABELS[u.role]}</div>
                  </div>

                  {/* Date */}
                  <div className="mgmt-date">{formatDate(u.created_at)}</div>

                  {/* Status toggle */}
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

                  {/* Actions */}
                  <div className="mgmt-actions">
                    <button
                      className="btn-icon-sm danger"
                      onClick={() => handleDelete(u)}
                      disabled={deletingId === u.id}
                      title="Supprimer cet utilisateur"
                    >
                      {deletingId === u.id ? (
                        <span style={{ width: 12, height: 12, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'block' }} />
                      ) : (
                        <TrashIcon size={14} />
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
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
