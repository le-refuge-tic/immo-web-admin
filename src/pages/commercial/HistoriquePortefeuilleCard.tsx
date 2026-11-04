import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWallet, type WalletTransaction } from '../../api/getWallet';
import LigneHistorique from './LigneHistorique';

export default function HistoriquePortefeuilleCard() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWallet.transactions('commission_commerciale')
      .then(t => setTransactions(Array.isArray(t) ? t : []))
      .catch(() => setTransactions([]))
      .finally(() => setLoading(false));
  }, []);

  const credits = transactions;
  const recent = credits.slice(0, 4);

  return (
    <div className="immo-card">
      <div className="section-header">
        <span className="section-title">Performance & historique</span>
        <button onClick={() => navigate('/portefeuille-commercial')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: 'var(--c-blue)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          VOIR TOUT
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--c-muted)', fontSize: 13 }}>Chargement…</div>
      ) : credits.length === 0 ? (
        <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--c-muted)', fontSize: 13 }}>
          Aucun mouvement pour le moment. Chaque bien validé est crédité dès sa validation, avec le détail du calcul.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {recent.map((t, i) => <LigneHistorique key={t.id} t={t} premier={i === 0} />)}
          {credits.length > 4 && (
            <button onClick={() => navigate('/portefeuille-commercial')}
              style={{ marginTop: 10, padding: '8px 0', background: 'none', border: '1px solid var(--c-border)', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--c-blue)', width: '100%' }}>
              Voir tout l'historique ({credits.length})
            </button>
          )}
        </div>
      )}
    </div>
  );
}
