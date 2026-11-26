import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { apiMessage } from '../../utils/apiMessage';
import { useAuth } from '../../context/AuthContext';
import { refreshSidebarBadges } from '../../hooks/useSidebarBadges';
import { retraitsAdmin, type RetraitAdmin, type SoldeFedaPay } from '../../api/retraitsAdmin';
import {
  FILTRES,
  correspondAuFiltre,
  estEnCours,
  totalAttenteFonds,
  type FiltreRetrait,
} from '../../utils/retraitStatut';
import RetraitItem from './RetraitItem';
import { fmtMontant } from './retraitFormat';
import './retraits.css';

const RAFRAICHISSEMENT_MS = 15_000;

export default function RetraitsPage() {
  const { user } = useAuth();
  const role = user?.role_principal ?? user?.role;
  const estAdmin = !!user && ['admin', 'super_admin'].includes(role);
  const estSuperAdmin = role === 'super_admin';

  const [retraits, setRetraits]       = useState<RetraitAdmin[]>([]);
  const [loading, setLoading]         = useState(true);
  const [filtre, setFiltre]           = useState<FiltreRetrait>('a_traiter');
  const [actionId, setActionId]       = useState<number | null>(null);
  const [solde, setSolde]             = useState<SoldeFedaPay | null>(null);
  const [soldeErreur, setSoldeErreur] = useState(false);
  const [soldeLoading, setSoldeLoading] = useState(true);
  const [toast, setToast]             = useState<{ msg: string; ok: boolean } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const showToast = useCallback((msg: string, ok = true) => {
    setToast({ msg, ok });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 5000);
  }, []);

  const load = useCallback(async (silencieux = false) => {
    if (!silencieux) setLoading(true);
    try {
      setRetraits(await retraitsAdmin.lister());
    } catch {
      if (!silencieux) showToast('Erreur lors du chargement', false);
    } finally {
      if (!silencieux) setLoading(false);
    }
  }, [showToast]);

  const chargerSolde = useCallback(async () => {
    setSoldeLoading(true);
    try {
      setSolde(await retraitsAdmin.soldeFedaPay());
      setSoldeErreur(false);
    } catch {
      setSolde(null);
      setSoldeErreur(true);
    } finally {
      setSoldeLoading(false);
    }
  }, []);

  // Premier chargement (liste et solde FedaPay) ; les états « loading » démarrent à vrai.
  useEffect(() => {
    if (!estAdmin) return;
    let actif = true;
    retraitsAdmin.lister()
      .then(liste => { if (actif) setRetraits(liste); })
      .catch(() => { if (actif) showToast('Erreur lors du chargement', false); })
      .finally(() => { if (actif) setLoading(false); });
    retraitsAdmin.soldeFedaPay()
      .then(s => { if (actif) { setSolde(s); setSoldeErreur(false); } })
      .catch(() => { if (actif) { setSolde(null); setSoldeErreur(true); } })
      .finally(() => { if (actif) setSoldeLoading(false); });
    return () => { actif = false; };
  }, [estAdmin, showToast]);

  // Les virements en cours se terminent tout seuls (webhook FedaPay) : l'écran suit sans action.
  const aDesEnCours = retraits.some(r => estEnCours(r.statut));
  useEffect(() => {
    if (!estAdmin || !aDesEnCours) return;
    const id = setInterval(() => { load(true); }, RAFRAICHISSEMENT_MS);
    return () => clearInterval(id);
  }, [estAdmin, aDesEnCours, load]);

  const compteurs = useMemo(() => {
    const parFiltre = {} as Record<FiltreRetrait, number>;
    for (const f of FILTRES) parFiltre[f.cle] = retraits.filter(r => correspondAuFiltre(r.statut, f.cle)).length;
    return parFiltre;
  }, [retraits]);

  const visibles = useMemo(() => retraits.filter(r => correspondAuFiltre(r.statut, filtre)), [retraits, filtre]);
  const aCouvrir = totalAttenteFonds(retraits);
  const fondsInsuffisants = solde !== null && aCouvrir > 0 && solde.disponible < aCouvrir;

  const aTraiter = useMemo(() => retraits.filter(r => correspondAuFiltre(r.statut, 'a_traiter')), [retraits]);
  const montantATraiter = aTraiter.reduce((t, r) => t + Number(r.montant), 0);

  /** Lance une action serveur ; renvoie vrai en cas de succès pour que la ligne referme ses panneaux. */
  const executer = async (id: number, action: () => Promise<unknown>, succes: string, erreur: string) => {
    setActionId(id);
    try {
      await action();
      showToast(succes);
      await load(true);
      chargerSolde();
      return true;
    } catch (e) {
      showToast(apiMessage(e) ?? erreur, false);
      return false;
    } finally {
      setActionId(null);
      refreshSidebarBadges();
    }
  };

  const relancer = (id: number) =>
    executer(id, () => retraitsAdmin.relancer(id), 'Retrait relancé : nouveau payout envoyé à FedaPay', 'Impossible de relancer ce retrait');
  const resynchroniser = (id: number) =>
    executer(id, () => retraitsAdmin.resynchroniser(id), 'Statut relu depuis FedaPay', 'Impossible de relire le statut chez FedaPay');
  const marquerEnvoye = (id: number, preuve: File | null) =>
    executer(id, () => retraitsAdmin.marquerEnvoye(id, preuve), 'Retrait marqué comme envoyé (secours)', "Impossible de marquer ce retrait comme envoyé");
  const rejeter = (id: number, motif: string) =>
    executer(id, () => retraitsAdmin.rejeter(id, motif), 'Retrait rejeté et remboursé (secours)', 'Impossible de rejeter ce retrait');

  if (!estAdmin) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--c-muted)' }}>
        <p style={{ fontSize: 18, fontWeight: 600 }}>Accès réservé aux administrateurs</p>
      </div>
    );
  }

  const soldeTexte = soldeLoading && !solde ? '…' : solde ? fmtMontant(solde.disponible) : 'Indisponible';

  return (
    <>
      <div className="immo-topbar">
        <div className="immo-topbar-title">
          <h1>Retraits</h1>
          <p>Virements Mobile Money automatiques (FedaPay). Cette page sert à superviser et à relancer, pas à valider.</p>
        </div>
      </div>

      <div className="immo-page rt-page">
        {toast && (
          <div role="status" className={`rt-toast ${toast.ok ? 'rt-toast-ok' : 'rt-toast-err'}`}>{toast.msg}</div>
        )}

        <section className="rt-summary" aria-label="Synthèse des retraits">
          <div className={`rt-tile rt-tile-solde ${soldeErreur || fondsInsuffisants ? 'rt-tile-alert' : ''}`}>
            <div className="rt-tile-head">
              <span className="rt-label">Solde FedaPay disponible</span>
              <button type="button" className="rt-link-btn" onClick={chargerSolde} disabled={soldeLoading}>
                {soldeLoading ? 'Actualisation…' : 'Actualiser'}
              </button>
            </div>
            <div className="rt-tile-value">{soldeTexte}</div>
            {soldeErreur && <div className="rt-tile-note">Impossible de lire le solde chez FedaPay pour le moment.</div>}
            {!soldeErreur && aCouvrir > 0 && (
              <div className="rt-tile-note">
                {fmtMontant(aCouvrir)} en attente de fonds
                {fondsInsuffisants ? ' : approvisionnez le compte FedaPay puis relancez les demandes.' : '.'}
              </div>
            )}
          </div>

          <div className="rt-tile">
            <span className="rt-label">À traiter</span>
            <div className="rt-tile-value">{aTraiter.length}</div>
            <div className="rt-tile-note rt-muted">{aTraiter.length ? `${fmtMontant(montantATraiter)} au total` : 'Rien en attente'}</div>
          </div>

          <div className="rt-tile">
            <span className="rt-label">Virements en cours</span>
            <div className="rt-tile-value">{compteurs.en_cours ?? 0}</div>
            <div className="rt-tile-note rt-muted">{aDesEnCours ? 'Mise à jour automatique toutes les 15 s' : 'Aucun virement en vol'}</div>
          </div>
        </section>

        <div className="rt-toolbar">
          <div role="tablist" aria-label="Filtrer les retraits" className="rt-tabs">
            {FILTRES.map(f => (
              <button key={f.cle} type="button" role="tab" aria-selected={filtre === f.cle}
                className={`rt-tab ${filtre === f.cle ? 'is-active' : ''}`} onClick={() => setFiltre(f.cle)}>
                {f.label}
                <span className="rt-tab-count">{compteurs[f.cle] ?? 0}</span>
              </button>
            ))}
          </div>
          <button type="button" className="rt-btn rt-btn-ghost" onClick={() => load()} disabled={loading}>
            {loading ? 'Chargement…' : 'Actualiser la liste'}
          </button>
        </div>

        {loading && retraits.length === 0 ? (
          <div className="rt-empty">Chargement…</div>
        ) : visibles.length === 0 ? (
          <div className="rt-empty">
            {filtre === 'a_traiter' ? 'Aucune demande à traiter : tous les retraits partent automatiquement.' : 'Aucune demande de retrait'}
          </div>
        ) : (
          <div className="rt-list">
            {visibles.map(r => (
              <RetraitItem key={r.id} r={r} estSuperAdmin={estSuperAdmin} occupe={actionId === r.id}
                onRelancer={relancer} onResynchroniser={resynchroniser}
                onMarquerEnvoye={marquerEnvoye} onRejeter={rejeter} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
