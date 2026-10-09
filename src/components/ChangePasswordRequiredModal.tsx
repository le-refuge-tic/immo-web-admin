import { useAuth } from '../context/AuthContext';
import ChangePasswordForm from './ChangePasswordForm';

export function useChangePasswordRequired() {
  const { user } = useAuth();
  return !!user?.doit_changer_mot_de_passe;
}

export default function ChangePasswordRequiredModal() {
  const { refreshUser } = useAuth();

  return (
    <div role="dialog" aria-modal="true" aria-label="Changement de mot de passe requis" style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.55)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: 16,
      overflowY: 'auto',
    }}>
      <div style={{
        background: 'var(--c-card)', border: '1px solid var(--c-border)',
        borderRadius: 16, padding: '36px 32px', width: '100%', maxWidth: 420,
        boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
        margin: 'auto',
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: 'var(--t-blue-bg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>

        <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--c-text)', marginBottom: 8 }}>
          Changez votre mot de passe
        </h2>
        <p style={{ fontSize: 13, color: 'var(--c-text)', lineHeight: 1.6, marginBottom: 24 }}>
          Votre compte a été créé par un administrateur. Pour votre sécurité, définissez un nouveau mot de passe avant de continuer.
        </p>

        <ChangePasswordForm onSuccess={refreshUser} />
      </div>
    </div>
  );
}
