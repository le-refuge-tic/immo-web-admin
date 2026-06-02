import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Topbar from './Topbar';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';

function AdminFooter() {
  const { user } = useAuth();
  const now = new Date().toLocaleString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <footer className="immo-admin-footer">
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{
          width: 7, height: 7, borderRadius: '50%',
          background: '#22C55E', flexShrink: 0,
        }} />
        <span>
          Plateforme <strong style={{ color: 'var(--c-text)' }}>HOUÉTCHÉ</strong> — opérationnelle
        </span>
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 20 }}>
        <span>{now}</span>
        {user && (
          <span style={{ color: 'var(--c-text)', fontWeight: 600 }}>
            {user.prenom} {user.nom}
          </span>
        )}
        <span style={{
          background: 'var(--c-orange-bg)', color: 'var(--c-orange)',
          fontSize: 10, fontWeight: 700, padding: '2px 8px',
          borderRadius: 4, letterSpacing: '0.5px',
        }}>
          SUPER ADMIN
        </span>
      </div>
    </footer>
  );
}

export default function AdminLayout() {
  const [minimized, setMinimized] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Ferme le drawer mobile à chaque changement de route
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Empêche le scroll du body quand le drawer est ouvert
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <div className="immo-app">
      <Topbar
        minimized={minimized}
        mobileOpen={mobileOpen}
        onToggleSidebar={() => setMinimized(m => !m)}
        onToggleMobile={() => setMobileOpen(m => !m)}
      />
      <div className="immo-shell">
        {/* Overlay mobile */}
        <div
          className={`immo-mobile-overlay${mobileOpen ? ' visible' : ''}`}
          onClick={() => setMobileOpen(false)}
        />
        <Sidebar minimized={minimized} mobileOpen={mobileOpen} />
        <div className="immo-main">
          <div className="immo-content-scroll">
            <Outlet />
          </div>
          <AdminFooter />
        </div>
      </div>
    </div>
  );
}
