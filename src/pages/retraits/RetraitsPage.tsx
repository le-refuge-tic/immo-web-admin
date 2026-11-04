import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { apiMessage } from '../../utils/apiMessage';
import { useAuth } from '../../context/AuthContext';
import { refreshSidebarBadges } from '../../hooks/useSidebarBadges';
import { retraitsAdmin, type RetraitAdmin, type SoldeFedaPay } from '../../api/retraitsAdmin';
import {
  FILTRES,
  STATUT_COLORS,
  STATUT_LABELS,
  actionsDisponibles,
  correspondAuFiltre,
  estEnCours,
  motifErreur,
  totalAttenteFonds,
  type FiltreRetrait,
} from '../../utils/retraitStatut';

const RAFRAICHISSEMENT_MS = 15_000;

function fmtMontant(n: number | string) {
  return Number(n).toLocaleString('fr-FR') + ' FCFA';
}

function fmtDate(raw?: string | null) {
  if (!raw) return '—';
  return new Date(raw).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function walletLabel(type?: string) {
  switch (type) {
    case 'epargne':                return 'Épargne';
    case 'revenus_locatifs':       return 'Revenus locatifs';
    case 'commission_commerciale': return 'Commission commerciale';
    default:                       return type ?? '—';
  }
}

function libelleOperateur(op?: string | null) {
  return op === 'mtn' ? 'MTN' : op === 'moov' ? 'Moov' : '—';
}

function StatutBadge({ statut }: { statut: string }) {
  const couleur = STATUT_COLORS[statut] ?? '#9ca3af';
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 20,
      background: couleur + '18', color: couleur,
      fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap',
    }}>
      {STATUT_LABELS[statut] ?? statut}
    </span>
  );
}

const btn = (couleur: string, fond: string, inactif: boolean): React.CSSProperties => ({
  padding: '6px 14px', borderRadius: 8, border: 'none', background: fond, color: couleur,
  fontWeight: 600, fontSize: 13, cursor: inactif ? 'not-allowed' : 'pointer', opacity: inactif ? 0.7 : 1,
});

export default function RetraitsPage() {
  const { user } = useAuth();
  const role = user?.role_principal ?? user?.role;
  const estAdmin = !!user && ['admin', 'super_admin'].includes(role);
  const estSuperAdmin = role === 'super_admin';

  const [retraits, setRetraits]       = useState<RetraitAdmin[]>([]);
  const [loading, setLoading]         = useState(true);
  const [filtre, setFiltre]           = useState<FiltreRetrait>('a_traiter');
  const [actionId, setActionId]       = useState<number | null>(null);
  const [relanceId, setRelanceId]     = useState<number | null>(null);
  const [secoursId, setSecoursId]     = useState<number | null>(null);
  const [motifRejet, setMotifRejet]   = useState('');
  const [preuve, setPreuve]           = useState<File | null>(null);
  const [solde, setSolde]             = useState<SoldeFedaPay | null>(null);
  const [soldeErreur, setSoldeErreur] = useState(false);
  const [soldeLoading, setSoldeLoading] = useState(true);
  const [toast, setToast]             = useState<{ msg: string; ok: boolean } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const showToast = useCallback((msg: string, ok = true) => {
    setToast({ msg, ok });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 5000);
  }, []);

  const load = useCallback(async (silencieux = false) => {
    if (!silencieux) setLoading(true);
    try {
      setRetraits(await retraitsAdmin.lister());
    } catch {
      if (!silencieux) showToast('Erreur lors du chargement', false);
    } finally {
      if (!silencieux) setLoading(false);
    }
  }, [showToast]);

  const chargerSolde = useCallback(async () => {
    setSoldeLoading(true);
    try {
      setSolde(await retraitsAdmin.soldeFedaPay());
      setSoldeErreur(false);
    } catch {
      setSolde(null);
      setSoldeErreur(true);
    } finally {
      setSoldeLoading(false);
    }
  }, []);

  // Premier chargement (liste et solde FedaPay) ; les états « loading » démarrent à vrai.
  useEffect(() => {
    if (!estAdmin) return;
    let actif = true;
    retraitsAdmin.lister()
      .then(liste => { if (actif) setRetraits(liste); })
      .catch(() => { if (actif) showToast('Erreur lors du chargement', false); })
      .finally(() => { if (actif) setLoading(false); });
    retraitsAdmin.soldeFedaPay()
      .then(s => { if (actif) { setSolde(s); setSoldeErreur(false); } })
      .catch(() => { if (actif) { setSolde(null); setSoldeErreur(true); } })
      .finally(() => { if (actif) setSoldeLoading(false); });
    return () => { actif = false; };
  }, [estAdmin, showToast]);

  // Les virements en cours se terminent tout seuls (webhook FedaPay) : l'écran suit sans action.
  const aDesEnCours = retraits.some(r => estEnCours(r.statut));
  useEffect(() => {
    if (!estAdmin || !aDesEnCours) return;
    const id = setInterval(() => { load(true); }, RAFRAICHISSEMENT_MS);
    return () => clearInterval(id);
  }, [estAdmin, aDesEnCours, load]);

  const compteurs = useMemo(() => {
    const parFiltre = {} as Record<FiltreRetrait, number>;
    for (const f of FILTRES) parFiltre[f.cle] = retraits.filter(r => correspondAuFiltre(r.statut, f.cle)).length;
    return parFiltre;
  }, [retraits]);

  const visibles = useMemo(() => retraits.filter(r => correspondAuFiltre(r.statut, filtre)), [retraits, filtre]);
  const aCouvrir = totalAttenteFonds(retraits);
  const fondsInsuffisants = solde !== null && aCouvrir > 0 && solde.disponible < aCouvrir;

  const executer = async (id: number, action: () => Promise<unknown>, succes: string, erreur: string) => {
    setActionId(id);
    try {
      await action();
      showToast(succes);
      setRelanceId(null);
      setSecoursId(null);
      setMotifRejet('');
      setPreuve(null);
      await load(true);
      chargerSolde();
    } catch (e) {
      showToast(apiMessage(e) ?? erreur, false);
    } finally {
      setActionId(null);
      refreshSidebarBadges();
    }
  };

  const relancer = (id: number) =>
    executer(id, () => retraitsAdmin.relancer(id), 'Retrait relancé : nouveau payout envoyé à FedaPay', 'Impossible de relancer ce retrait');
  const resynchroniser = (id: number) =>
    executer(id, () => retraitsAdmin.resynchroniser(id), 'Statut relu depuis FedaPay', 'Impossible de relire le statut chez FedaPay');
  const marquerEnvoye = (id: number) =>
    executer(id, () => retraitsAdmin.marquerEnvoye(id, preuve), 'Retrait marqué comme envoyé (secours)', "Impossible de marquer ce retrait comme envoyé");
  const rejeter = (id: number) =>
    executer(id, () => retraitsAdmin.rejeter(id, motifRejet), 'Retrait rejeté et remboursé (secours)', 'Impossible de rejeter ce retrait');

  if (!estAdmin) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--c-muted)' }}>
        <p style={{ fontSize: 18, fontWeight: 600 }}>Accès réservé aux administrateurs</p>
      </div>
    );
  }

  /** Boutons d'une ligne : relancer, resynchroniser, puis le bloc de secours (replié). */
  const renderActions = (r: RetraitAdmin) => {
    const a = actionsDisponibles(r, estSuperAdmin);
    const occupe = actionId === r.id;
    if (!a.relancer && !a.resynchroniser && !a.secours) {
      return <span style={{ color: 'var(--c-muted)', fontSize: 12 }}>—</span>;
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 190 }}>
        {a.resynchroniser && (
          <button onClick={() => resynchroniser(r.id)} disabled={occupe} style={btn('#1d4ed8', '#3b82f618', occupe)}>
            {occupe ? '…' : 'Resynchroniser'}
          </button>
        )}

        {a.relancer && relanceId !== r.id && (
          <button onClick={() => setRelanceId(r.id)} disabled={occupe} style={btn('#fff', '#10b981', occupe)}>
            Relancer le payout
          </button>
        )}
        {a.relancer && relanceId === r.id && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 8, border: '1px solid var(--c-border)', borderRadius: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--c-text)' }}>
              Un nouveau virement de <strong>{fmtMontant(r.montant)}</strong> va partir immédiatement vers {r.numero_telephone}.
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => relancer(r.id)} disabled={occupe} style={{ ...btn('#fff', '#10b981', occupe), flex: 1 }}>
                {occupe ? '…' : 'Confirmer'}
              </button>
              <button onClick={() => setRelanceId(null)} disabled={occupe}
                style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--c-border)', background: 'var(--c-card)', fontSize: 13, cursor: 'pointer' }}>
                Annuler
              </button>
            </div>
          </div>
        )}

        {a.secours && (
          <details open={secoursId === r.id} onToggle={e => { if ((e.target as HTMLDetailsElement).open) setSecoursId(r.id); else if (secoursId === r.id) setSecoursId(null); }}>
            <summary style={{ cursor: 'pointer', fontSize: 12, color: 'var(--c-muted)', fontWeight: 600 }}>Secours (FedaPay indisponible)</summary>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--s-red)' }}>
                Hors du flux normal. À utiliser seulement si FedaPay est indisponible : aucun payout n&apos;a été lancé pour cette demande.
              </span>
              <input type="file" accept="image/png,image/jpeg,image/webp" aria-label="Preuve du virement (facultative)"
                onChange={e => setPreuve(e.target.files?.[0] ?? null)} style={{ fontSize: 12 }} />
              <button onClick={() => marquerEnvoye(r.id)} disabled={occupe} style={btn('#fff', '#475569', occupe)}>
                {occupe ? '…' : 'Marquer envoyé (virement fait hors app)'}
              </button>
              <input placeholder="Motif du rejet (optionnel)" value={motifRejet} onChange={e => setMotifRejet(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: 8, border: '1.5px solid var(--c-border)', fontSize: 13 }} />
              <button onClick={() => rejeter(r.id)} disabled={occupe} style={btn('var(--s-red)', 'var(--t-red-bg)', occupe)}>
                {occupe ? '…' : 'Rejeter et rembourser'}
              </button>
            </div>
          </details>
        )}
      </div>
    );
  };

  const nomDe = (r: RetraitAdmin) =>
    [r.user?.prenom, r.user?.nom].filter(Boolean).join(' ') || `User #${r.user_id}`;

  const renderFedaPay = (r: RetraitAdmin) => (
    r.fedapay_payout_id ? (
      <>
        <div style={{ fontFamily: 'monospace' }}>#{r.fedapay_payout_id}</div>
        <div style={{ color: 'var(--c-muted)', fontSize: 11 }}>
          {r.fedapay_payout_status ?? '—'}{r.nb_tentatives > 1 ? ` · ${r.nb_tentatives} tentatives` : ''}
        </div>
      </>
    ) : (
      <span style={{ color: 'var(--c-muted)' }}>{r.automatique ? 'Aucun payout' : 'Ancienne demande (manuel)'}</span>
    )
  );

  const renderMotif = (r: RetraitAdmin) => {
    const motif = motifErreur(r);
    if (!motif) return <span style={{ color: 'var(--c-muted)' }}>—</span>;
    const erreur = r.statut === 'echoue' || r.statut === 'rejete';
    return <span style={{ fontSize: 12, color: erreur ? 'var(--s-red)' : 'var(--c-text)', wordBreak: 'break-word' }}>{motif}</span>;
  };

  return (
    <>
      <div className="immo-topbar">
        <div className="immo-topbar-title">
          <h1>Retraits</h1>
          <p>Virements Mobile Money automatiques (FedaPay). Cette page sert à superviser et à relancer, pas à valider.</p>
        </div>
      </div>

      <div className="immo-page">
        {toast && (
          <div role="status" style={{
            position: 'fixed', top: 24, right: 24, zIndex: 9999,
            background: toast.ok ? '#10b981' : '#ef4444',
            color: '#fff', padding: '12px 20px', borderRadius: 10,
            fontWeight: 600, fontSize: 14, boxShadow: '0 4px 16px rgba(0,0,0,.2)', maxWidth: 420,
          }}>
            {toast.msg}
          </div>
        )}

        {/* Solde FedaPay disponible pour les payouts */}
        <div className="immo-card" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--c-muted)', fontWeight: 600 }}>Solde FedaPay disponible</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: soldeErreur ? 'var(--s-red)' : 'var(--c-text)' }}>
              {soldeLoading && !solde ? '…' : solde ? fmtMontant(solde.disponible) : 'Indisponible'}
            </div>
            {soldeErreur && (
              <div style={{ fontSize: 12, color: 'var(--s-red)' }}>Impossible de lire le solde chez FedaPay pour le moment.</div>
            )}
            {aCouvrir > 0 && (
              <div style={{ fontSize: 12, marginTop: 4, color: fondsInsuffisants ? 'var(--s-red)' : 'var(--c-muted)', fontWeight: fondsInsuffisants ? 700 : 400 }}>
                {fmtMontant(aCouvrir)} en attente de fonds
                {fondsInsuffisants ? ' : approvisionnez le compte FedaPay puis relancez les demandes.' : '.'}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={chargerSolde} disabled={soldeLoading}
              style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--c-border)', background: 'var(--c-card)', fontWeight: 600, fontSize: 13, cursor: soldeLoading ? 'wait' : 'pointer' }}>
              {soldeLoading ? 'Actualisation…' : 'Actualiser le solde'}
            </button>
            <button onClick={() => load()} disabled={loading}
              style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--c-border)', background: 'var(--c-card)', fontWeight: 600, fontSize: 13, cursor: loading ? 'wait' : 'pointer' }}>
              Actualiser la liste
            </button>
          </div>
        </div>

        <div role="tablist" aria-label="Filtrer les retraits" style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {FILTRES.map(f => (
            <button key={f.cle} role="tab" aria-selected={filtre === f.cle} onClick={() => setFiltre(f.cle)}
              style={{
                padding: '6px 16px', borderRadius: 20, border: '1.5px solid',
                borderColor: filtre === f.cle ? '#1a3a6b' : 'var(--c-border)',
                background: filtre === f.cle ? '#1a3a6b' : 'var(--c-card)',
                color: filtre === f.cle ? '#fff' : 'var(--c-text)',
                fontWeight: 600, fontSize: 13, cursor: 'pointer',
              }}>
              {f.label} ({compteurs[f.cle] ?? 0})
            </button>
          ))}
        </div>

        {loading && retraits.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--c-muted)' }}>Chargement…</div>
        ) : visibles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--c-muted)', fontSize: 15 }}>
            {filtre === 'a_traiter' ? 'Aucune demande à traiter : tous les retraits partent automatiquement.' : 'Aucune demande de retrait'}
          </div>
        ) : (
          <>
            {/* ── Vue tableau (desktop) ── */}
            <div className="ut-desktop-only" style={{ background: 'var(--c-card)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,.06)', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 1000 }}>
                <thead>
                  <tr style={{ background: 'var(--c-bg)', borderBottom: '1px solid var(--c-border)' }}>
                    {['Bénéficiaire', 'Montant', 'Destination', 'Statut', 'FedaPay', 'Motif / erreur', 'Date', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--c-muted)', fontSize: 12 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibles.map((r, i) => (
                    <tr key={r.id} style={{ borderBottom: i === visibles.length - 1 ? 'none' : '1px solid var(--c-border)', verticalAlign: 'top' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600 }}>{nomDe(r)}</div>
                        {r.user?.email && <div style={{ color: 'var(--c-muted)', fontSize: 12 }}>{r.user.email}</div>}
                        <div style={{ color: 'var(--c-muted)', fontSize: 11, marginTop: 2 }}>{walletLabel(r.wallet?.type)} · demande #{r.id}</div>
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--s-blue)', whiteSpace: 'nowrap' }}>{fmtMontant(r.montant)}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontFamily: 'monospace', letterSpacing: 1 }}>{r.numero_telephone}</div>
                        <div style={{ color: 'var(--c-muted)', fontSize: 12 }}>{libelleOperateur(r.operateur)}</div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <StatutBadge statut={r.statut} />
                        {r.rembourse_le && <div style={{ color: 'var(--c-muted)', fontSize: 11, marginTop: 4 }}>Remboursé le {fmtDate(r.rembourse_le)}</div>}
                        {r.statut === 'envoye' && r.preuve_url && (
                          <div style={{ marginTop: 6 }}>
                            <a href={r.preuve_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--s-blue)', fontWeight: 600 }}>Voir la preuve (secours)</a>
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 13 }}>{renderFedaPay(r)}</td>
                      <td style={{ padding: '14px 16px', maxWidth: 260 }}>{renderMotif(r)}</td>
                      <td style={{ padding: '14px 16px', color: 'var(--c-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>
                        {fmtDate(r.created_at)}
                        {r.validateur && (
                          <div style={{ marginTop: 4 }}>
                            Traité par {[r.validateur.prenom, r.validateur.nom].filter(Boolean).join(' ')}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px' }}>{renderActions(r)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Vue cartes (mobile) ── */}
            <div className="ut-card-list ut-mobile-only">
              {visibles.map(r => (
                <div key={r.id} className="ut-card">
                  <div className="ut-card-header">
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{nomDe(r)}</div>
                      {r.user?.email && <div style={{ fontSize: 11, color: 'var(--c-muted)', marginTop: 2 }}>{r.user.email}</div>}
                      <div style={{ fontSize: 11, color: 'var(--c-muted)', marginTop: 2 }}>{walletLabel(r.wallet?.type)} · demande #{r.id}</div>
                    </div>
                    <StatutBadge statut={r.statut} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0' }}>
                    <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--s-blue)' }}>{fmtMontant(r.montant)}</div>
                    <div style={{ fontSize: 11, color: 'var(--c-muted)', textAlign: 'right' }}>
                      <div style={{ fontFamily: 'monospace' }}>{r.numero_telephone}</div>
                      <div>{libelleOperateur(r.operateur)}</div>
                    </div>
                  </div>

                  <div style={{ fontSize: 12, marginBottom: 6 }}>{renderFedaPay(r)}</div>
                  {motifErreur(r) && <div style={{ marginBottom: 6 }}>{renderMotif(r)}</div>}

                  <div className="ut-card-footer" style={{ marginTop: 4 }}>
                    <span style={{ fontSize: 11, color: 'var(--c-muted)' }}>{fmtDate(r.created_at)}</span>
                  </div>

                  <div style={{ marginTop: 10 }}>{renderActions(r)}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}

