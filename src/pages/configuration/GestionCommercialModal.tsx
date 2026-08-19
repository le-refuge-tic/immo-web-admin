import { useState } from 'react';
import { postCommerciaux } from '../../api/postCommerciaux';

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

export default function GestionCommercialModal({ onClose, onCreated }: {
  onClose: () => void;
  onCreated: (u: any) => void;
}) {
  const [form, setForm]       = useState({ nom: '', prenom: '', email: '', password: '', confirm: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [showCfm, setShowCfm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const set = (field: any) => (e: any) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    setLoading(true);
    try {
      const { confirm: _, ...payload } = form;
      const res = await postCommerciaux.create(payload);
      onCreated(res.user ?? res);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const pwdField = (field: 'password' | 'confirm', show: boolean, toggle: () => void, label: string, placeholder: string) => (
    <div className="immo-form-field">
      <label className="immo-form-label">{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          className="immo-form-input"
          type={show ? 'text' : 'password'}
          value={form[field]}
          onChange={set(field)}
          required
          minLength={field === 'password' ? 8 : undefined}
          placeholder={placeholder}
          style={{ paddingRight: '2.5rem' }}
        />
        <button
          type="button"
          onClick={toggle}
          style={{
            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-muted)',
            display: 'flex', alignItems: 'center', padding: 0,
          }}
          tabIndex={-1}
        >
          <EyeIcon open={show} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="immo-modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="immo-modal">
        <div className="immo-modal-title">Nouveau commercial</div>
        <div className="immo-modal-sub">
          Ce compte aura accès aux annonces et à la messagerie. Il ne peut pas valider de biens.
        </div>

        {error && (
          <div style={{
            background: 'var(--c-red-bg)', color: 'var(--c-red)',
            border: '1px solid #FECACA', borderRadius: 8,
            padding: '9px 13px', fontSize: 12, fontWeight: 500, marginBottom: 14,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="immo-form-field">
              <label className="immo-form-label">Nom</label>
              <input className="immo-form-input" value={form.nom} onChange={set('nom')} required placeholder="Dupont" />
            </div>
            <div className="immo-form-field">
              <label className="immo-form-label">Prénom</label>
              <input className="immo-form-input" value={form.prenom} onChange={set('prenom')} required placeholder="Jean" />
            </div>
          </div>
          <div className="immo-form-field">
            <label className="immo-form-label">Adresse email</label>
            <input className="immo-form-input" type="email" value={form.email} onChange={set('email')} required placeholder="commercial@refuge-immo.com" />
          </div>
          {pwdField('password', showPwd, () => setShowPwd(v => !v), 'Mot de passe', 'Min. 8 caractères')}
          {pwdField('confirm', showCfm, () => setShowCfm(v => !v), 'Confirmer le mot de passe', 'Répéter le mot de passe')}

          <div className="immo-modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? (
                <>
                  <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
                  Création…
                </>
              ) : 'Créer le commercial'}
            </button>
          </div>
        </form>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
