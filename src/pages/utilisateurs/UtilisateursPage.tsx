import { useState, useEffect, useCallback } from 'react';
import {
  SearchIcon, TrashIcon,
} from '../../components/Icons';
import { adminApi } from '../../api/admin.api';
import type { User } from '../../types';

type TabKey = 'tous' | 'detenteur' | 'client';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'tous',     label: 'Tous' },
  { key: 'detenteur', label: 'Propriétaires / Bailleurs' },
  { key: 'client',   label: 'Clients' },
];

const ROLE_LABELS: Record<string, string> = {
  client:      'Client',
  detenteur:   'Propriétaire / Bailleur',
  super_admin: 'Super Admin',
};

const AVATAR_COLORS = [
  '#2563EB', '#F97316', '#6366F1', '#16A34A', '#DC2626', '#7C3AED',
];

function initials(u: User) {
  return `${u.nom[0] ?? ''}${u.prenom[0] ?? ''}`.toUpperCase();
}

function avatarColor(id: number) {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

const LIMIT = 10;

export default function UtilisateursPage() {
  const [activeTab, setActiveTab]   = useState<TabKey>('tous');
  const [users, setUsers]           = useState<User[]>([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [search, setSearch]         = useState('');
  const [loading, setLoading]       = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getUsers({
        page,
        limit: LIMIT,
        role:  activeTab === 'tous' ? undefined : activeTab,
        search: search || undefined,
      });
      setUsers(res.data);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  }, [page, activeTab, search]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / LIMIT);

  async function toggleActif(u: User) {
    await adminApi.updateUser(u.id, { actif: !u.actif });
    load();
  }

  async function handleDelete(id: number) {
    await adminApi.deleteUser(id);
    setConfirmDelete(null);
    load();
  }

  function handleTabChange(t: TabKey) {
    setActiveTab(t);
    setPage(1);
  }

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value);
    setPage(1);
  }

  return (
    <>
      {/* ── Topbar ── */}
      <div className="immo-topbar">
        <div className="immo-topbar-title">
          <h1 style={{ color: 'var(--c-text)' }}>Gestion des Utilisateurs</h1>
          <p>{total} utilisateur{total > 1 ? 's' : ''} au total</p>
        </div>
        <div className="immo-spacer" />
      </div>

      {/* ── Content ── */}
      <div className="immo-page">
        {/* Tabs + search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div className="user-tabs">
            {TABS.map((t) => (
              <button
                key={t.key}
                className={`user-tab ${activeTab === t.key ? 'active' : 'inactive'}`}
                onClick={() => handleTabChange(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="immo-spacer" />
          <div className="immo-search-wrap">
            <SearchIcon />
            <input
              placeholder="Rechercher par nom, email..."
              value={search}
              onChange={handleSearch}
              style={{ width: 220 }}
            />
          </div>
        </div>

        {/* Table */}
        <div className="user-table-wrap">
          <div className="user-table-header">
            <span className="user-table-col">Utilisateur</span>
            <span className="user-table-col">Rôle</span>
            <span className="user-table-col">Contact</span>
            <span className="user-table-col">Statut</span>
            <span className="user-table-col">Inscription</span>
            <span className="user-table-col">Actions</span>
          </div>

          {loading ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--c-muted)' }}>
              Chargement…
            </div>
          ) : users.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--c-muted)' }}>
              Aucun utilisateur trouvé.
            </div>
          ) : (
            users.map((u) => (
              <div className="user-row" key={u.id}>
                {/* Avatar + nom */}
                <div className="user-cell">
                  <div className="user-av" style={{ background: avatarColor(u.id) }}>
                    {initials(u)}
                  </div>
                  <div>
                    <div className="user-name">{u.nom} {u.prenom}</div>
                    <div className="user-phone" style={{ fontSize: 11, color: 'var(--c-muted)' }}>
                      ID #{u.id}
                    </div>
                  </div>
                </div>

                {/* Rôle */}
                <div>
                  <span className="user-role">{ROLE_LABELS[u.role] ?? u.role}</span>
                </div>

                {/* Contact */}
                <div>
                  <div style={{ fontSize: 12, color: 'var(--c-text)' }}>{u.email ?? '—'}</div>
                  <div className="user-phone">{u.telephone ?? '—'}</div>
                </div>

                {/* Statut */}
                <div>
                  <button
                    onClick={() => toggleActif(u)}
                    className={`badge-verif ${u.actif ? 'verified' : 'pending'}`}
                    style={{ cursor: 'pointer', border: 'none', background: 'transparent' }}
                    title="Cliquer pour basculer"
                  >
                    {u.actif ? '✓ ACTIF' : '✗ BLOQUÉ'}
                  </button>
                </div>

                {/* Date */}
                <div className="user-date">{formatDate(u.created_at)}</div>

                {/* Actions */}
                <div className="user-actions">
                  {confirmDelete === u.id ? (
                    <>
                      <button
                        className="btn-icon-sm danger"
                        onClick={() => handleDelete(u.id)}
                        title="Confirmer la suppression"
                      >
                        ✓
                      </button>
                      <button
                        className="btn-icon-sm"
                        onClick={() => setConfirmDelete(null)}
                        title="Annuler"
                      >
                        ✗
                      </button>
                    </>
                  ) : (
                    <button
                      className="btn-icon-sm danger"
                      onClick={() => setConfirmDelete(u.id)}
                      title="Supprimer"
                    >
                      <TrashIcon />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}

          {/* Footer pagination */}
          <div className="user-table-footer">
            <span>
              {total === 0 ? '0 résultat' : `${(page - 1) * LIMIT + 1}–${Math.min(page * LIMIT, total)} sur ${total}`}
            </span>
            <div className="immo-pagination">
              <button
                className="page-btn"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
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
              <button
                className="page-btn"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRightIcon />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
