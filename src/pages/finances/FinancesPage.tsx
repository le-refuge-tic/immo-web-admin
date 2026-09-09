import { useState, useEffect, useCallback } from 'react';
import { CardIcon, TrendingUpIcon, ChevronLeftIcon, ChevronRightIcon } from '../../components/Icons';
import { getTransaction } from '../../api/getTransaction';
import { getFraisVisite } from '../../api/getFraisVisite';
import FinancesStatutBadge from './FinancesStatutBadge';

const LIMIT = 15;

const METHODE_LABELS: any = {
  momo:    'MTN MoMo',
  flooz:   'Flooz (Moov)',
  celtiis: 'Celtiis Cash',
  fedapay: 'FedaPay',
};

const TYPE_LABELS: any = {
  frais_visite: 'Frais visite',
  loyer:        'Loyer',
  integration:  "Paiement d'intégration",
  depot_wallet: 'Rechargement wallet',
  virement:     'Virement',
};

const fmtDateHeure = (raw: string) => {
  const d = new Date(raw);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const nomPartie = (p: any) => (p ? `${p.prenom ?? ''} ${p.nom ?? ''}`.trim() || '—' : '—');

const TYPE_BIEN_LABELS: any = {
  maison:        'Maison',
  appart_vide:   'Appartement vide',
  appart_meuble: 'Appartement meublé',
  guesthouse:    'Guesthouse',
  terrain:       'Terrain',
};

export default function FinancesPage() {
  const [transactions, setTransactions] = useState([] as any[]);
  const [total, setTotal]               = useState(0);
  const [page, setPage]                 = useState(1);
  const [filtreStat, setFiltreStat]     = useState('');
  const [filtreType, setFiltreType]     = useState('');
  const [loading, setLoading]           = useState(false);
  const [totaux, setTotaux]             = useState({ confirme: 0, en_attente: 0 });

  // Frais de visite (revenus du refuge / plateforme)
  const [fvItems, setFvItems]           = useState([] as any[]);
  const [fvTotalEncaisse, setFvTotal]   = useState(0);
  const [fvCount, setFvCount]           = useState(0);
  const [fvPage, setFvPage]             = useState(1);
  const [fvLoading, setFvLoading]       = useState(false);

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

  const loadFraisVisite = useCallback(async () => {
    setFvLoading(true);
    try {
      const res = await getFraisVisite.list({ page: fvPage, limit: LIMIT });
      setFvItems(res.data);
      setFvCount(res.total);
      setFvTotal(res.total_encaisse ?? 0);
    } finally {
      setFvLoading(false);
    }
  }, [fvPage]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadFraisVisite(); }, [loadFraisVisite]);

  const totalPages = Math.ceil(total / LIMIT);
  const fvTotalPages = Math.ceil(fvCount / LIMIT);
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
          <option value="integration">Paiement d'intégration</option>
          <option value="depot_wallet">Rechargement wallet</option>
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
          <div className="mod-stat-card">
            <div>
              <div className="mod-stat-label">Frais de visite (refuge)</div>
              <div className="mod-stat-value" style={{ fontSize: 20 }}>
                {fmt(fvTotalEncaisse)} <span style={{ fontSize: 12, fontWeight: 400 }}>FCFA</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--c-muted)', marginTop: 2 }}>
                {fvCount} paiement{fvCount > 1 ? 's' : ''}
              </div>
            </div>
            <div className="mod-stat-icon"><TrendingUpIcon size={24} /></div>
          </div>
        </div>

        {/* ── Frais de visite : liste détaillée (revenus du refuge) ── */}
        <div className="immo-card" style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--c-border)' }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Frais de visite encaissés</div>
            <div style={{ fontSize: 12, color: 'var(--c-muted)' }}>
              Paiements reversés au refuge — total confirmé : {fmt(fvTotalEncaisse)} FCFA
            </div>
          </div>

          <div className="mod-table-header" style={{ gridTemplateColumns: '1.2fr 1.2fr 1fr 1fr 1fr' }}>
            <span className="mod-table-col">Client</span>
            <span className="mod-table-col">Bien</span>
            <span className="mod-table-col">Montant</span>
            <span className="mod-table-col">Statut</span>
            <span className="mod-table-col">Date</span>
          </div>

          {fvLoading ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--c-muted)' }}>Chargement…</div>
          ) : fvItems.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--c-muted)' }}>Aucun frais de visite enregistré.</div>
          ) : fvItems.map((t: any) => (
            <div className="mod-row" key={t.id} style={{ gridTemplateColumns: '1.2fr 1.2fr 1fr 1fr 1fr' }}>
              <div style={{ fontSize: 13 }}>
                {t.client ? `${t.client.prenom} ${t.client.nom}` : '—'}
              </div>
              <div style={{ fontSize: 12 }}>
                <div>{t.bien ? (TYPE_BIEN_LABELS[t.bien.type] ?? t.bien.type) : '—'}</div>
                {t.bien && (t.bien.quartier || t.bien.ville) && (
                  <div style={{ fontSize: 11, color: 'var(--c-muted)' }}>
                    {[t.bien.quartier, t.bien.ville].filter(Boolean).join(', ')}
                  </div>
                )}
              </div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>
                {Number(t.montant).toLocaleString('fr-FR')}
                <span style={{ fontSize: 10, fontWeight: 400, marginLeft: 2 }}>FCFA</span>
              </div>
              <div><FinancesStatutBadge statut={t.statut} /></div>
              <div style={{ fontSize: 12, color: 'var(--c-muted)' }}>
                {fmtDateHeure(t.date)}
              </div>
            </div>
          ))}

          <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--c-border)' }}>
            <span style={{ fontSize: 12, color: 'var(--c-muted)' }}>
              {fvCount === 0 ? '0 résultat' : `${(fvPage - 1) * LIMIT + 1}–${Math.min(fvPage * LIMIT, fvCount)} sur ${fvCount}`}
            </span>
            <div className="immo-pagination">
              <button className="page-btn" disabled={fvPage <= 1} onClick={() => setFvPage((p) => p - 1)}><ChevronLeftIcon /></button>
              {Array.from({ length: Math.min(fvTotalPages, 5) }, (_, i) => i + 1).map((p) => (
                <button key={p} className={`page-btn ${fvPage === p ? 'active' : ''}`} onClick={() => setFvPage(p)}>{p}</button>
              ))}
              <button className="page-btn" disabled={fvPage >= fvTotalPages} onClick={() => setFvPage((p) => p + 1)}><ChevronRightIcon /></button>
            </div>
          </div>
        </div>

        <div className="immo-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="mod-table-header" style={{ gridTemplateColumns: '1.4fr 1fr 1.4fr 1fr 1fr 1fr 1.2fr' }}>
            <span className="mod-table-col">Référence</span>
            <span className="mod-table-col">Type</span>
            <span className="mod-table-col">Payeur → Bénéficiaire</span>
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
            <div className="mod-row" key={t.id} style={{ gridTemplateColumns: '1.4fr 1fr 1.4fr 1fr 1fr 1fr 1.2fr' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 12, fontFamily: 'monospace' }}>
                  {t.reference.slice(0, 8).toUpperCase()}…
                </div>
                <div style={{ fontSize: 11, color: 'var(--c-muted)' }}>#{t.id}</div>
              </div>
              <div style={{ fontSize: 13 }}>{TYPE_LABELS[t.type] ?? t.type}</div>
              <div style={{ fontSize: 12 }}>
                <div style={{ color: 'var(--c-text)' }}>{nomPartie(t.payeur)}</div>
                <div style={{ fontSize: 11, color: 'var(--c-muted)' }}>→ {nomPartie(t.beneficiaire)}</div>
              </div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>
                {Number(t.montant).toLocaleString('fr-FR')}
                <span style={{ fontSize: 10, fontWeight: 400, marginLeft: 2 }}>FCFA</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--c-muted)' }}>
                {METHODE_LABELS[t.methode_paiement] ?? t.methode_paiement}
              </div>
              <div><FinancesStatutBadge statut={t.statut} /></div>
              <div style={{ fontSize: 12, color: 'var(--c-muted)' }}>
                {fmtDateHeure(t.created_at)}
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
