import ChangePasswordForm from '../../components/ChangePasswordForm';

export default function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.55)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }} onClick={onClose}>
      <div style={{
        background: '#ffffff', border: '1px solid #E2E8F0',
        borderRadius: 16, padding: '36px 32px', width: '100%', maxWidth: 420,
        boxShadow: '0 24px 64px rgba(0,0,0,0.22)', position: 'relative',
      }} onClick={e => e.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          style={{
            position: 'absolute', top: 16, right: 16, background: 'none', border: 'none',
            cursor: 'pointer', color: '#94A3B8', padding: 4, lineHeight: 0,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: '#EFF6FF',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>

        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
          Changer le mot de passe
        </h2>
        <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, marginBottom: 24 }}>
          Entrez votre mot de passe actuel puis choisissez-en un nouveau.
        </p>

        <ChangePasswordForm onSuccess={onClose} />
      </div>
    </div>
  );
}
