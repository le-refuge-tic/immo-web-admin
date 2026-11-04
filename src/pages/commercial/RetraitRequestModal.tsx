import { useState, useEffect, useRef, useCallback, type FormEvent } from 'react';
import { postRetrait } from '../../api/postRetrait';
import { blockInvalidNumberKey } from '../../utils/inputNumbers';
import { apiMessage } from '../../utils/apiMessage';
import {
  RETRAIT_MINIMUM,
  libelleOperateur,
  messageApresDemande,
  messageMontant,
  raisonBlocage,
  type LimitesRetrait,
  type NumeroRetraitInfo,
} from '../../utils/retraitCommercial';
import NumeroRetraitModal from './NumeroRetraitModal';

function formatFcfa(v: number) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(v)) + ' FCFA';
}

function nouvelleCle(): string {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

type Etape = 'saisie' | 'confirmation' | 'resultat';

/**
 * Demande de retrait d'un commercial. Plus de numéro ni de nom de titulaire à saisir : le virement
 * part immédiatement vers le numéro enregistré sur le compte (téléphone vérifié à la première
 * connexion par défaut) et l'opérateur choisi. Une confirmation précède l'envoi.
 */
export default function RetraitRequestModal({ solde, onClose, onSuccess }: {
  solde: number; onClose: () => void; onSuccess: () => void;
}) {
  const [etape, setEtape]       = useState<Etape>('saisie');
  const [montant, setMontant]   = useState('');
  const [info, setInfo]         = useState<NumeroRetraitInfo | null>(null);
  const [limites, setLimites]   = useState<Partial<LimitesRetrait>>({ min: RETRAIT_MINIMUM });
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [resultat, setResultat] = useState<{ ok: boolean; texte: string } | null>(null);
  const [showNumero, setShowNumero] = useState(false);
  // Une clé par demande : rejouée après une coupure, elle ne débite qu'une fois.
  const cle = useRef<{ valeur: string; montant: number } | null>(null);

  const chargerInfo = useCallback(() => {
    postRetrait.numeroRetrait().then(setInfo).catch(() => { /* le serveur tranche à la demande */ });
  }, []);

  useEffect(() => {
    chargerInfo();
    postRetrait.limites().then(setLimites).catch(() => { /* minimum par défaut */ });
  }, [chargerInfo]);

  useEffect(() => {
    const echap = (e: KeyboardEvent) => { if (e.key === 'Escape' && !loading && !showNumero) onClose(); };
    document.addEventListener('keydown', echap);
    return () => document.removeEventListener('keydown', echap);
  }, [onClose, loading, showNumero]);

  const montantNum = Number(montant);
  const montantMessage = messageMontant(montant, solde, limites);
  const blocage = raisonBlocage(info);
  const min = limites.min ?? RETRAIT_MINIMUM;
  const canContinue = !!montant && !montantMessage && !blocage && info !== null;
  const operateur = libelleOperateur(info?.operateur_retrait);

  const envoyer = async () => {
    setLoading(true);
    setError('');
    if (!cle.current || cle.current.montant !== montantNum) cle.current = { valeur: nouvelleCle(), montant: montantNum };
    try {
      const retrait = await postRetrait.demander(montantNum, 'commission_commerciale', cle.current.valeur);
      cle.current = null;
      setResultat(messageApresDemande(retrait));
      setEtape('resultat');
    } catch (err: unknown) {
      // Réponse perdue ou erreur serveur : la demande a pu partir, on garde la même clé pour la rejouer.
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status !== undefined && status < 500) cle.current = null;
      setError(apiMessage(err) ?? 'Impossible de créer la demande de retrait.');
    } finally {
      setLoading(false);
    }
  };

  const soumettre = (e: FormEvent) => {
    e.preventDefault();
    if (canContinue) { setError(''); setEtape('confirmation'); }
  };

  const fermer = () => { if (etape === 'resultat') onSuccess(); else onClose(); };

  const carte = (children: React.ReactNode) => (
    <div role="dialog" aria-modal="true" aria-label={etape === 'confirmation' ? 'Confirmer le retrait' : 'Demande de retrait'} style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }} onClick={loading ? undefined : fermer}>
      <div style={{
        background: 'var(--c-card)', border: '1px solid var(--c-border)', borderRadius: 16,
        padding: '32px 28px', width: '100%', maxWidth: 400, boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
      }} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );

  const alerte = (message: string) => (
    <div role="alert" style={{
      marginTop: 8, marginBottom: 14, padding: '8px 12px',
      background: 'var(--t-red-bg)', border: '1px solid var(--t-red-bd)', borderRadius: 8, fontSize: 12, color: 'var(--s-red)',
    }}>{message}</div>
  );

  if (etape === 'resultat' && resultat) {
    return carte(
      <>
        <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--c-text)', marginBottom: 10 }}>
          {resultat.ok ? 'Demande envoyée' : 'Retrait échoué'}
        </h2>
        <p style={{ fontSize: 13, color: resultat.ok ? 'var(--c-text)' : 'var(--s-red)', lineHeight: 1.6, marginBottom: 20 }}>
          {formatFcfa(montantNum)} : {resultat.texte}
        </p>
        <button className="btn-submit" onClick={fermer} style={{ width: '100%', justifyContent: 'center', display: 'flex' }}>Fermer</button>
      </>,
    );
  }

  if (etape === 'confirmation') {
    const lignes: [string, string][] = [
      ['Montant', formatFcfa(montantNum)],
      ['Numéro Mobile Money', info?.masque || '—'],
      ['Opérateur', operateur || '—'],
      ['Solde après retrait', formatFcfa(solde - montantNum)],
    ];
    return carte(
      <>
        <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--c-text)', marginBottom: 6 }}>Confirmer le retrait</h2>
        <p style={{ fontSize: 12, color: 'var(--c-muted)', marginBottom: 16 }}>Vérifiez les informations : l&apos;argent part immédiatement.</p>
        <dl style={{ border: '1px solid var(--c-border)', borderRadius: 10, margin: '0 0 14px' }}>
          {lignes.map(([k, v], i) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '9px 12px', fontSize: 13, borderTop: i ? '1px solid var(--c-border)' : 'none' }}>
              <dt style={{ color: 'var(--c-muted)' }}>{k}</dt>
              <dd style={{ margin: 0, fontWeight: 700, color: 'var(--c-text)' }}>{v}</dd>
            </div>
          ))}
        </dl>
        <p style={{ fontSize: 11, color: 'var(--c-muted)', marginBottom: 12 }}>
          Une fois envoyé, le virement ne peut pas être annulé. En cas d&apos;échec côté opérateur, le montant est automatiquement remis sur votre portefeuille.
        </p>
        {error && alerte(error)}
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" onClick={() => { setEtape('saisie'); setError(''); }} disabled={loading}
            style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: '1px solid var(--c-border)', background: 'var(--c-card)', color: 'var(--c-text)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
            Modifier
          </button>
          <button type="button" className="btn-submit" onClick={envoyer} disabled={loading}
            style={{ flex: 1, justifyContent: 'center', display: 'flex', alignItems: 'center' }}>
            {loading ? 'Envoi…' : 'Envoyer maintenant'}
          </button>
        </div>
      </>,
    );
  }

  return (
    <>
      {carte(
        <>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--c-text)', marginBottom: 6 }}>Demander un retrait</h2>
          <p style={{ fontSize: 12, color: 'var(--c-muted)', marginBottom: 20 }}>
            Solde disponible : <strong>{formatFcfa(solde)}</strong>
          </p>

          <form onSubmit={soumettre}>
            <div className="immo-form-field" style={{ marginBottom: 8 }}>
              <label className="immo-form-label" htmlFor="retrait-montant">Montant à retirer (FCFA) *</label>
              <input
                id="retrait-montant"
                className="immo-form-input"
                type="number"
                min={min}
                max={solde}
                step={100}
                value={montant}
                onChange={e => { setMontant(e.target.value); setError(''); }}
                onKeyDown={e => blockInvalidNumberKey(e, true)}
                placeholder={`Minimum ${formatFcfa(min)}`}
                aria-invalid={!!montantMessage}
                aria-describedby="retrait-montant-aide"
                autoFocus
                required
              />
            </div>
            <div id="retrait-montant-aide" aria-live="polite" style={{ fontSize: 11, marginBottom: 12, color: montantMessage ? 'var(--s-red)' : 'var(--c-muted)' }}>
              {montantMessage || `Minimum ${formatFcfa(min)}${limites.max && Number.isFinite(limites.max) ? ` · maximum ${formatFcfa(limites.max)}` : ''} · 3 retraits maximum / 24 h vers le même numéro.`}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 12px', border: '1px solid var(--c-border)', borderRadius: 10, marginBottom: 12 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 11, color: 'var(--c-muted)' }}>Envoyé sur</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-text)' }}>
                  {info?.masque || '—'}{operateur ? ` · ${operateur}` : ''}
                </div>
              </div>
              <button type="button" onClick={() => setShowNumero(true)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-blue)', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                {info && !info.operateur_retrait ? 'Choisir mon opérateur' : 'Changer'}
              </button>
            </div>

            {blocage && (
              <div role="alert" style={{ marginBottom: 12, padding: '8px 12px', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, fontSize: 12, color: 'var(--c-text)' }}>
                {blocage}
              </div>
            )}
            {error && alerte(error)}

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button type="button" onClick={onClose}
                style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: '1px solid var(--c-border)', background: 'var(--c-card)', color: 'var(--c-text)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                Annuler
              </button>
              <button type="submit" className="btn-submit" disabled={!canContinue}
                style={{ flex: 1, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 8, opacity: canContinue ? 1 : 0.5 }}>
                Continuer
              </button>
            </div>
          </form>
        </>,
      )}
      {showNumero && <NumeroRetraitModal onClose={() => setShowNumero(false)} onSaved={chargerInfo} />}
    </>
  );
}
