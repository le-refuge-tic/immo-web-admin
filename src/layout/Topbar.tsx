import { useAuth } from '../context/AuthContext';

export default function Topbar({
  minimized,
  mobileOpen,
  onToggleSidebar,
  onToggleMobile,
}: {
  minimized: boolean;
  mobileOpen: boolean;
  onToggleSidebar: () => void;
  onToggleMobile: () => void;
}) {
  const { user, logout } = useAuth();

  const initials = user
    ? `${user.nom[0] ?? ''}${user.prenom[0] ?? ''}`.toUpperCase()
    : 'SA';

  return (
    <div className="immo-layout-topbar">
      {/* Hamburger (mobile) */}
      <button
        className="immo-hamburger-btn"
        onClick={onToggleMobile}
        title={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
        aria-label="Menu"
      >
        {mobileOpen ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        )}
      </button>

      {/* Logo + toggle desktop */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div className="immo-logo" style={{ padding: 0, border: 'none', gap: 8 }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"
              fill="#EFF6FF" stroke="#2563EB" strokeWidth="1.5"/>
            <path d="M9 21v-7h6v7" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span className="immo-logo-text" style={{ fontSize: 16 }}>HOUÉTCHÉ</span>
        </div>

        <button
          className="immo-toggle-btn"
          onClick={onToggleSidebar}
          title={minimized ? 'Agrandir le menu' : 'Réduire le menu'}
        >
          {minimized ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          )}
        </button>
      </div>

      <div className="immo-spacer" />

      {/* Droite */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="immo-admin-block">
          <div className="immo-admin-text">
            <div className="immo-admin-name">
              {user ? `${user.prenom} ${user.nom}` : 'Super Admin'}
            </div>
            <div className="immo-admin-role">Super Administrateur</div>
          </div>
          <div className="immo-avatar-sq">{initials}</div>
        </div>

        <button
          className="immo-bell-btn"
          onClick={logout}
          title="Déconnexion"
          style={{ color: 'var(--c-red)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
