import { useState, type FormEvent } from 'react';
import { patchAuth } from '../api/patchAuth';

type Props = {
  onSuccess: () => void;
  submitLabel?: string;
};

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
        <input
          className="immo-form-input"
          type="password"
          value={currentPassword}
          onChange={e => { setCurrentPassword(e.target.value); setError(''); }}
          autoFocus
          disabled={loading}
          required
          style={{ background: '#F8FAFC', color: '#0F172A' }}
        />
      </div>
      <div className="immo-form-field" style={{ marginBottom: 16 }}>
        <label className="immo-form-label" style={{ color: '#0F172A' }}>Nouveau mot de passe *</label>
        <input
          className="immo-form-input"
          type="password"
          placeholder="8 caractères minimum"
          value={newPassword}
          onChange={e => { setNewPassword(e.target.value); setError(''); }}
          disabled={loading}
          required
          style={{ background: '#F8FAFC', color: '#0F172A' }}
        />
        {tooShort && (
          <div style={{ fontSize: 11, color: '#D97706', marginTop: 4 }}>
            8 caractères minimum requis.
          </div>
        )}
      </div>
      <div className="immo-form-field" style={{ marginBottom: 16 }}>
        <label className="immo-form-label" style={{ color: '#0F172A' }}>Confirmer le nouveau mot de passe *</label>
        <input
          className="immo-form-input"
          type="password"
          value={confirmPassword}
          onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
          disabled={loading}
          required
          style={{ background: '#F8FAFC', color: '#0F172A' }}
        />
        {mismatch && (
          <div style={{ fontSize: 11, color: '#DC2626', marginTop: 4 }}>
            Les mots de passe ne correspondent pas.
          </div>
        )}
        {!mismatch && confirmPassword.length > 0 && newPassword.length >= 8 && (
          <div style={{ fontSize: 11, color: '#16A34A', marginTop: 4 }}>
            Les mots de passe correspondent.
          </div>
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
