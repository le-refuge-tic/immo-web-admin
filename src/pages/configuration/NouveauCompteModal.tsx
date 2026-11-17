import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { apiMessage } from '../../utils/apiMessage';
import { EmailInput, ErreurChamp, TexteInput } from '../../shared/saisie/champs';
import { idErreur, useValidation } from '../../shared/saisie/validation';
import { schemaNouveauCompte } from '../../validation/schemas';

const FORMULAIRE = 'nouveau-compte';

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

export type NouveauCompte = { nom: string; prenom: string; email: string; password: string };

/** Messages de l'API rattachés aux champs (« email already exists », etc.). */
const CHAMPS_SERVEUR = { email: /e-?mail|adresse/i, password: /mot de passe|password/i, nom: /^nom\b/i, prenom: /prénom|prenom/i };

/**
 * Lot 15 — création d'un compte du personnel (commercial ou admin) : un seul formulaire,
 * validé par `schemaNouveauCompte` (mêmes règles que les DTO du backend).
 */
export default function NouveauCompteModal({ titre, description, libelleBouton, libelleEnCours, placeholderEmail, ariaLabel, creer, onClose }: {
  titre: string;
  description: ReactNode;
  libelleBouton: string;
  libelleEnCours: string;
  placeholderEmail: string;
  ariaLabel: string;
  /** Appel à l'API ; une erreur levée est affichée sous le bon champ quand c'est possible. */
  creer: (payload: NouveauCompte) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm]       = useState({ nom: '', prenom: '', email: '', password: '', confirm: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [showCfm, setShowCfm] = useState(false);
  const [error, setError]     = useState('');
  const v = useValidation(FORMULAIRE, schemaNouveauCompte, form);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const set = (field: keyof typeof form) => (e: { target: { value: string } }) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    v.effacerErreurServeur(field);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    void v.soumettre(async ({ nom, prenom, email, password }) => {
      try {
        await creer({ nom, prenom, email, password });
        onClose();
      } catch (err) {
        if (!v.erreursDuServeur(err, CHAMPS_SERVEUR)) setError(apiMessage(err) ?? 'Une erreur est survenue');
      }
    });
  };

  const pwdField = (field: 'password' | 'confirm', show: boolean, toggle: () => void, label: string, placeholder: string) => (
    <div className="immo-form-field">
      <label className="immo-form-label" htmlFor={`${FORMULAIRE}-${field}`}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          className="immo-form-input"
          type={show ? 'text' : 'password'}
          value={form[field]}
          onChange={set(field)}
          maxLength={128}
          autoComplete="new-password"
          placeholder={placeholder}
          style={{ paddingRight: '2.5rem' }}
          {...v.propsChamp(field)}
        />
        <button
          type="button"
          onClick={toggle}
          aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
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
      <ErreurChamp id={idErreur(FORMULAIRE, field)} message={v.erreurs[field]} />
    </div>
  );

  return (
    <div className="immo-modal-backdrop" role="dialog" aria-modal="true" aria-label={ariaLabel} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="immo-modal">
        <div className="immo-modal-title">{titre}</div>
        <div className="immo-modal-sub">{description}</div>

        {error && (
          <div role="alert" style={{
            background: 'var(--c-red-bg)', color: 'var(--c-red)',
            border: '1px solid var(--t-red-bd)', borderRadius: 8,
            padding: '9px 13px', fontSize: 12, fontWeight: 500, marginBottom: 14,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="immo-form-field">
              <label className="immo-form-label" htmlFor={`${FORMULAIRE}-nom`}>Nom</label>
              <TexteInput className="immo-form-input" maxLength={100} value={form.nom} onChange={set('nom')} placeholder="Dupont" {...v.propsChamp('nom')} />
              <ErreurChamp id={idErreur(FORMULAIRE, 'nom')} message={v.erreurs.nom} />
            </div>
            <div className="immo-form-field">
              <label className="immo-form-label" htmlFor={`${FORMULAIRE}-prenom`}>Prénom</label>
              <TexteInput className="immo-form-input" maxLength={100} value={form.prenom} onChange={set('prenom')} placeholder="Jean" {...v.propsChamp('prenom')} />
              <ErreurChamp id={idErreur(FORMULAIRE, 'prenom')} message={v.erreurs.prenom} />
            </div>
          </div>
          <div className="immo-form-field">
            <label className="immo-form-label" htmlFor={`${FORMULAIRE}-email`}>Adresse email</label>
            <EmailInput className="immo-form-input" value={form.email} onChange={set('email')} placeholder={placeholderEmail} {...v.propsChamp('email')} />
            <ErreurChamp id={idErreur(FORMULAIRE, 'email')} message={v.erreurs.email} />
          </div>
          {pwdField('password', showPwd, () => setShowPwd(x => !x), 'Mot de passe', 'Min. 8 caractères')}
          {pwdField('confirm', showCfm, () => setShowCfm(x => !x), 'Confirmer le mot de passe', 'Répéter le mot de passe')}

          <div className="immo-modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn-submit" disabled={v.envoiEnCours}>
              {v.envoiEnCours ? (
                <>
                  <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
                  {libelleEnCours}
                </>
              ) : libelleBouton}
            </button>
          </div>
        </form>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
