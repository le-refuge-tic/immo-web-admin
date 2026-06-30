import { useState, useEffect, useCallback } from 'react';
import { CardIcon, TrendingUpIcon, ChevronLeftIcon, ChevronRightIcon } from '../../components/Icons';
import { getTransaction } from '../../api/getTransaction';
import FinancesStatutBadge from './FinancesStatutBadge';

const LIMIT = 15;

const METHODE_LABELS: any = {
  momo:    'MTN MoMo',
  flooz:   'Flooz (Moov)',
  celtiis: 'Celtiis Cash',
};

const TYPE_LABELS: any = {
  frais_visite: 'Frais visite',
  loyer:        'Loyer',
  virement:     'Virement',
};

export default function FinancesPage() {
  const [transactions, setTransactions] = useState([] as any[]);
  const [total, setTotal]               = useState(0);
  const [page, setPage]                 = useState(1);
  const [filtreStat, setFiltreStat]     = useState('');
  const [filtreType, setFiltreType]     = useState('');
  const [loading, setLoading]           = useState(false);
  const [totaux, setTotaux]             = useState({ confirme: 0, en_attente: 0 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getTransaction.list({
        page, limit: LIMIT,
        ...(filtreStat ? { statut: filtreStat } : {}),
        ...(filtreType ? { type: filtreType }   : {}),
      });
      setTransactions(res.data);
      setTotal(res.total);
      setTotaux(res.totaux);
    } finally {
      setLoading(false);
    }
  }, [page, filtreStat, filtreType]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / LIMIT);
  const fmt = (n: number) => n.toLocaleString('fr-FR');

  return (
    <>
      <div className="immo-topbar">
        <div className="immo-topbar-title">
          <h1>Finances & Transactions</h1>
          <p>Historique des paiements et commissions</p>
        </div>
        <div className="immo-spacer" />
        <select className="immo-select" value={filtreStat}
          onChange={(e) => { setFiltreStat(e.target.value); setPage(1); }}>
          <option value="">Tous les statuts</option>
          <option value="confirme">Confirmé</option>
          <option value="en_attente">En attente</option>
          <option value="echoue">Échoué</option>
          <option value="rembourse">Remboursé</option>
        </select>
        <select className="immo-select" style={{ marginLeft: 8 }} value={filtreType}
          onChange={(e) => { setFiltreType(e.target.value); setPage(1); }}>
          <option value="">Tous les types</option>
          <option value="loyer">Loyer</option>
          <option value="frais_visite">Frais visite</option>
          <option value="virement">Virement</option>
        </select>
      </div>

      <div className="immo-page">
        <div className="mod-stat-cards">
          <div className="mod-stat-card">
            <div>
              <div className="mod-stat-label">Total confirmé</div>
              <div className="mod-stat-value" style={{ fontSize: 20 }}>
                {fmt(totaux.confirme)} <span style={{ fontSize: 12, fontWeight: 400 }}>FCFA</span>
              </div>
            </div>
            <div className="mod-stat-icon"><TrendingUpIcon size={24} /></div>
          </div>
          <div className="mod-stat-card">
            <div>
              <div className="mod-stat-label">En attente</div>
              <div className="mod-stat-value" style={{ fontSize: 20 }}>
                {fmt(totaux.en_attente)} <span style={{ fontSize: 12, fontWeight: 400 }}>FCFA</span>
              </div>
            </div>
            <div className="mod-stat-icon"><CardIcon size={24} /></div>
          </div>
        </div>

        <div className="immo-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="mod-table-header" style={{ gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr 1fr' }}>
            <span className="mod-table-col">Référence</span>
            <span className="mod-table-col">Type</span>
            <span className="mod-table-col">Montant</span>
            <span className="mod-table-col">Méthode</span>
            <span className="mod-table-col">Statut</span>
            <span className="mod-table-col">Date</span>
          </div>

          {loading ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--c-muted)' }}>Chargement…</div>
          ) : transactions.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--c-muted)' }}>Aucune transaction trouvée.</div>
          ) : transactions.map((t: any) => (
            <div className="mod-row" key={t.id} style={{ gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr 1fr' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 12, fontFamily: 'monospace' }}>
                  {t.reference.slice(0, 8).toUpperCase()}…
                </div>
                <div style={{ fontSize: 11, color: 'var(--c-muted)' }}>#{t.id}</div>
              </div>
              <div style={{ fontSize: 13 }}>{TYPE_LABELS[t.type] ?? t.type}</div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>
                {Number(t.montant).toLocaleString('fr-FR')}
                <span style={{ fontSize: 10, fontWeight: 400, marginLeft: 2 }}>FCFA</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--c-muted)' }}>
                {METHODE_LABELS[t.methode_paiement] ?? t.methode_paiement}
              </div>
              <div><FinancesStatutBadge statut={t.statut} /></div>
              <div style={{ fontSize: 12, color: 'var(--c-muted)' }}>
                {new Date(t.created_at).toLocaleDateString('fr-FR')}
              </div>
            </div>
          ))}

          <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--c-border)' }}>
            <span style={{ fontSize: 12, color: 'var(--c-muted)' }}>
              {total === 0 ? '0 résultat' : `${(page - 1) * LIMIT + 1}–${Math.min(page * LIMIT, total)} sur ${total}`}
            </span>
            <div className="immo-pagination">
              <button className="page-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeftIcon /></button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                <button key={p} className={`page-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
              ))}
              <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}><ChevronRightIcon /></button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
