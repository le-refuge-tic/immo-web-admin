import { useState, type FormEvent } from 'react';
import { patchAuth } from '../api/patchAuth';

type Props = {
  onSuccess: () => void;
  submitLabel?: string;
};

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

function PasswordField({
  label, value, onChange, placeholder, disabled, autoFocus,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; disabled?: boolean; autoFocus?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <input
        className="immo-form-input"
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        autoFocus={autoFocus}
        disabled={disabled}
        required
        style={{ background: '#F8FAFC', color: '#0F172A', paddingRight: 40 }}
        aria-label={label}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        tabIndex={-1}
        style={{
          position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#6B7280', padding: 2, display: 'flex', alignItems: 'center',
        }}
        aria-label={show ? 'Masquer' : 'Afficher'}
      >
        <EyeIcon open={show} />
      </button>
    </div>
  );
}

export default function ChangePasswordForm({ onSuccess, submitLabel = 'Valider le nouveau mot de passe' }: Props) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState('');

  const tooShort  = newPassword.length > 0 && newPassword.length < 8;
  const mismatch  = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const canSubmit = !!currentPassword && newPassword.length >= 8 && !mismatch && confirmPassword.length > 0;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!canSubmit) return;
    setLoading(true);
    try {
      await patchAuth.changePassword(currentPassword, newPassword);
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Impossible de changer le mot de passe.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="immo-form-field" style={{ marginBottom: 16 }}>
        <label className="immo-form-label" style={{ color: '#0F172A' }}>Mot de passe actuel *</label>
        <PasswordField label="Mot de passe actuel" value={currentPassword}
          onChange={v => { setCurrentPassword(v); setError(''); }} autoFocus disabled={loading} />
      </div>

      <div className="immo-form-field" style={{ marginBottom: 16 }}>
        <label className="immo-form-label" style={{ color: '#0F172A' }}>Nouveau mot de passe *</label>
        <PasswordField label="Nouveau mot de passe" value={newPassword} placeholder="8 caractères minimum"
          onChange={v => { setNewPassword(v); setError(''); }} disabled={loading} />
        {tooShort && (
          <div style={{ fontSize: 11, color: '#D97706', marginTop: 4 }}>8 caractères minimum requis.</div>
        )}
      </div>

      <div className="immo-form-field" style={{ marginBottom: 16 }}>
        <label className="immo-form-label" style={{ color: '#0F172A' }}>Confirmer le nouveau mot de passe *</label>
        <PasswordField label="Confirmer le mot de passe" value={confirmPassword}
          onChange={v => { setConfirmPassword(v); setError(''); }} disabled={loading} />
        {mismatch && (
          <div style={{ fontSize: 11, color: '#DC2626', marginTop: 4 }}>Les mots de passe ne correspondent pas.</div>
        )}
        {!mismatch && confirmPassword.length > 0 && newPassword.length >= 8 && (
          <div style={{ fontSize: 11, color: '#16A34A', marginTop: 4 }}>Les mots de passe correspondent.</div>
        )}
      </div>

      {error && (
        <div style={{
          marginBottom: 14, padding: '8px 12px',
          background: '#FEF2F2', border: '1px solid #FECACA',
          borderRadius: 8, fontSize: 12, color: '#DC2626',
        }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        className="btn-submit"
        style={{
          width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 8,
          opacity: canSubmit ? 1 : 0.5, cursor: canSubmit ? 'pointer' : 'not-allowed',
        }}
        disabled={loading || !canSubmit}
      >
        {loading ? (
          <>
            <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'block' }} />
            En cours…
          </>
        ) : submitLabel}
      </button>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </form>
  );
}
