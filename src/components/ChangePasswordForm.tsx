import { useState, type FormEvent } from 'react';
import { patchAuth } from '../api/patchAuth';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

type Props = {
  onSuccess: () => void;
  submitLabel?: string;
};

type Step = 'form' | 'otp';

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
        style={{ background: 'var(--c-surface-2)', color: 'var(--c-text)', paddingRight: 40 }}
        aria-label={label}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        tabIndex={-1}
        style={{
          position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--c-muted)', padding: 2, display: 'flex', alignItems: 'center',
        }}
        aria-label={show ? 'Masquer' : 'Afficher'}
      >
        <EyeIcon open={show} />
      </button>
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div style={{
      marginBottom: 14, padding: '8px 12px',
      background: 'var(--t-red-bg)', border: '1px solid var(--t-red-bd)',
      borderRadius: 8, fontSize: 12, color: 'var(--s-red)',
    }}>
      {message}
    </div>
  );
}

function SubmitBtn({ loading, disabled, children }: { loading: boolean; disabled: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      className="btn-submit"
      style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 8 }}
      disabled={loading || disabled}
    >
      {loading ? (
        <>
          <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'block' }} />
          En cours…
        </>
      ) : children}
    </button>
  );
}

export default function ChangePasswordForm({ onSuccess, submitLabel = 'Valider le nouveau mot de passe' }: Props) {
  const { user } = useAuth();
  const showToast = useToast();
  const [step, setStep]                       = useState<Step>('form');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [sessionToken, setSessionToken]       = useState('');
  const [otp, setOtp]                         = useState('');
  const [countdown, setCountdown]             = useState(0);
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState('');

  const tooShort  = newPassword.length > 0 && newPassword.length < 8;
  const mismatch  = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const canSubmit = !!currentPassword && newPassword.length >= 8 && !mismatch && confirmPassword.length > 0;

  const phone = user?.telephone ?? '';

  const startCountdown = () => {
    setCountdown(60);
    const t = setInterval(() => setCountdown(c => {
      if (c <= 1) { clearInterval(t); return 0; }
      return c - 1;
    }), 1000);
  };

  // Étape 1 : valider les mots de passe puis envoyer l'OTP
  const handleSubmitForm = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    // Si pas de téléphone enregistré (ex. admin), on change directement sans OTP
    if (!phone) {
      setError('');
      setLoading(true);
      try {
        await patchAuth.changePassword(currentPassword, newPassword);
        showToast('Mot de passe mis à jour avec succès.');
        onSuccess();
      } catch (err: any) {
        setError(err?.response?.data?.message ?? 'Impossible de changer le mot de passe.');
        setLoading(false);
      }
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await patchAuth.sendPhoneOtp(phone);
      setSessionToken(res.session_token);
      setStep('otp');
      startCountdown();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Impossible d\'envoyer le code SMS.');
    } finally {
      setLoading(false);
    }
  };

  // Étape 2 : vérifier l'OTP puis changer le mot de passe
  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Entrez le code à 6 chiffres reçu par SMS.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await patchAuth.verifyPhoneOtp(sessionToken, otp, phone);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Code incorrect ou expiré.');
      setLoading(false);
      return;
    }
    try {
      await patchAuth.changePassword(currentPassword, newPassword);
      showToast('Mot de passe mis à jour avec succès.');
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Impossible de changer le mot de passe.');
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setLoading(true);
    setError('');
    setOtp('');
    try {
      const res = await patchAuth.sendPhoneOtp(phone);
      setSessionToken(res.session_token);
      startCountdown();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Erreur lors du renvoi.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'otp') {
    return (
      <>
        {/* Indicateur d'étape */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          {(['form', 'otp'] as Step[]).map((s) => (
            <div key={s} style={{
              height: 3, flex: 1, borderRadius: 2,
              background: s === 'otp' ? 'var(--c-blue)' : '#16A34A',
              transition: 'background 0.2s',
            }} />
          ))}
        </div>

        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: 'var(--t-green-bg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2"/>
            <path d="M16 7V5a2 2 0 0 0-4 0v2"/>
            <line x1="12" y1="12" x2="12" y2="16"/>
            <circle cx="12" cy="12" r="1" fill="#16A34A"/>
          </svg>
        </div>

        <div style={{ fontSize: 13, color: 'var(--c-text)', lineHeight: 1.6, marginBottom: 20 }}>
          Un code de vérification a été envoyé au{' '}
          <strong style={{ color: 'var(--c-text)' }}>+{phone}</strong>.{' '}
          <button
            type="button"
            onClick={() => { setStep('form'); setError(''); setOtp(''); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-blue)', fontSize: 13, padding: 0 }}
          >
            Retour
          </button>
        </div>

        <form onSubmit={handleVerifyOtp}>
          <div className="immo-form-field" style={{ marginBottom: 16 }}>
            <label className="immo-form-label" style={{ color: 'var(--c-text)' }}>Code de vérification *</label>
            <input
              className="immo-form-input"
              type="text"
              inputMode="numeric"
              placeholder="000000"
              maxLength={6}
              value={otp}
              onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); setError(''); }}
              autoFocus
              disabled={loading}
              required
              style={{ letterSpacing: '0.3em', fontSize: 20, textAlign: 'center', background: 'var(--c-surface-2)', color: 'var(--c-text)' }}
            />
          </div>
          {error && <ErrorBox message={error} />}
          <SubmitBtn loading={loading} disabled={otp.length !== 6}>
            Confirmer et changer le mot de passe
          </SubmitBtn>
          <div style={{ marginTop: 14, textAlign: 'center', fontSize: 12, color: 'var(--c-muted)' }}>
            Vous n'avez pas reçu le code ?{' '}
            {countdown > 0 ? (
              <span>Renvoyer dans {countdown}s</span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={loading}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-blue)', fontSize: 12 }}
              >
                Renvoyer
              </button>
            )}
          </div>
        </form>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </>
    );
  }

  return (
    <>
      {/* Indicateur d'étape */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {(['form', 'otp'] as Step[]).map((s) => (
          <div key={s} style={{
            height: 3, flex: 1, borderRadius: 2,
            background: s === 'form' ? 'var(--c-blue)' : 'var(--c-border)',
            transition: 'background 0.2s',
          }} />
        ))}
      </div>

      <form onSubmit={handleSubmitForm}>
        <div className="immo-form-field" style={{ marginBottom: 16 }}>
          <label className="immo-form-label" style={{ color: 'var(--c-text)' }}>Mot de passe actuel *</label>
          <PasswordField label="Mot de passe actuel" value={currentPassword}
            onChange={v => { setCurrentPassword(v); setError(''); }} autoFocus disabled={loading} />
        </div>

        <div className="immo-form-field" style={{ marginBottom: 16 }}>
          <label className="immo-form-label" style={{ color: 'var(--c-text)' }}>Nouveau mot de passe *</label>
          <PasswordField label="Nouveau mot de passe" value={newPassword} placeholder="8 caractères minimum"
            onChange={v => { setNewPassword(v); setError(''); }} disabled={loading} />
          {tooShort && (
            <div style={{ fontSize: 11, color: 'var(--s-yellow)', marginTop: 4 }}>8 caractères minimum requis.</div>
          )}
        </div>

        <div className="immo-form-field" style={{ marginBottom: 16 }}>
          <label className="immo-form-label" style={{ color: 'var(--c-text)' }}>Confirmer le nouveau mot de passe *</label>
          <PasswordField label="Confirmer le mot de passe" value={confirmPassword}
            onChange={v => { setConfirmPassword(v); setError(''); }} disabled={loading} />
          {mismatch && (
            <div style={{ fontSize: 11, color: 'var(--s-red)', marginTop: 4 }}>Les mots de passe ne correspondent pas.</div>
          )}
          {!mismatch && confirmPassword.length > 0 && newPassword.length >= 8 && (
            <div style={{ fontSize: 11, color: 'var(--s-green)', marginTop: 4 }}>Les mots de passe correspondent.</div>
          )}
        </div>

        {error && <ErrorBox message={error} />}

        <SubmitBtn loading={loading} disabled={!canSubmit}>
          {submitLabel}
        </SubmitBtn>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </form>
    </>
  );
}
