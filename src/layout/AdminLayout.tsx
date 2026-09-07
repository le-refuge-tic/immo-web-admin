import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Topbar from './Topbar';
import Sidebar from './Sidebar';
import AdminFooter from './AdminFooter';
import PhoneRequiredModal, { usePhoneRequired } from '../components/PhoneRequiredModal';
import ChangePasswordRequiredModal, { useChangePasswordRequired } from '../components/ChangePasswordRequiredModal';

export default function AdminLayout() {
  const passwordChangeRequired = useChangePasswordRequired();
  const phoneRequired = usePhoneRequired();
  const [minimized, setMinimized] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

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
          <AdminFooter />
        </div>
      </div>
    </div>
  );
}
