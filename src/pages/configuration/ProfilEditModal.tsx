import { useState } from 'react';
import { patchAuth } from '../../api/patchAuth';

export default function ProfilEditModal({ initial, onClose, onSaved }: {
  initial: any;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [form, setForm]       = useState({ ...initial });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const set = (field: any) => (e: any) => setForm((f: any) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await patchAuth.profile({
        nom:       form.nom,
        prenom:    form.prenom,
        email:     form.email || undefined,
        telephone: form.telephone || undefined,
      });
      await onSaved();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="immo-modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="immo-modal">
        <div className="immo-modal-title">Modifier mon profil</div>
        <div className="immo-modal-sub">Les modifications seront appliquées immédiatement.</div>

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
              <input className="immo-form-input" value={form.nom} onChange={set('nom')} required placeholder="Hounssou" />
            </div>
            <div className="immo-form-field">
              <label className="immo-form-label">Prénom</label>
              <input className="immo-form-input" value={form.prenom} onChange={set('prenom')} required placeholder="Franck" />
            </div>
          </div>
          <div className="immo-form-field">
            <label className="immo-form-label">Adresse email</label>
            <input className="immo-form-input" type="email" value={form.email} onChange={set('email')} placeholder="admin@houetche.com" />
          </div>
          <div className="immo-form-field">
            <label className="immo-form-label">Téléphone</label>
            <input className="immo-form-input" type="tel" value={form.telephone} onChange={set('telephone')} placeholder="+229 01 XX XX XX XX" />
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
