import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWallet, type WalletTransaction } from '../../api/getWallet';
import { postRetrait, type Retrait } from '../../api/postRetrait';
import RetraitRequestModal from './RetraitRequestModal';
import LigneHistorique from './LigneHistorique';
import { COULEUR_TON, estEnCours, infoStatut } from '../../utils/retraitCommercial';
import { useAuth } from '../../context/AuthContext';

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
  const [solde, setSolde]           = useState(0);
  const [transactions, setTrans]    = useState<WalletTransaction[]>([]);
  const [retraits, setRetraits]     = useState<Retrait[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [filterTx, setFilterTx]    = useState<'tous' | 'credits' | 'retraits'>('tous');

  const refresh = useCallback(async () => {
    setLoading(true);
    const [w, t, r] = await Promise.all([
      getWallet.solde('commission_commerciale').catch(() => ({ balance: 0 } as any)),
      getWallet.transactions('commission_commerciale').catch(() => []),
      postRetrait.mesRetraits().catch(() => []),
    ]);
    setSolde(Number(w?.balance ?? 0));
    setTrans(Array.isArray(t) ? t : []);
    setRetraits(Array.isArray(r) ? r : []);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Un virement en cours se termine tout seul (webhook FedaPay) : la liste et le solde suivent sans
  // action ; un échec rend le montant au portefeuille, d'où la relecture du solde.
  const aDesEnCours = retraits.some(r => estEnCours(r.statut));
  useEffect(() => {
    if (!aDesEnCours) return;
    const id = setInterval(async () => {
      const [w, t, r] = await Promise.all([
        getWallet.solde('commission_commerciale').catch(() => null),
        getWallet.transactions('commission_commerciale').catch(() => null),
        postRetrait.mesRetraits().catch(() => null),
      ]);
      if (w) setSolde(Number(w.balance ?? 0));
      if (Array.isArray(t)) setTrans(t);
      if (Array.isArray(r)) setRetraits(r);
    }, 8000);
    return () => clearInterval(id);
  }, [aDesEnCours]);

  const filtered = filterTx === 'credits'
    ? transactions.filter(t => t.type === 'depot')
    : filterTx === 'retraits'
    ? transactions.filter(t => t.type === 'retrait')
    : transactions;

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
        <p style={{ fontSize: '0.8125rem', color: 'var(--c-muted)', margin: '0.25rem 0 0' }}>Solde, retraits & historique</p>
      </div>

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
          {loading ? '—' : formatFcfa(solde)}
        </div>
        <button
          className="btn-submit"
          onClick={() => setShowModal(true)}
          disabled={loading || solde < 500}
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
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {([['tous', 'Tous'], ['credits', 'Crédits'], ['retraits', 'Retraits']] as const).map(([k, l]) => (
            <button key={k} onClick={() => setFilterTx(k)}
              style={{
                padding: '5px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                border: '1px solid',
                background: filterTx === k ? 'var(--c-blue-solid)' : 'transparent',
                color: filterTx === k ? '#fff' : 'var(--c-muted)',
                borderColor: filterTx === k ? 'var(--c-blue)' : 'var(--c-border)',
              }}>
              {l}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--c-muted)', fontSize: 13 }}>Chargement…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--c-muted)', fontSize: 13 }}>
            Aucune transaction pour le moment.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filtered.map((t, i) => <LigneHistorique key={t.id} t={t} premier={i === 0} />)}
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
