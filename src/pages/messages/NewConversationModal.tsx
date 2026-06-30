import { useState, useEffect } from 'react';
import { getAdminUser } from '../../api/getAdminUser';
import { postConversation } from '../../api/postConversation';
import { SearchIcon, XIcon } from '../../components/Icons';

const COLORS = ['#2563EB', '#7C3AED', '#DB2777', '#D97706', '#16A34A', '#0891B2'];
function avatarColor(id: number) { return COLORS[Math.abs(id) % COLORS.length]; }
function initials(u: any) { return `${u.nom?.[0] ?? ''}${u.prenom?.[0] ?? ''}`.toUpperCase(); }

const ROLE_TABS = [
  { key: '',             label: 'Tous'          },
  { key: 'proprietaire', label: 'Propriétaires' },
  { key: 'demarcheur',   label: 'Démarcheurs'   },
  { key: 'locataire',    label: 'Locataires'    },
];

const ROLE_LABELS: any = {
  proprietaire: 'Propriétaire',
  demarcheur:   'Démarcheur',
  locataire:    'Locataire',
};

export default function NewConversationModal({ onClose, onCreated }: {
  onClose: () => void;
  onCreated: (conv: any) => void;
}) {
  const [search, setSearch]       = useState('');
  const [roleTab, setRoleTab]     = useState('');
  const [users, setUsers]         = useState([] as any[]);
  const [loading, setLoading]     = useState(true);
  const [creating, setCreating]   = useState(null as any);

  useEffect(() => {
    setLoading(true);
    getAdminUser.list({
      limit: 50,
      page: 1,
      role: roleTab || undefined,
      search: search || undefined,
    })
      .then(res => setUsers(res.data ?? res))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [roleTab, search]);

  const handleSelect = async (u: any) => {
    if (creating) return;
    setCreating(u.id);
    try {
      const conv = await postConversation.create(u.id);
      onCreated(conv);
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Impossible de créer la conversation.');
      setCreating(null);
    }
  };

  return (
    <div className="immo-modal-backdrop" onClick={onClose}>
      <div className="ncm-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="ncm-header">
          <div>
            <div className="ncm-title">Nouveau message</div>
            <div className="ncm-sub">Choisissez un destinataire</div>
          </div>
          <button className="ncm-close-btn" onClick={onClose} title="Fermer">
            <XIcon size={16} />
          </button>
        </div>

        {/* Recherche */}
        <div className="ncm-search-row">
          <SearchIcon size={14} />
          <input
            className="ncm-search-input"
            placeholder="Rechercher par nom, email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        {/* Tabs rôles */}
        <div className="ncm-tabs">
          {ROLE_TABS.map(t => (
            <button
              key={t.key}
              className={`ncm-tab${roleTab === t.key ? ' active' : ''}`}
              onClick={() => setRoleTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Liste des utilisateurs */}
        <div className="ncm-user-list">
          {loading ? (
            <div className="ncm-placeholder">
              <div className="msg-spinner" />
            </div>
          ) : users.length === 0 ? (
            <div className="ncm-placeholder">Aucun utilisateur trouvé.</div>
          ) : users.map((u: any) => (
            <button
              key={u.id}
              className="ncm-user-row"
              onClick={() => handleSelect(u)}
              disabled={creating === u.id}
            >
              <div className="msg-av" style={{ background: avatarColor(u.id) }}>
                {initials(u)}
              </div>
              <div className="ncm-user-info">
                <div className="ncm-user-name">{u.prenom} {u.nom}</div>
                <div className="ncm-user-meta">
                  <span className="ncm-role-chip">{ROLE_LABELS[u.role] ?? u.role}</span>
                  {u.email && <span className="ncm-user-email">{u.email}</span>}
                </div>
              </div>
              {creating === u.id ? (
                <div className="msg-send-spinner" style={{ borderColor: 'rgba(37,99,235,0.3)', borderTopColor: 'var(--c-blue)' }} />
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--c-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
