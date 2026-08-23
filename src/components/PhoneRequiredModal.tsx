import { useState, type FormEvent } from 'react';
import { patchAuth } from '../api/patchAuth';
import { useAuth } from '../context/AuthContext';

const ROLES_CONCERNES = ['commercial', 'admin', 'super_admin'];

export function usePhoneRequired() {
  const { user } = useAuth();
  const role = user?.role_principal ?? user?.role ?? '';
  return ROLES_CONCERNES.includes(role) && !user?.telephone;
}

export default function PhoneRequiredModal() {
  const { refreshUser } = useAuth();
  const [phone, setPhone]     = useState('');
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const clean = phone.trim();
    if (clean.replace(/\D/g, '').length < 8) {
      setError('Numéro invalide — au moins 8 chiffres requis.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await patchAuth.profile({ telephone: clean });
      await refreshUser();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Erreur lors de la sauvegarde.');
      setSaving(false);
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
        background: 'var(--c-card)', border: '1px solid var(--c-border)',
        borderRadius: 16, padding: '36px 32px', width: '100%', maxWidth: 420,
        boxShadow: '0 24px 64px rgba(0,0,0,0.20)',
      }}>
        {/* Icône */}
        <div style={{
          width: 52, height: 52, borderRadius: 14, background: '#EFF6FF',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.38 2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.76a16 16 0 0 0 6.29 6.29l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
          </svg>
        </div>

        <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--c-text)', marginBottom: 8 }}>
          Renseignez votre numéro de téléphone
        </h2>
        <p style={{ fontSize: 13, color: 'var(--c-muted)', lineHeight: 1.6, marginBottom: 24 }}>
          Pour continuer, veuillez indiquer votre numéro de téléphone professionnel.
          Il sera utilisé pour vous contacter en cas de besoin.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="immo-form-field" style={{ marginBottom: 16 }}>
            <label className="immo-form-label">Numéro de téléphone *</label>
            <input
              className="immo-form-input"
              type="tel"
              placeholder="+229 XX XX XX XX"
              value={phone}
              onChange={e => { setPhone(e.target.value); setError(''); }}
              autoFocus
              disabled={saving}
              required
            />
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
            style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 8 }}
            disabled={saving || !phone.trim()}
          >
            {saving ? (
              <>
                <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'block' }} />
                Enregistrement…
              </>
            ) : 'Enregistrer et continuer'}
          </button>
        </form>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
