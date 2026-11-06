import { useEffect, useState, type FormEvent } from 'react';
import { postRetrait } from '../../api/postRetrait';
import { apiMessage } from '../../utils/apiMessage';
import { numeroLocal, numeroValide } from '../../utils/retraitCommercial';

/**
 * Changement du NUMÉRO de retrait Mobile Money, en deux étapes : mot de passe puis code SMS envoyé
 * au téléphone ACTUEL du compte. Le numéro est prérempli (par défaut : le téléphone vérifié à la
 * première connexion). Un vrai changement suspend les retraits 48 h. L'opérateur n'est pas ici : il
 * se choisit dans le formulaire de retrait, à chaque demande.
 */
export default function NumeroRetraitModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [step, setStep]               = useState<'form' | 'otp'>('form');
  const [numero, setNumero]           = useState('');
  const [motDePasse, setMotDePasse]   = useState('');
  const [sessionToken, setSessionToken] = useState('');
  const [otp, setOtp]                 = useState('');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [suspendus, setSuspendus]     = useState<boolean | null>(null);

  useEffect(() => {
    const echap = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', echap);
    return () => document.removeEventListener('keydown', echap);
  }, [onClose]);

  // Préremplissage depuis le compte ; sans effet si la personne a déjà commencé à saisir.
  useEffect(() => {
    let actif = true;
    postRetrait.numeroRetrait().then(info => {
      if (!actif) return;
      setNumero(prev => prev || numeroLocal(info.numero_retrait));
    }).catch(() => { /* la personne saisit à la main */ });
    return () => { actif = false; };
  }, []);

  const initier = async (e: FormEvent) => {
    e.preventDefault();
    if (!numeroValide(numero)) { setError('Numéro invalide : 10 chiffres commençant par 01 (ex. 01XXXXXXXX).'); return; }
    if (!motDePasse) { setError('Entrez votre mot de passe pour confirmer.'); return; }
    setLoading(true); setError('');
    try {
      const res = await postRetrait.initierNumero(numeroLocal(numero), motDePasse);
      setSessionToken(res.session_token);
      setStep('otp');
    } catch (err) {
      setError(apiMessage(err) ?? 'Impossible de vérifier ces informations.');
    } finally {
      setLoading(false);
    }
  };

  const confirmer = async (e: FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) { setError('Entrez le code reçu par SMS.'); return; }
    setLoading(true); setError('');
    try {
      const res = await postRetrait.confirmerNumero(sessionToken, otp.trim(), numeroLocal(numero));
      setSuspendus(!!res.retraits_suspendus);
    } catch (err) {
      setError(apiMessage(err) ?? 'Code invalide ou expiré.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Numéro de retrait" style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }} onClick={suspendus === null ? onClose : undefined}>
      <div style={{
        background: 'var(--c-card)', border: '1px solid var(--c-border)', borderRadius: 16,
        padding: '32px 28px', width: '100%', maxWidth: 400, boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
      }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--c-text)', marginBottom: 6 }}>Numéro de retrait</h2>

        {suspendus !== null ? (
          <>
            <p style={{ fontSize: 13, color: 'var(--c-text)', lineHeight: 1.6, margin: '12px 0 20px' }}>
              {suspendus
                ? 'Numéro de retrait mis à jour. Par sécurité, les retraits sont suspendus pendant 48 h après ce changement.'
                : 'Ce numéro est déjà votre numéro de retrait : aucun changement.'}
            </p>
            <button className="btn-submit" style={{ width: '100%', justifyContent: 'center', display: 'flex' }}
              onClick={() => { onSaved(); onClose(); }}>Fermer</button>
          </>
        ) : step === 'form' ? (
          <form onSubmit={initier}>
            <p style={{ fontSize: 12, color: 'var(--c-muted)', marginBottom: 16 }}>
              Un code sera envoyé par SMS sur le téléphone actuel de votre compte. Par sécurité, les retraits sont suspendus 48 h si le numéro change. L&apos;opérateur, lui, se choisit à chaque retrait.
            </p>
            <div className="immo-form-field" style={{ marginBottom: 12 }}>
              <label className="immo-form-label" htmlFor="nr-numero">Numéro Mobile Money *</label>
              <input id="nr-numero" className="immo-form-input" type="tel" inputMode="numeric" maxLength={10} placeholder="01XXXXXXXX"
                value={numero} onChange={e => { setNumero(e.target.value.replace(/\D/g, '').slice(0, 10)); setError(''); }} disabled={loading} autoFocus />
            </div>
            <div className="immo-form-field" style={{ marginBottom: 12 }}>
              <label className="immo-form-label" htmlFor="nr-mdp">Mot de passe (confirmation) *</label>
              <input id="nr-mdp" className="immo-form-input" type="password" placeholder="••••••••"
                value={motDePasse} onChange={e => { setMotDePasse(e.target.value); setError(''); }} disabled={loading} />
            </div>
            {error && <Erreur message={error} />}
            <Boutons onClose={onClose} loading={loading} libelle="Recevoir le code" />
          </form>
        ) : (
          <form onSubmit={confirmer}>
            <p style={{ fontSize: 13, color: 'var(--c-text)', lineHeight: 1.6, margin: '8px 0 16px' }}>
              Entrez le code reçu par SMS pour confirmer le numéro <strong>{numero}</strong>.
            </p>
            <div className="immo-form-field" style={{ marginBottom: 12 }}>
              <label className="immo-form-label" htmlFor="nr-otp">Code de vérification *</label>
              <input id="nr-otp" className="immo-form-input" type="text" inputMode="numeric" maxLength={6} placeholder="Code à 6 chiffres"
                value={otp} onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); setError(''); }} disabled={loading} autoFocus />
            </div>
            {error && <Erreur message={error} />}
            <Boutons onClose={onClose} loading={loading} libelle="Confirmer" />
          </form>
        )}
      </div>
    </div>
  );
}

function Erreur({ message }: { message: string }) {
  return (
    <div role="alert" style={{
      marginBottom: 12, padding: '8px 12px', background: 'var(--t-red-bg)', border: '1px solid var(--t-red-bd)',
      borderRadius: 8, fontSize: 12, color: 'var(--s-red)',
    }}>{message}</div>
  );
}

function Boutons({ onClose, loading, libelle }: { onClose: () => void; loading: boolean; libelle: string }) {
  return (
    <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
      <button type="button" onClick={onClose} disabled={loading}
        style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: '1px solid var(--c-border)', background: 'var(--c-card)', color: 'var(--c-text)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
        Annuler
      </button>
      <button type="submit" className="btn-submit" disabled={loading}
        style={{ flex: 1, justifyContent: 'center', display: 'flex', alignItems: 'center' }}>
        {loading ? 'Envoi…' : libelle}
      </button>
    </div>
  );
}
