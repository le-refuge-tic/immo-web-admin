import { useState, useEffect, useCallback } from 'react';
import { AlertIcon, FileTextIcon, ChevronLeftIcon, ChevronRightIcon } from '../../components/Icons';
import { adminApi } from '../../api/admin.api';
import type { Loyer, StatutLoyer } from '../../types';

const LIMIT = 15;

const STATUT_LABELS: Record<StatutLoyer, string> = {
  en_attente: 'En attente',
  en_retard:  'En retard',
  paye:       'Payé',
  impaye:     'Impayé',
};

const STATUT_COLORS: Record<StatutLoyer, string> = {
  en_attente: '#2563EB',
  en_retard:  '#DC2626',
  paye:       '#16A34A',
  impaye:     '#9333EA',
};

function StatutBadge({ statut }: { statut: StatutLoyer }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
      background: STATUT_COLORS[statut] + '18',
      color: STATUT_COLORS[statut],
      textTransform: 'uppercase', letterSpacing: '0.5px',
    }}>
      {STATUT_LABELS[statut]}
    </span>
  );
}

export default function LoyersPage() {
  const [loyers, setLoyers]       = useState<Loyer[]>([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [filtre, setFiltre]       = useState<StatutLoyer | ''>('');
  const [escaladeOnly, setEscalade] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [totalRetard, setTotalRetard] = useState(0);
  const [totalEscalade, setTotalEscalade] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [res, retard, escalade] = await Promise.all([
        adminApi.getLoyers({
          page, limit: LIMIT,
          ...(filtre ? { statut: filtre } : {}),
          ...(escaladeOnly ? { escalade: 'true' } : {}),
        }),
        adminApi.getLoyers({ statut: 'en_retard', limit: 1, page: 1 }),
        adminApi.getLoyers({ escalade: 'true',   limit: 1, page: 1 }),
      ]);
      setLoyers(res.data);
      setTotal(res.total);
      setTotalRetard(retard.total);
      setTotalEscalade(escalade.total);
    } finally {
      setLoading(false);
    }
  }, [page, filtre, escaladeOnly]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / LIMIT);

  const formatMois = (iso: string) =>
    new Date(iso).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('fr-FR');

  return (
    <>
      {/* Topbar */}
      <div className="immo-topbar">
        <div className="immo-topbar-title">
          <h1>Gestion des Loyers</h1>
          <p>Suivi des paiements et retards</p>
        </div>
        <div className="immo-spacer" />

        {/* Filtres */}
        <select
          className="immo-select"
          value={filtre}
          onChange={(e) => { setFiltre(e.target.value as StatutLoyer | ''); setPage(1); }}
        >
          <option value="">Tous les statuts</option>
          <option value="en_attente">En attente</option>
          <option value="en_retard">En retard</option>
          <option value="paye">Payé</option>
          <option value="impaye">Impayé</option>
        </select>

        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--c-text)', marginLeft: 12, cursor: 'pointer' }}>
          <input type="checkbox" checked={escaladeOnly} onChange={(e) => { setEscalade(e.target.checked); setPage(1); }} />
          Escaladés uniquement
        </label>
      </div>

      <div className="immo-page">
        {/* Stat cards */}
        <div className="mod-stat-cards">
          <div className="mod-stat-card urgent">
            <div>
              <div className="mod-stat-label">En retard</div>
              <div className="mod-stat-value">{totalRetard}</div>
            </div>
            <div className="mod-stat-icon"><AlertIcon size={24} /></div>
          </div>
          <div className="mod-stat-card">
            <div>
              <div className="mod-stat-label">Escaladés admin</div>
              <div className="mod-stat-value">{totalEscalade}</div>
            </div>
            <div className="mod-stat-icon"><FileTextIcon size={24} /></div>
          </div>
        </div>

        {/* Table */}
        <div className="immo-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="mod-table-header" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 80px' }}>
            <span className="mod-table-col">Mois</span>
            <span className="mod-table-col">Montant</span>
            <span className="mod-table-col">Échéance</span>
            <span className="mod-table-col">Statut</span>
            <span className="mod-table-col">Retard</span>
            <span className="mod-table-col">Escalade</span>
          </div>

          {loading ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--c-muted)' }}>Chargement…</div>
          ) : loyers.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--c-muted)' }}>Aucun loyer trouvé.</div>
          ) : loyers.map((l) => (
            <div className="mod-row" key={l.id} style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 80px' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{formatMois(l.mois)}</div>
                <div style={{ fontSize: 11, color: 'var(--c-muted)' }}>Contrat #{l.contrat_id}</div>
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--c-text)' }}>
                {Number(l.montant).toLocaleString('fr-FR')} <span style={{ fontSize: 11, fontWeight: 400 }}>FCFA</span>
              </div>
              <div style={{ fontSize: 13 }}>{formatDate(l.date_echeance)}</div>
              <div><StatutBadge statut={l.statut} /></div>
              <div style={{ fontSize: 13, color: l.jours_retard > 0 ? '#DC2626' : 'var(--c-muted)' }}>
                {l.jours_retard > 0 ? `${l.jours_retard}j` : '—'}
              </div>
              <div style={{ textAlign: 'center' }}>
                {l.escalade_admin ? (
                  <span style={{ fontSize: 11, background: '#FEF2F2', color: '#DC2626', padding: '2px 6px', borderRadius: 6, fontWeight: 700 }}>OUI</span>
                ) : (
                  <span style={{ color: 'var(--c-muted)', fontSize: 12 }}>—</span>
                )}
              </div>
            </div>
          ))}

          {/* Pagination */}
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
