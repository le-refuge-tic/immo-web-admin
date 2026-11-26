import { useEffect, useState, type ReactNode } from 'react';
import { retraitsAdmin, type RetraitDetail } from '../../api/retraitsAdmin';
import { apiMessage } from '../../utils/apiMessage';
import { ACTION_LABELS, libelleStatutRetrait } from '../../utils/retraitStatut';

function fmtDate(raw?: string | null) {
  if (!raw) return '—';
  return new Date(raw).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function fmtMontant(n: number | string) {
  return Number(n).toLocaleString('fr-FR') + ' FCFA';
}

function Champ({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
      <div style={{ fontSize: 13, color: 'var(--c-text)', marginTop: 2, wordBreak: 'break-word' }}>{children}</div>
    </div>
  );
}

const nomAdmin = (a: RetraitDetail['journal_actions'][number]['admin']) =>
  a ? [a.prenom, a.nom].filter(Boolean).join(' ') || `Admin #${a.id}` : '—';

/** Détail d'un retrait (GET /retraits/admin/:id) et historique des actions manuelles, en lecture seule. */
export default function RetraitDetailModal({ id, onClose }: { id: number; onClose: () => void }) {
  const [detail, setDetail] = useState<RetraitDetail | null>(null);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    let actif = true;
    retraitsAdmin.detail(id)
      .then(d => { if (actif) setDetail(d); })
      .catch(err => { if (actif) setErreur(apiMessage(err) ?? 'Impossible de charger le détail de ce retrait.'); });
    return () => { actif = false; };
  }, [id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const r = detail;

  return (
    <div className="immo-modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div
        className="immo-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titre-detail-retrait"
        style={{ maxWidth: 960, width: 'calc(100vw - 32px)', maxHeight: 'calc(100vh - 48px)', overflowY: 'auto' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <h2 id="titre-detail-retrait" className="immo-modal-title" style={{ margin: 0, flex: 1 }}>Détail du retrait n° {id}</h2>
          <button type="button" className="btn-cancel" onClick={onClose}>Fermer</button>
        </div>

        {erreur ? (
          <div role="alert" style={{ background: 'var(--t-red-bg)', border: '1px solid var(--t-red-bd)', borderRadius: 8, padding: '10px 16px', fontSize: 13, color: 'var(--s-red)' }}>
            {erreur}
          </div>
        ) : !r ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--c-muted)' }}>Chargement…</div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 20 }}>
              <Champ label="Bénéficiaire">{[r.user?.prenom, r.user?.nom].filter(Boolean).join(' ') || `User #${r.user_id}`}</Champ>
              <Champ label="Montant">{fmtMontant(r.montant)}</Champ>
              <Champ label="Statut">{libelleStatutRetrait(r.statut)}</Champ>
              <Champ label="Numéro">{r.numero_telephone || '—'}</Champ>
              <Champ label="Opérateur">{r.operateur === 'mtn' ? 'MTN' : r.operateur === 'moov' ? 'Moov' : '—'}</Champ>
              <Champ label="Payout FedaPay">{r.fedapay_payout_id ? `#${r.fedapay_payout_id} (${r.fedapay_payout_status ?? '—'})` : 'Aucun'}</Champ>
              <Champ label="Tentatives">{r.nb_tentatives ?? 0}</Champ>
              <Champ label="Demandé le">{fmtDate(r.created_at)}</Champ>
              <Champ label="Traité le">{fmtDate(r.valide_le)}</Champ>
              <Champ label="Recrédité le">{fmtDate(r.rembourse_le)}</Champ>
              {r.motif_echec && <Champ label="Motif d'échec">{r.motif_echec}</Champ>}
              {r.motif_rejet && <Champ label="Motif du rejet">{r.motif_rejet}</Champ>}
              {r.preuve_url && (
                <Champ label="Preuve">
                  <a href={r.preuve_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--s-blue)', fontWeight: 600 }}>Voir la preuve</a>
                </Champ>
              )}
            </div>

            <h3 style={{ fontSize: 14, margin: '0 0 8px' }}>Historique des actions</h3>
            <div className="ut-table-wrap">
              <table className="tableau-lecture" style={{ minWidth: 820 }}>
                <thead>
                  <tr>
                    <th>Date</th><th>Admin</th><th>Action</th><th>Référence</th><th>Moyen</th>
                    <th>Commentaire ou motif</th><th>Statut avant → après</th>
                  </tr>
                </thead>
                <tbody>
                  {r.journal_actions.length === 0 ? (
                    <tr><td colSpan={7} className="ut-state-cell">Aucune action manuelle sur ce retrait.</td></tr>
                  ) : r.journal_actions.map(j => (
                    <tr key={j.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(j.cree_le)}</td>
                      <td>{nomAdmin(j.admin)}</td>
                      <td>{ACTION_LABELS[j.action] ?? j.action}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12, wordBreak: 'break-all' }}>{j.reference || '—'}</td>
                      <td>{j.moyen || '—'}</td>
                      <td style={{ wordBreak: 'break-word' }}>{j.commentaire || '—'}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{libelleStatutRetrait(j.statut_avant)} → {libelleStatutRetrait(j.statut_apres)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
