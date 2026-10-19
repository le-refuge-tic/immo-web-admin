import { useState, useEffect } from 'react';
import { patchAuth } from '../../api/patchAuth';
import { apiMessage } from '../../utils/apiMessage';
import VerifyPhoneSection from '../../components/VerifyPhoneSection';

export default function ProfilEditModal({ initial, onClose, onSaved }: {
  initial: any;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [form, setForm]       = useState({ ...initial });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [editingPhone, setEditingPhone] = useState(false);

  const currentPhone: string = form.telephone || '';

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const set = (field: any) => (e: any) => setForm((f: any) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // `telephone` est exclu volontairement : il ne change que par le flux
      // vérifié par SMS (VerifyPhoneSection), jamais par ce PATCH.
      await patchAuth.profile({
        nom:    form.nom,
        prenom: form.prenom,
        email:  form.email || undefined,
      });
      await onSaved();
      onClose();
    } catch (err: any) {
      setError(apiMessage(err) ?? 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="immo-modal-backdrop" role="dialog" aria-modal="true" aria-label="Modifier le profil" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="immo-modal">
        <div className="immo-modal-title">Modifier mon profil</div>
        <div className="immo-modal-sub">Les modifications seront appliquées immédiatement.</div>

        {error && (
          <div style={{
            background: 'var(--c-red-bg)', color: 'var(--c-red)',
            border: '1px solid var(--t-red-bd)', borderRadius: 8,
            padding: '9px 13px', fontSize: 12, fontWeight: 500, marginBottom: 14,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="immo-form-field">
              <label className="immo-form-label">Nom</label>
              <input className="immo-form-input" value={form.nom} onChange={set('nom')} required placeholder="Hounssou" />
            </div>
            <div className="immo-form-field">
              <label className="immo-form-label">Prénom</label>
              <input className="immo-form-input" value={form.prenom} onChange={set('prenom')} required placeholder="Franck" />
            </div>
          </div>
          <div className="immo-form-field">
            <label className="immo-form-label">Adresse email</label>
            <input className="immo-form-input" type="email" value={form.email} onChange={set('email')} placeholder="admin@refuge-immo.com" />
          </div>
          <div className="immo-form-field">
            <label className="immo-form-label">Téléphone</label>
            {editingPhone ? (
              <VerifyPhoneSection
                currentPhone={currentPhone}
                onVerified={async tel => {
                  setForm((f: any) => ({ ...f, telephone: tel }));
                  setEditingPhone(false);
                  await onSaved();
                }}
              />
            ) : (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                background: 'var(--c-surface-2)', border: '1px solid var(--c-border)',
                borderRadius: 10, padding: '10px 13px',
              }}>
                <span style={{ fontSize: 13, color: 'var(--c-text)', opacity: currentPhone ? 1 : 0.6 }}>
                  {currentPhone || 'Aucun numéro enregistré'}
                </span>
                <button
                  type="button"
                  onClick={() => setEditingPhone(true)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-blue)', fontSize: 12, fontWeight: 600, padding: 0, whiteSpace: 'nowrap' }}
                >
                  {currentPhone ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            )}
            <div style={{ fontSize: 11, color: 'var(--c-text)', opacity: 0.6, marginTop: 6 }}>
              Le numéro sert à la connexion en deux étapes : il est confirmé par un code SMS.
            </div>
          </div>

          <div className="immo-modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? (
                <>
                  <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
                  Enregistrement…
                </>
              ) : 'Enregistrer'}
            </button>
          </div>
        </form>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
