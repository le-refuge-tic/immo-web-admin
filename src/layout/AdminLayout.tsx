import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { pageTitle } from './pageTitles';
import Topbar from './Topbar';
import Sidebar from './Sidebar';
import PhoneRequiredModal, { usePhoneRequired } from '../components/PhoneRequiredModal';
import ChangePasswordRequiredModal, { useChangePasswordRequired } from '../components/ChangePasswordRequiredModal';

export default function AdminLayout() {
  const passwordChangeRequired = useChangePasswordRequired();
  const phoneRequired = usePhoneRequired();
  // Tablette (48–64rem) : sidebar réduite aux icônes par défaut pour laisser
  // la place au contenu ; le bouton de la topbar permet toujours de l'agrandir.
  const [minimized, setMinimized] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia?.('(min-width: 48.01rem) and (max-width: 64rem)').matches,
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  useEffect(() => { document.title = pageTitle(location.pathname); }, [location.pathname]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <div className="immo-app">
      {/* 1re connexion : d'abord vérifier le téléphone (numéro + OTP SMS),
          puis SEULEMENT après, forcer le changement de mot de passe. */}
      {phoneRequired ? <PhoneRequiredModal /> : passwordChangeRequired && <ChangePasswordRequiredModal />}
      <Topbar
        minimized={minimized}
        mobileOpen={mobileOpen}
        onToggleSidebar={() => setMinimized(m => !m)}
        onToggleMobile={() => setMobileOpen(m => !m)}
      />
      <div className="immo-shell">
        <div
          className={`immo-mobile-overlay${mobileOpen ? ' visible' : ''}`}
          onClick={() => setMobileOpen(false)}
        />
        <Sidebar minimized={minimized} mobileOpen={mobileOpen} />
        <div className="immo-main">
          <div className="immo-content-scroll">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
