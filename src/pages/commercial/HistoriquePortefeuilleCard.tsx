import { useState, useEffect } from 'react';
import { getWallet, type WalletTransaction } from '../../api/getWallet';

function formatFcfa(v: number) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(v)) + ' FCFA';
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function HistoriquePortefeuilleCard() {
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWallet.transactions('commission_commerciale')
      .then(t => setTransactions(Array.isArray(t) ? t : []))
      .catch(() => setTransactions([]))
      .finally(() => setLoading(false));
  }, []);

  const credits = transactions.filter(t => t.type === 'depot');

  return (
    <div className="immo-card">
      <div className="section-header">
        <span className="section-title">Performance & historique</span>
      </div>

      {loading ? (
        <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--c-muted)', fontSize: 13 }}>Chargement…</div>
      ) : credits.length === 0 ? (
        <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--c-muted)', fontSize: 13 }}>
          Aucun crédit pour le moment. Votre premier portefeuille hebdomadaire sera crédité le lundi suivant vos premières validations.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {credits.map((t, i) => {
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
        </div>
      )}
    </div>
  );
}
