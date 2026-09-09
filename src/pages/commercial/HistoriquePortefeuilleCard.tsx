import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWallet, type WalletTransaction } from '../../api/getWallet';

function formatFcfa(v: number) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(v)) + ' FCFA';
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

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

  const credits = transactions.filter(t => t.type === 'depot');
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
          Aucun crédit pour le moment. Votre premier portefeuille hebdomadaire sera crédité le lundi suivant vos premières validations.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {recent.map((t, i) => {
            const isBonus = t.metadata?.type === 'bonus_admin';
            return (
              <div key={t.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.75rem 0', borderTop: i === 0 ? 'none' : '1px solid var(--c-border)', gap: 10,
              }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--c-text)' }}>
                    {isBonus ? 'Bonus' : 'Portefeuille hebdomadaire'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--c-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.description} · {formatDate(t.created_at)}
                  </div>
                </div>
                <span className={`immo-badge ${isBonus ? 'badge-warning' : 'badge-active'}`} style={{ flexShrink: 0 }}>
                  +{formatFcfa(t.amount)}
                </span>
              </div>
            );
          })}
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
