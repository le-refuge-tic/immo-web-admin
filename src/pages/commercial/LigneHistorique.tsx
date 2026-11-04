import { useState } from 'react';
import type { WalletTransaction } from '../../api/getWallet';
import { expliquerMouvement, formatFcfa, type GenreMouvement } from './historiquePortefeuille';

const BADGE: Record<GenreMouvement, string> = {
  prime: 'badge-active', resultat: 'badge-active', regularisation: 'badge-active', bonus: 'badge-warning', remboursement: 'badge-active', credit: 'badge-active', retrait: 'badge-danger',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/** Une ligne de l'historique du portefeuille : titre, montant, et détail du calcul dépliable. */
export default function LigneHistorique({ t, premier }: { t: WalletTransaction; premier: boolean }) {
  const e = expliquerMouvement(t);
  const [ouvert, setOuvert] = useState(false);
  const idDetail = `detail-mvt-${t.id}`;
  return (
    <div style={{ padding: '0.75rem 0', borderTop: premier ? 'none' : '1px solid var(--c-border)' }}>
      <button type="button" onClick={() => setOuvert(o => !o)} aria-expanded={ouvert} aria-controls={idDetail}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, width: '100%', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', color: 'inherit', font: 'inherit' }}>
        <span style={{ minWidth: 0 }}>
          <span style={{ display: 'block', fontWeight: 600, fontSize: 13, color: 'var(--c-text)' }}>{e.titre}</span>
          <span style={{ display: 'block', fontSize: 11, color: 'var(--c-muted)', marginTop: 2 }}>
            {formatDate(t.created_at)} · {ouvert ? 'Masquer le détail' : 'Voir le détail'}
          </span>
        </span>
        <span className={`immo-badge ${BADGE[e.genre]}`} style={{ flexShrink: 0 }}>
          {e.montant < 0 ? '−' : '+'}{formatFcfa(Math.abs(e.montant))}
        </span>
      </button>
      {ouvert && (
        <ul id={idDetail} style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 12, lineHeight: 1.6, color: 'var(--c-muted)' }}>
          {e.details.map(d => <li key={d}>{d}</li>)}
        </ul>
      )}
    </div>
  );
}
