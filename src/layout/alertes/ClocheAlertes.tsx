import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { alertesApi, type Alerte } from '../../api/alertesApi';
import { useToast } from '../../context/ToastContext';
import { apiMessage } from '../../utils/apiMessage';
import { EVENEMENT_ALERTES, lienAlerte, toastPourAlerte, type EvenementAlerte } from './alertes';

const AFFICHEES = 20;

const quand = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

/**
 * Lot 8 — cloche des alertes de l'administration : décisions sur les annonces du commercial,
 * biens à valider et modifications en attente pour les admins. Une décision qui arrive
 * pendant la session s'annonce aussi par un toast.
 */
export default function ClocheAlertes({ estAdmin }: { estAdmin: boolean }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [nonLues, setNonLues] = useState(0);
  const [ouvert, setOuvert] = useState(false);
  const [alertes, setAlertes] = useState<Alerte[] | null>(null);
  const [erreur, setErreur] = useState('');
  const racine = useRef<HTMLDivElement>(null);

  const ouvertRef = useRef(ouvert);
  useEffect(() => { ouvertRef.current = ouvert; }, [ouvert]);

  const compter = useCallback(() => { alertesApi.compter().then(setNonLues).catch(() => {}); }, []);
  const charger = useCallback(() => {
    setErreur('');
    alertesApi.lister()
      .then(l => setAlertes(l.slice(0, AFFICHEES)))
      .catch(err => setErreur(apiMessage(err) ?? 'Impossible de charger les alertes.'));
  }, []);

  useEffect(() => {
    void Promise.resolve().then(compter);
    const surAlerte = (e: Event) => {
      const detail = (e as CustomEvent<EvenementAlerte>).detail;
      compter();
      if (ouvertRef.current) charger();
      const t = toastPourAlerte(detail);
      if (t) toast(t.message, t.ton);
    };
    window.addEventListener(EVENEMENT_ALERTES, surAlerte);
    return () => window.removeEventListener(EVENEMENT_ALERTES, surAlerte);
  }, [compter, charger, toast]);

  // Fermeture au clic extérieur et à Échap.
  useEffect(() => {
    if (!ouvert) return;
    const dehors = (e: MouseEvent) => { if (!racine.current?.contains(e.target as Node)) setOuvert(false); };
    const echap = (e: KeyboardEvent) => { if (e.key === 'Escape') setOuvert(false); };
    document.addEventListener('mousedown', dehors);
    document.addEventListener('keydown', echap);
    return () => { document.removeEventListener('mousedown', dehors); document.removeEventListener('keydown', echap); };
  }, [ouvert]);

  const basculer = () => {
    const suivant = !ouvert;
    setOuvert(suivant);
    if (suivant) charger();
  };

  const ouvrir = (a: Alerte) => {
    if (!a.lu) {
      setAlertes(l => l?.map(x => (x.id === a.id ? { ...x, lu: true } : x)) ?? l);
      setNonLues(n => Math.max(0, n - 1));
      alertesApi.lire(a.id).catch(() => compter());
    }
    const lien = lienAlerte(a, estAdmin);
    if (lien) { setOuvert(false); navigate(lien); }
  };

  const toutLire = () => {
    setAlertes(l => l?.map(x => ({ ...x, lu: true })) ?? l);
    setNonLues(0);
    alertesApi.toutLire().catch(() => compter());
  };

  return (
    <div ref={racine} style={{ position: 'relative' }}>
      <button type="button" className="immo-toggle-btn" onClick={basculer} aria-expanded={ouvert} aria-haspopup="dialog"
        aria-label={nonLues ? `Alertes, ${nonLues} non lue${nonLues > 1 ? 's' : ''}` : 'Alertes'} title="Alertes"
        style={{ position: 'relative' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {nonLues > 0 && (
          <span aria-hidden="true" style={{ position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, padding: '0 4px', borderRadius: 8, background: 'var(--c-red)', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {nonLues > 99 ? '99+' : nonLues}
          </span>
        )}
      </button>
      {ouvert && (
        <div role="dialog" aria-label="Alertes" style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 'min(360px, 90vw)', maxHeight: 440, overflowY: 'auto', zIndex: 50, background: 'var(--c-card)', border: '1px solid var(--c-border)', borderRadius: 12, boxShadow: '0 12px 32px rgba(0,0,0,0.18)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid var(--c-border)' }}>
            <strong style={{ fontSize: 13, color: 'var(--c-text)' }}>Alertes</strong>
            {nonLues > 0 && <button type="button" onClick={toutLire}
              style={{ all: 'unset', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--c-blue-solid)', whiteSpace: 'nowrap' }}>Tout marquer comme lu</button>}
          </div>
          {erreur ? (
            <p role="alert" style={{ padding: 14, fontSize: 12, color: 'var(--c-red)', margin: 0 }}>{erreur}</p>
          ) : alertes === null ? (
            <p style={{ padding: 14, fontSize: 12, color: 'var(--c-muted)', margin: 0 }}>Chargement…</p>
          ) : alertes.length === 0 ? (
            <p style={{ padding: 14, fontSize: 12, color: 'var(--c-muted)', margin: 0 }}>Aucune alerte.</p>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {alertes.map(a => (
                <li key={a.id}>
                  <button type="button" onClick={() => ouvrir(a)}
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', border: 'none', borderBottom: '1px solid var(--c-border)', background: a.lu ? 'transparent' : 'var(--t-blue-bg)', cursor: 'pointer', color: 'var(--c-text)' }}>
                    <span style={{ display: 'block', fontSize: 12, fontWeight: a.lu ? 500 : 700 }}>{a.titre}</span>
                    {a.corps && <span style={{ display: 'block', fontSize: 12, color: 'var(--c-muted)', marginTop: 2 }}>{a.corps}</span>}
                    <span style={{ display: 'block', fontSize: 10, color: 'var(--c-muted)', marginTop: 4 }}>{quand(a.created_at)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
