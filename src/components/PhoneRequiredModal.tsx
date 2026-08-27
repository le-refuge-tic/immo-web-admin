import { useState, type FormEvent } from 'react';
import { patchAuth } from '../api/patchAuth';
import { useAuth } from '../context/AuthContext';

const ROLES_CONCERNES = ['commercial', 'admin', 'super_admin'];

export function usePhoneRequired() {
  const { user } = useAuth();
  const role = user?.role_principal ?? user?.role ?? '';
  return ROLES_CONCERNES.includes(role) && !user?.telephone;
}

type Step = 'phone' | 'otp';

export default function PhoneRequiredModal() {
  const { refreshUser } = useAuth();
  const [step, setStep]               = useState<Step>('phone');
  const [phone, setPhone]             = useState('');
  const [sessionToken, setSessionToken] = useState('');
  const [otp, setOtp]                 = useState('');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [countdown, setCountdown]     = useState(0);

  const startCountdown = () => {
    setCountdown(60);
    const t = setInterval(() => setCountdown(c => {
      if (c <= 1) { clearInterval(t); return 0; }
      return c - 1;
    }), 1000);
  };

  const handleSendOtp = async (e: FormEvent) => {
    e.preventDefault();
    const clean = phone.trim();
    if (clean.replace(/\D/g, '').length < 8) {
      setError('Numéro invalide — au moins 8 chiffres requis.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await patchAuth.sendPhoneOtp(clean);
      setSessionToken(res.session_token);
      setStep('otp');
      startCountdown();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Impossible d\'envoyer le code SMS.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Entrez le code à 6 chiffres reçu par SMS.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await patchAuth.verifyPhoneOtp(sessionToken, otp, phone.trim());
      await refreshUser();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Code incorrect ou expiré.');
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setLoading(true);
    setError('');
    setOtp('');
    try {
      const res = await patchAuth.sendPhoneOtp(phone.trim());
      setSessionToken(res.session_token);
      startCountdown();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Erreur lors du renvoi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.55)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}>
      <div style={{
        background: '#ffffff', border: '1px solid #E2E8F0',
        borderRadius: 16, padding: '36px 32px', width: '100%', maxWidth: 420,
        boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
      }}>
        {/* Icône */}
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: step === 'phone' ? '#EFF6FF' : '#F0FDF4',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
          transition: 'background 0.2s',
        }}>
          {step === 'phone' ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.38 2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.76a16 16 0 0 0 6.29 6.29l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-4 0v2"/><line x1="12" y1="12" x2="12" y2="16"/><circle cx="12" cy="12" r="1" fill="#16A34A"/>
            </svg>
          )}
        </div>

        {/* Indicateur d'étape */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          {(['phone', 'otp'] as Step[]).map((s) => (
            <div key={s} style={{
              height: 3, flex: 1, borderRadius: 2,
              background: step === s || (s === 'phone' && step === 'otp')
                ? 'var(--c-blue)' : 'var(--c-border)',
              transition: 'background 0.2s',
            }} />
          ))}
        </div>

        {step === 'phone' ? (
          <>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
              Renseignez votre numéro
            </h2>
            <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, marginBottom: 24 }}>
              Un code de vérification vous sera envoyé par SMS pour confirmer votre numéro professionnel.
            </p>
            <form onSubmit={handleSendOtp}>
              <div className="immo-form-field" style={{ marginBottom: 16 }}>
                <label className="immo-form-label" style={{ color: '#0F172A' }}>Numéro de téléphone *</label>
                <input
                  className="immo-form-input"
                  type="tel"
                  placeholder="+229 XX XX XX XX"
                  value={phone}
                  onChange={e => { setPhone(e.target.value); setError(''); }}
                  autoFocus
                  disabled={loading}
                  required
                  style={{ background: '#F8FAFC', color: '#0F172A' }}
                />
              </div>
              {error && <ErrorBox message={error} />}
              <SubmitBtn loading={loading} disabled={!phone.trim()}>
                Envoyer le code
              </SubmitBtn>
            </form>
          </>
        ) : (
          <>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
              Vérifiez votre numéro
            </h2>
            <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, marginBottom: 24 }}>
              Entrez le code à 6 chiffres envoyé au <strong style={{ color: '#0F172A' }}>{phone}</strong>.
              <button
                type="button"
                onClick={() => { setStep('phone'); setError(''); setOtp(''); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-blue)', fontSize: 13, paddingLeft: 4 }}
              >
                Modifier
              </button>
            </p>
            <form onSubmit={handleVerify}>
              <div className="immo-form-field" style={{ marginBottom: 16 }}>
                <label className="immo-form-label" style={{ color: '#0F172A' }}>Code de vérification *</label>
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
                  style={{ letterSpacing: '0.3em', fontSize: 20, textAlign: 'center', background: '#F8FAFC', color: '#0F172A' }}
                />
              </div>
              {error && <ErrorBox message={error} />}
              <SubmitBtn loading={loading} disabled={otp.length !== 6}>
                Confirmer et continuer
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
          </>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div style={{
      marginBottom: 14, padding: '8px 12px',
      background: '#FEF2F2', border: '1px solid #FECACA',
      borderRadius: 8, fontSize: 12, color: '#DC2626',
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
