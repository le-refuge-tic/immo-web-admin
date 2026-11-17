import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWallet, type WalletTransaction } from '../../api/getWallet';
import { postRetrait, type Retrait } from '../../api/postRetrait';
import RetraitRequestModal from './RetraitRequestModal';
import LigneHistorique from './LigneHistorique';
import { COULEUR_TON, estEnCours, infoStatut } from '../../utils/retraitCommercial';
import { useAuth } from '../../context/AuthContext';
import { apiMessage } from '../../utils/apiMessage';
import { ajouterPage, CHOIX_PAR_DEFAUT, filtresPortefeuille, resteAPrendre, suiviEnTete, type ChoixHistorique } from './historiquePagine';

const TYPE_WALLET = 'commission_commerciale';
const PAR_PAGE = 20;

function formatFcfa(v: number) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(v)) + ' FCFA';
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function CommercialPortefeuillePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role_principal ?? user?.role ?? '';
  const dashboardPath = role === 'commercial' ? '/commercial-dashboard' : '/dashboard';
  const estAdmin = role === 'admin' || role === 'super_admin';
  const [solde, setSolde]           = useState(0);
  const [transactions, setTrans]    = useState<WalletTransaction[]>([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [chargementSuite, setChargementSuite] = useState(false);
  const [retraits, setRetraits]     = useState<Retrait[]>([]);
  const [loading, setLoading]       = useState(true);
  // Lot 16 : une erreur de l'API n'est plus jamais affichée comme un solde à 0.
  const [erreur, setErreur]         = useState('');
  const [showModal, setShowModal]   = useState(false);
  // Lot 17 : période, sens et tri appliqués côté serveur (sur tout l'historique, pas seulement la page chargée).
  const [choix, setChoix]           = useState<ChoixHistorique>(CHOIX_PAR_DEFAUT);

  const refresh = useCallback(async () => {
    setLoading(true);
    setErreur('');
    try {
      const [w, h, r] = await Promise.all([
        getWallet.solde(TYPE_WALLET),
        getWallet.historique(TYPE_WALLET, 1, PAR_PAGE, filtresPortefeuille(choix)),
        postRetrait.mesRetraits(),
      ]);
      setSolde(Number(w?.balance ?? 0));
      setTrans(Array.isArray(h?.data) ? h.data : []);
      setTotal(Number(h?.total) || 0);
      setPage(1);
      setRetraits(Array.isArray(r) ? r : []);
    } catch (err) {
      setErreur(apiMessage(err) ?? 'Impossible de charger votre portefeuille. Vérifiez votre connexion et réessayez.');
    } finally {
      setLoading(false);
    }
  }, [choix]);

  const chargerSuite = async () => {
    setChargementSuite(true);
    try {
      const h = await getWallet.historique(TYPE_WALLET, page + 1, PAR_PAGE, filtresPortefeuille(choix));
      setTrans(prev => ajouterPage(prev, Array.isArray(h?.data) ? h.data : []));
      setTotal(Number(h?.total) || 0);
      setPage(p => p + 1);
    } catch (err) {
      setErreur(apiMessage(err) ?? "La suite de l'historique n'a pas pu être chargée.");
    } finally {
      setChargementSuite(false);
    }
  };

  // Chargement différé : les setState arrivent hors du rendu de l'effet.
  useEffect(() => { void Promise.resolve().then(refresh); }, [refresh]);

  // Un virement en cours se termine tout seul (webhook FedaPay) : la liste et le solde suivent sans
  // action ; un échec rend le montant au portefeuille, d'où la relecture du solde.
  const aDesEnCours = retraits.some(r => estEnCours(r.statut));
  useEffect(() => {
    if (!aDesEnCours) return;
    const id = setInterval(async () => {
      // Suivi discret : un échec ponctuel garde l'affichage précédent (pas de faux zéro).
      const [w, h, r] = await Promise.all([
        getWallet.solde(TYPE_WALLET).catch(() => null),
        suiviEnTete(choix) ? getWallet.historique(TYPE_WALLET, 1, PAR_PAGE, filtresPortefeuille(choix)).catch(() => null) : null,
        postRetrait.mesRetraits().catch(() => null),
      ]);
      if (w) setSolde(Number(w.balance ?? 0));
      if (h && Array.isArray(h.data)) { setTrans(prev => ajouterPage(h.data, prev)); setTotal(Number(h.total) || 0); }
      if (Array.isArray(r)) setRetraits(r);
    }, 8000);
    return () => clearInterval(id);
  }, [aDesEnCours, choix]);

  const choisir = (c: Partial<ChoixHistorique>) => setChoix(prev => ({ ...prev, ...c }));

  return (
    <div className="immo-page">
      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <button onClick={() => navigate(dashboardPath)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-muted)', display: 'flex', alignItems: 'center', gap: 4, padding: 0, fontSize: 13 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
          Tableau de bord
        </button>
      </div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--c-text)', margin: 0 }}>Mon portefeuille</h2>
        <p style={{ fontSize: '0.8125rem', color: 'var(--c-muted)', margin: '0.25rem 0 0' }}>
          {estAdmin
            ? 'Vos primes de publication (même grille que les commerciaux), retraits et historique'
            : 'Solde, retraits & historique'}
        </p>
      </div>

      {erreur && (
        <div role="alert" className="immo-card" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderColor: 'var(--c-red)' }}>
          <span style={{ fontSize: 13, color: 'var(--c-red)' }}>{erreur}</span>
          <button type="button" className="btn-cancel" onClick={() => void refresh()}>Réessayer</button>
        </div>
      )}

      {/* Carte solde */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b, #4c1d95)',
        borderRadius: 16, padding: '28px 24px', marginBottom: 24, color: '#fff',
        boxShadow: '0 8px 24px rgba(76,29,149,0.3)',
      }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
          Sommes disponibles
        </div>
        <div style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 20 }}>
          {loading || erreur ? '—' : formatFcfa(solde)}
        </div>
        <button
          className="btn-submit"
          onClick={() => setShowModal(true)}
          disabled={loading || !!erreur || solde < 500}
          style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.3)', boxShadow: 'none' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12l7 7 7-7"/>
          </svg>
          Demander un retrait
        </button>
      </div>

      {/* Mes demandes de retrait : statut en direct, jamais de détail technique */}
      {retraits.length > 0 && (
        <div className="immo-card" style={{ marginBottom: 24 }}>
          <div className="section-header">
            <span className="section-title">Mes demandes de retrait</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }} aria-live="polite">
            {retraits.map(r => {
              const { label, ton } = infoStatut(r.statut);
              const couleur = COULEUR_TON[ton];
              return (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '8px 0', borderTop: '1px solid var(--c-border)' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-text)' }}>{formatFcfa(r.montant)}</div>
                    <div style={{ fontSize: 11, color: 'var(--c-muted)' }}>
                      {formatDate(r.created_at)}{r.numero_masque ? ` · vers ${r.numero_masque}` : ''}{r.operateur ? ` · ${r.operateur === 'mtn' ? 'MTN' : r.operateur === 'moov' ? 'Moov' : r.operateur}` : ''}
                    </div>
                    {ton === 'echec' && r.message && (
                      <div style={{ fontSize: 11, color: 'var(--s-red)', marginTop: 2 }}>{r.message}</div>
                    )}
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, flexShrink: 0,
                    color: couleur, background: `${couleur}18`,
                  }}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Historique transactions */}
      <div className="immo-card">
        <div className="section-header" style={{ marginBottom: 12 }}>
          <span className="section-title">Performance & historique</span>
        </div>

        {/* Filtres */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          {([['tous', 'Tous'], ['credit', 'Crédits'], ['debit', 'Retraits']] as const).map(([k, l]) => (
            <button key={k} type="button" aria-pressed={choix.sens === k} onClick={() => choisir({ sens: k })}
              style={{
                padding: '5px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                border: '1px solid',
                background: choix.sens === k ? 'var(--c-blue-solid)' : 'transparent',
                color: choix.sens === k ? '#fff' : 'var(--c-muted)',
                borderColor: choix.sens === k ? 'var(--c-blue)' : 'var(--c-border)',
              }}>
              {l}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <select className="immo-select" aria-label="Période" value={choix.periode}
            onChange={e => choisir({ periode: e.target.value as ChoixHistorique['periode'] })}>
            <option value="tout">Toute la période</option>
            <option value="7j">7 derniers jours</option>
            <option value="mois">Mois en cours</option>
            <option value="mois_precedent">Mois précédent</option>
          </select>
          <select className="immo-select" aria-label="Trier" value={choix.tri}
            onChange={e => choisir({ tri: e.target.value as ChoixHistorique['tri'] })}>
            <option value="recent">Plus récents d’abord</option>
            <option value="ancien">Plus anciens d’abord</option>
            <option value="montant_desc">Montant décroissant</option>
            <option value="montant_asc">Montant croissant</option>
          </select>
        </div>

        {loading ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--c-muted)', fontSize: 13 }}>Chargement…</div>
        ) : erreur && transactions.length === 0 ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--c-muted)', fontSize: 13 }}>
            Historique indisponible pour le moment.
          </div>
        ) : transactions.length === 0 ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--c-muted)', fontSize: 13 }}>
            {choix === CHOIX_PAR_DEFAUT ? 'Aucune transaction pour le moment.' : 'Aucune transaction pour ces critères.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {transactions.map((t, i) => <LigneHistorique key={t.id} t={t} premier={i === 0} />)}
          </div>
        )}
        {!loading && resteAPrendre(transactions.length, total) && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
            <button type="button" className="btn-cancel" disabled={chargementSuite} onClick={() => void chargerSuite()}>
              {chargementSuite ? 'Chargement…' : `Afficher plus (${transactions.length}/${total})`}
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <RetraitRequestModal
          solde={solde}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); refresh(); }}
        />
      )}
    </div>
  );
}
