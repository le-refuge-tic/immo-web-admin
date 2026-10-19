import { useState } from 'react';
import { patchAuth } from '../api/patchAuth';
import { apiMessage } from '../utils/apiMessage';

const OTP_LENGTH = 6;
const LOCAL_PHONE_LENGTH = 10;
const RESEND_COOLDOWN_SECONDS = 60;
const PHONE_PREFIX = '229';

type Step = 'saisie' | 'code';

type Props = {
  /** Numéro actuel du compte ; chaîne vide au premier renseignement. */
  currentPhone?: string;
  /** Appelé avec le nouveau numéro une fois celui-ci vérifié et enregistré. */
  onVerified: (telephone: string) => void;
};

/**
 * Changement de numéro en deux étapes : le code part AU NOUVEAU numéro, et
 * seul ce numéro-là peut être validé par la session OTP ouverte. Le numéro
 * sert au 2FA et à la réinitialisation du mot de passe, il ne peut donc pas
 * être modifié par un simple PATCH du profil.
 */
export default function VerifyPhoneSection({ currentPhone, onVerified }: Props) {
  const [step, setStep] = useState<Step>('saisie');
  const [localNumber, setLocalNumber] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [sessionToken, setSessionToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);

  const isChangement = !!currentPhone;
  const digits = localNumber.replace(/\D/g, '');
  const phone = PHONE_PREFIX + digits;

  const startCountdown = () => {
    setCountdown(RESEND_COOLDOWN_SECONDS);
    const timer = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(timer);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  const envoyerCode = async (renvoi = false) => {
    if (digits.length !== LOCAL_PHONE_LENGTH) {
      setError('Numéro invalide — 10 chiffres requis (ex: 01XXXXXXXX).');
      return;
    }
    if (isChangement && !password) {
      setError('Saisissez votre mot de passe actuel pour changer de numéro.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await patchAuth.sendPhoneOtp(phone, isChangement ? password : undefined);
      setSessionToken(res.session_token);
      setStep('code');
      if (renvoi) setCode('');
      startCountdown();
    } catch (err) {
      setError(apiMessage(err) ?? "Le code n'a pas pu être envoyé.");
    } finally {
      setLoading(false);
    }
  };

  const verifierCode = async () => {
    if (code.length !== OTP_LENGTH) {
      setError(`Entrez le code à ${OTP_LENGTH} chiffres reçu par SMS.`);
      return;
    }
    setLoading(true);
    setError('');
    try {
      await patchAuth.verifyPhoneOtp(sessionToken, code, phone);
      onVerified(phone);
    } catch (err) {
      setError(apiMessage(err) ?? 'Code incorrect ou expiré.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: 'var(--c-surface-2)',
      border: '1px solid var(--c-border)',
      borderRadius: 10,
      padding: 14,
      marginBottom: 14,
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-text)', marginBottom: 4 }}>
        {isChangement ? 'Changer de numéro' : 'Vérifier mon numéro'}
      </div>
      <div style={{ fontSize: 12, color: 'var(--c-text)', opacity: 0.75, marginBottom: 12, lineHeight: 1.5 }}>
        {step === 'saisie'
          ? 'Un code vous sera envoyé par SMS au nouveau numéro pour le confirmer.'
          : `Entrez le code à ${OTP_LENGTH} chiffres envoyé au +${phone}.`}
      </div>

      {error && (
        <div role="alert" style={{
          background: 'var(--c-red-bg)', color: 'var(--c-red)',
          border: '1px solid var(--t-red-bd)', borderRadius: 8,
          padding: '8px 12px', fontSize: 12, fontWeight: 500, marginBottom: 12,
        }}>
          {error}
        </div>
      )}

      {step === 'saisie' ? (
        <>
          <div className="immo-form-field">
            <label className="immo-form-label" htmlFor="vp-phone">Nouveau numéro</label>
            <div style={{ display: 'flex', alignItems: 'stretch' }}>
              <span style={{
                display: 'flex', alignItems: 'center', padding: '0 12px',
                background: 'var(--c-surface-2)', border: '1px solid var(--c-border)', borderRight: 'none',
                borderRadius: '10px 0 0 10px', color: 'var(--c-text)', fontSize: 14, fontWeight: 600,
              }}>
                +229
              </span>
              <input
                id="vp-phone"
                className="immo-form-input"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                maxLength={LOCAL_PHONE_LENGTH}
                placeholder="01XXXXXXXX"
                value={localNumber}
                onChange={e => {
                  setLocalNumber(e.target.value.replace(/\D/g, '').slice(0, LOCAL_PHONE_LENGTH));
                  setError('');
                }}
                disabled={loading}
                style={{ borderRadius: '0 10px 10px 0', flex: 1 }}
              />
            </div>
          </div>

          {isChangement && (
            <div className="immo-form-field">
              <label className="immo-form-label" htmlFor="vp-password">Mot de passe actuel</label>
              <input
                id="vp-password"
                className="immo-form-input"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                disabled={loading}
              />
            </div>
          )}

          <button
            type="button"
            className="btn-submit"
            onClick={() => envoyerCode()}
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? 'Envoi…' : 'Envoyer le code'}
          </button>
        </>
      ) : (
        <>
          <div className="immo-form-field">
            <label className="immo-form-label" htmlFor="vp-code">Code de vérification</label>
            <input
              id="vp-code"
              className="immo-form-input"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={OTP_LENGTH}
              placeholder="000000"
              value={code}
              onChange={e => { setCode(e.target.value.replace(/\D/g, '').slice(0, OTP_LENGTH)); setError(''); }}
              disabled={loading}
              style={{ textAlign: 'center', letterSpacing: '0.4em', fontWeight: 700 }}
            />
          </div>

          <button
            type="button"
            className="btn-submit"
            onClick={verifierCode}
            disabled={loading || code.length !== OTP_LENGTH}
            style={{ width: '100%' }}
          >
            {loading ? 'Vérification…' : 'Valider le numéro'}
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
            <button
              type="button"
              onClick={() => { setStep('saisie'); setCode(''); setError(''); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-blue)', fontSize: 12, fontWeight: 600, padding: 0 }}
            >
              Modifier le numéro
            </button>
            <button
              type="button"
              onClick={() => envoyerCode(true)}
              disabled={countdown > 0 || loading}
              style={{
                background: 'none', border: 'none', fontSize: 12, fontWeight: 600, padding: 0,
                cursor: countdown > 0 || loading ? 'not-allowed' : 'pointer',
                color: countdown > 0 || loading ? 'var(--c-border)' : 'var(--c-blue)',
              }}
            >
              {countdown > 0 ? `Renvoyer dans ${countdown}s` : 'Renvoyer le code'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
