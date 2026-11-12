import { useCallback, useEffect, useRef, useState } from 'react';
import { apiMessage } from '../../utils/apiMessage';
import { useAuth } from '../../context/AuthContext';
import { refreshSidebarBadges } from '../../hooks/useSidebarBadges';
import { remboursementsAdmin, type FileRemboursements, type RemboursementAdmin } from '../../api/remboursementsAdmin';
import {
  FILTRES_REMBOURSEMENT,
  MOTIF_REMBOURSEMENT,
  STATUT_REMBOURSEMENT,
  echeance,
  type FiltreRemboursement,
} from '../../utils/remboursementStatut';
import { ActionsRemboursement } from './ActionsRemboursement';

const PAR_PAGE = 30;

const fcfa = (n: number | string) => Number(n).toLocaleString('fr-FR') + ' FCFA';
const fmtDate = (raw?: string | null) => raw
  ? new Date(raw).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  : '—';
const nomClient = (r: RemboursementAdmin) =>
  [r.client?.prenom, r.client?.nom].filter(Boolean).join(' ') || `Client #${r.client_id}`;

function Badge({ r }: { r: RemboursementAdmin }) {
  const s = STATUT_REMBOURSEMENT[r.statut];
  return (
    <span style={{ padding: '3px 10px', borderRadius: 20, background: s.couleur + '18', color: s.couleur, fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  );
}

function Echeance({ r }: { r: RemboursementAdmin }) {
  const e = echeance(r);
  if (!e) {
    return (
      <span style={{ fontSize: 12, color: 'var(--c-muted)' }}>
        Traité le {fmtDate(r.traite_le)}
        {r.commentaire && <span style={{ display: 'block', wordBreak: 'break-word' }}>{r.statut === 'rembourse' ? 'Réf. ' : 'Motif : '}{r.commentaire}</span>}
      </span>
    );
  }
  return (
    <span style={{ fontSize: 12, fontWeight: e.proche ? 700 : 500, color: e.enRetard ? 'var(--s-red)' : e.proche ? '#d97706' : 'var(--c-text)' }}>
      {e.texte}
      <span style={{ display: 'block', fontWeight: 400, color: 'var(--c-muted)' }}>avant le {fmtDate(r.echeance)}</span>
    </span>
  );
}

function Montants({ r }: { r: RemboursementAdmin }) {
  return (
    <>
      <div style={{ fontWeight: 800, color: 'var(--s-blue)', whiteSpace: 'nowrap' }}>{fcfa(r.montant)}</div>
      <div style={{ fontSize: 11, color: 'var(--c-muted)' }}>{r.pourcentage} % de {fcfa(r.montant_paye)}</div>
    </>
  );
}

function Motif({ r }: { r: RemboursementAdmin }) {
  return (
    <>
      <div style={{ fontSize: 13 }}>{MOTIF_REMBOURSEMENT[r.motif] ?? r.motif}</div>
      <div style={{ fontSize: 11, color: 'var(--c-muted)' }}>
        {r.visite_id ? `Visite #${r.visite_id}` : '—'}{r.transaction ? ` · réf. ${r.transaction.reference.slice(0, 8)}` : ''}
      </div>
    </>
  );
}

export default function RemboursementsPage() {
  const { user } = useAuth();
  const estAdmin = !!user && ['admin', 'super_admin'].includes(user?.role_principal ?? user?.role);

  const [filtre, setFiltre] = useState<FiltreRemboursement>('a_rembourser');
  const [page, setPage] = useState(1);
  const [file, setFile] = useState<FileRemboursements | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const showToast = useCallback((msg: string, ok = true) => {
    setToast({ msg, ok });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 5000);
  }, []);

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      setFile(await remboursementsAdmin.lister({ statut: filtre === 'tous' ? undefined : filtre, page, limit: PAR_PAGE }));
    } catch (e) {
      showToast(apiMessage(e) ?? 'Erreur lors du chargement', false);
    } finally {
      setLoading(false);
    }
  }, [filtre, page, showToast]);

  useEffect(() => {
    if (!estAdmin) return;
    void Promise.resolve().then(charger);
  }, [estAdmin, charger]);

  const executer = async (id: number, action: () => Promise<unknown>, succes: string, erreur: string) => {
    setActionId(id);
    try {
      await action();
      showToast(succes);
      await charger();
      return true;
    } catch (e) {
      showToast(apiMessage(e) ?? erreur, false);
      return false;
    } finally {
      setActionId(null);
      refreshSidebarBadges();
    }
  };
  const actions = (r: RemboursementAdmin) => (
    <ActionsRemboursement
      r={r} occupe={actionId === r.id}
      onVerse={ref => executer(r.id, () => remboursementsAdmin.marquerRembourse(r.id, ref), 'Remboursement marqué versé', 'Impossible de marquer ce remboursement versé')}
      onRejete={motif => executer(r.id, () => remboursementsAdmin.rejeter(r.id, motif), 'Demande de remboursement rejetée', 'Impossible de rejeter cette demande')}
    />
  );

  if (!estAdmin) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--c-muted)' }}>
        <p style={{ fontSize: 18, fontWeight: 600 }}>Accès réservé aux administrateurs</p>
      </div>
    );
  }

  const liste = file?.data ?? [];
  const resume = file?.a_rembourser;
  const pages = file ? Math.max(1, Math.ceil(file.total / PAR_PAGE)) : 1;

  return (
    <>
      <div className="immo-topbar">
        <div className="immo-topbar-title">
          <h1>Remboursements</h1>
          <p>Frais de visite à rendre aux prospects sous 7 jours. Envoyez l&apos;argent par Mobile Money, puis marquez la demande versée.</p>
        </div>
      </div>

      <div className="immo-page">
        {toast && (
          <div role="status" style={{
            position: 'fixed', top: 24, right: 24, zIndex: 9999, background: toast.ok ? '#10b981' : '#ef4444',
            color: '#fff', padding: '12px 20px', borderRadius: 10, fontWeight: 600, fontSize: 14, boxShadow: '0 4px 16px rgba(0,0,0,.2)', maxWidth: 420,
          }}>
            {toast.msg}
          </div>
        )}

        <div className="immo-card" style={{ marginBottom: 20, display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--c-muted)', fontWeight: 600 }}>À rembourser</div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{resume ? fcfa(resume.montant) : '…'}</div>
            <div style={{ fontSize: 12, color: 'var(--c-muted)' }}>{resume ? `${resume.nombre} demande${resume.nombre > 1 ? 's' : ''}` : ''}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--c-muted)', fontWeight: 600 }}>En retard</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: resume?.en_retard ? 'var(--s-red)' : 'var(--c-text)' }}>{resume ? resume.en_retard : '…'}</div>
            <div style={{ fontSize: 12, color: resume?.en_retard ? 'var(--s-red)' : 'var(--c-muted)' }}>
              {resume?.en_retard ? 'Délai de 7 jours dépassé' : 'Aucune échéance dépassée'}
            </div>
          </div>
          <button onClick={() => charger()} disabled={loading} style={{ marginLeft: 'auto', padding: '8px 16px', borderRadius: 8, border: '1px solid var(--c-border)', background: 'var(--c-card)', fontWeight: 600, fontSize: 13, cursor: loading ? 'wait' : 'pointer' }}>
            {loading ? 'Actualisation…' : 'Actualiser'}
          </button>
        </div>

        <div role="tablist" aria-label="Filtrer les remboursements" style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {FILTRES_REMBOURSEMENT.map(f => (
            <button key={f.cle} role="tab" aria-selected={filtre === f.cle} onClick={() => { setFiltre(f.cle); setPage(1); }}
              style={{
                padding: '6px 16px', borderRadius: 20, border: '1.5px solid', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                borderColor: filtre === f.cle ? '#1a3a6b' : 'var(--c-border)',
                background: filtre === f.cle ? '#1a3a6b' : 'var(--c-card)',
                color: filtre === f.cle ? '#fff' : 'var(--c-text)',
              }}>
              {f.label}{f.cle === 'a_rembourser' && resume ? ` (${resume.nombre})` : ''}
            </button>
          ))}
        </div>

        {loading && !file ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--c-muted)' }}>Chargement…</div>
        ) : liste.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--c-muted)', fontSize: 15 }}>
            {filtre === 'a_rembourser' ? 'Aucun remboursement à verser.' : 'Aucune demande de remboursement.'}
          </div>
        ) : (
          <>
            {/* ── Vue tableau (desktop) ── */}
            <div className="ut-desktop-only" style={{ background: 'var(--c-card)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,.06)', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 980 }}>
                <thead>
                  <tr style={{ background: 'var(--c-bg)', borderBottom: '1px solid var(--c-border)' }}>
                    {['Client', 'Montant', 'Mobile Money', 'Motif', 'Échéance', 'Statut', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--c-muted)', fontSize: 12 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {liste.map((r, i) => (
                    <tr key={r.id} style={{ borderBottom: i === liste.length - 1 ? 'none' : '1px solid var(--c-border)', verticalAlign: 'top' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600 }}>{nomClient(r)}</div>
                        <div style={{ color: 'var(--c-muted)', fontSize: 11 }}>demande #{r.id} · {fmtDate(r.created_at)}</div>
                      </td>
                      <td style={{ padding: '14px 16px' }}><Montants r={r} /></td>
                      <td style={{ padding: '14px 16px', fontFamily: 'monospace', letterSpacing: 1 }}>{r.telephone ?? r.client?.telephone ?? '—'}</td>
                      <td style={{ padding: '14px 16px' }}><Motif r={r} /></td>
                      <td style={{ padding: '14px 16px', maxWidth: 220 }}><Echeance r={r} /></td>
                      <td style={{ padding: '14px 16px' }}><Badge r={r} /></td>
                      <td style={{ padding: '14px 16px' }}>{actions(r)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Vue cartes (mobile) ── */}
            <div className="ut-card-list ut-mobile-only">
              {liste.map(r => (
                <div key={r.id} className="ut-card">
                  <div className="ut-card-header">
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{nomClient(r)}</div>
                      <div style={{ fontSize: 11, color: 'var(--c-muted)', marginTop: 2, fontFamily: 'monospace' }}>{r.telephone ?? r.client?.telephone ?? '—'}</div>
                    </div>
                    <Badge r={r} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, margin: '8px 0' }}>
                    <div><Montants r={r} /></div>
                    <div style={{ textAlign: 'right' }}><Echeance r={r} /></div>
                  </div>
                  <div style={{ marginBottom: 10 }}><Motif r={r} /></div>
                  {actions(r)}
                </div>
              ))}
            </div>

            {pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 20 }}>
                <button onClick={() => setPage(p => p - 1)} disabled={page <= 1 || loading} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--c-border)', background: 'var(--c-card)', cursor: 'pointer' }}>Précédent</button>
                <span style={{ fontSize: 13, color: 'var(--c-muted)' }}>Page {page} / {pages}</span>
                <button onClick={() => setPage(p => p + 1)} disabled={page >= pages || loading} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--c-border)', background: 'var(--c-card)', cursor: 'pointer' }}>Suivant</button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
