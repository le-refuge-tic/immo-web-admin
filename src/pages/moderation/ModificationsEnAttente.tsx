import { useCallback, useEffect, useRef, useState } from 'react';
import { getAdminBien } from '../../api/getAdminBien';
import { patchAdminBien } from '../../api/patchAdminBien';
import { useToast } from '../../context/ToastContext';
import { refreshSidebarBadges } from '../../hooks/useSidebarBadges';
import { useConfirm } from '../../shared/dialogues/useConfirm';
import { apiMessage } from '../../utils/apiMessage';
import { estBienMasque, INFO_BULLE_BIEN_MASQUE } from '../../utils/statutBien';
import AvisBienMasque from '../../components/AvisBienMasque';
import { TYPE_LABELS, auteurNom } from './moderationChecks';
import { differencesModification } from './differencesModification';

const LIMIT = 20;
const MOTIF_MIN = 5;

type Decision = 'approuver' | 'rejeter';

/** Fenêtre de refus : le motif est transmis à l'auteur de la modification. */
function RefusModification({ bien, onClose, onDone, onEchec }: { bien: any; onClose: () => void; onDone: () => void; onEchec: () => void }) {
  const [motif, setMotif] = useState('');
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState('');
  const valide = motif.trim().length >= MOTIF_MIN;

  useEffect(() => {
    const echap = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', echap);
    return () => document.removeEventListener('keydown', echap);
  }, [onClose]);

  const envoyer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valide || enCours) return;
    setEnCours(true);
    setErreur('');
    try {
      await patchAdminBien.deciderModification(bien.id, { decision: 'rejeter', motif: motif.trim(), soumise_le: bien.modification_en_attente?.soumise_le });
      onDone();
      onClose();
    } catch (err) {
      setErreur(apiMessage(err) ?? 'Le refus n’a pas pu être enregistré. Réessayez.');
      setEnCours(false);
      onEchec();
    }
  };

  return (
    <div className="immo-modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()} role="dialog" aria-modal="true" aria-label="Refuser la modification">
      <div className="immo-modal">
        <div className="immo-modal-title">Refuser la modification du bien n° {bien.id}</div>
        <div className="immo-modal-sub">L’annonce actuelle reste en ligne. L’auteur de la modification recevra ce motif.</div>
        {erreur && <p role="alert" style={{ color: 'var(--c-red)', fontSize: 12, margin: '0 0 12px' }}>{erreur}</p>}
        <form onSubmit={envoyer}>
          <div className="immo-form-field">
            <label className="immo-form-label" htmlFor="motif-modif">Motif *</label>
            <textarea id="motif-modif" className="immo-form-input" rows={4} value={motif} maxLength={500}
              onChange={e => setMotif(e.target.value)} autoFocus />
            {!valide && <span style={{ fontSize: 11, color: 'var(--c-muted)' }}>{MOTIF_MIN} caractères au moins.</span>}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button type="button" className="btn-cancel" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn-submit" disabled={!valide || enCours} style={{ flex: 1, background: 'var(--c-red)' }}>
              {enCours ? 'Envoi…' : 'Refuser la modification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Lot 5 — modifications de biens publiés en attente : l'annonce en ligne ne change qu'après
 * approbation. L'admin voit ce qui change, puis approuve ou refuse (motif obligatoire).
 */
export default function ModificationsEnAttente({ onChange }: { onChange: () => void }) {
  const toast = useToast();
  const { confirmer } = useConfirm();
  const [biens, setBiens] = useState<any[]>([]);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState('');
  const [selection, setSelection] = useState<number | null>(null);
  const [refus, setRefus] = useState<any>(null);
  const [enCours, setEnCours] = useState(false);
  const requete = useRef(0);

  const charger = useCallback(async () => {
    const id = ++requete.current;
    setChargement(true);
    setErreur('');
    try {
      const res = await getAdminBien.list({ modification_en_attente: 'oui', limit: LIMIT, page: 1 });
      if (id !== requete.current) return;
      const liste: any[] = Array.isArray(res?.data) ? res.data : [];
      setBiens(liste);
      setSelection(prev => (liste.some(b => b.id === prev) ? prev : (liste[0]?.id ?? null)));
    } catch (err) {
      if (id === requete.current) setErreur(apiMessage(err) ?? 'Impossible de charger les modifications en attente.');
    } finally {
      if (id === requete.current) setChargement(false);
    }
  }, []);

  useEffect(() => { void Promise.resolve().then(charger); }, [charger]);

  const apresDecision = () => {
    refreshSidebarBadges();
    onChange();
    void charger();
  };

  const decider = async (bien: any, decision: Decision) => {
    if (decision === 'rejeter') { setRefus(bien); return; }
    const ok = await confirmer({
      titre: `Approuver la modification du bien n° ${bien.id} ?`,
      message: 'L’annonce en ligne sera remplacée par la version modifiée.',
      confirmer: 'Approuver',
    });
    if (!ok) return;
    setEnCours(true);
    try {
      await patchAdminBien.deciderModification(bien.id, { decision: 'approuver', soumise_le: bien.modification_en_attente?.soumise_le });
      toast('Modification approuvée : l’annonce est à jour.', 'success');
      apresDecision();
    } catch (err) {
      toast(apiMessage(err) ?? 'L’approbation a échoué.', 'error');
      void charger(); // version changée entre-temps (409) : la file affiche la nouvelle
    } finally {
      setEnCours(false);
    }
  };

  const choisi = biens.find(b => b.id === selection) ?? null;
  const attente = choisi?.modification_en_attente;
  const diffs = choisi && attente?.corps ? differencesModification(choisi, attente.corps) : [];

  if (erreur) {
    return (
      <div className="immo-card mod-empty" role="alert">
        <span>{erreur}</span>
        <button type="button" className="btn-cancel" onClick={() => void charger()}>Réessayer</button>
      </div>
    );
  }
  if (chargement && biens.length === 0) return <div className="immo-card mod-empty">Chargement…</div>;
  if (biens.length === 0) return <div className="immo-card mod-empty">Aucune modification en attente.</div>;

  return (
    <>
      {refus && <RefusModification bien={refus} onClose={() => setRefus(null)} onEchec={() => void charger()} onDone={() => { toast('Modification refusée : l’auteur est prévenu.', 'success'); apresDecision(); }} />}
      <div className="mod-split">
        <div className="mod-queue-col">
          <ul className="mod-queue" aria-label="Modifications en attente" aria-busy={chargement}>
            {biens.map(b => (
              <li key={b.id}>
                <button type="button" className={`mod-q${b.id === selection ? ' is-selected' : ''}`}
                  aria-current={b.id === selection ? 'true' : undefined} onClick={() => setSelection(b.id)}>
                  <span className="mod-q-body">
                    <span className="mod-q-title">n° {b.id} · {TYPE_LABELS[b.type] ?? b.type} · {b.localisation?.quartier || b.localisation?.ville || '—'}</span>
                    <span className="mod-sub">
                      {b.modification_en_attente?.source === 'staff' ? 'Commercial' : 'Propriétaire'} · {auteurNom(b)}
                      {b.modification_en_attente?.soumise_le ? ` · ${new Date(b.modification_en_attente.soumise_le).toLocaleDateString('fr-FR')}` : ''}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="mod-detail-col">
          {choisi && (
            <section className="immo-card" aria-label={`Modification du bien n° ${choisi.id}`} style={{ padding: 16 }}>
              <h2 style={{ fontSize: 15, margin: '0 0 4px' }}>Bien n° {choisi.id} — ce qui change</h2>
              <p style={{ fontSize: 12, color: 'var(--c-muted)', margin: '0 0 12px' }}>
                L’annonce actuelle reste en ligne tant que la modification n’est pas approuvée.
              </p>
              {diffs.length === 0 ? (
                <p style={{ fontSize: 13 }}>Aucune différence visible avec l’annonce en ligne.</p>
              ) : (
                <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', color: 'var(--c-muted)' }}>
                      <th scope="col" style={{ padding: '6px 4px' }}>Champ</th>
                      <th scope="col" style={{ padding: '6px 4px' }}>En ligne</th>
                      <th scope="col" style={{ padding: '6px 4px' }}>Proposé</th>
                    </tr>
                  </thead>
                  <tbody>
                    {diffs.map(d => (
                      <tr key={d.champ} style={{ borderTop: '1px solid var(--c-border)', verticalAlign: 'top' }}>
                        <th scope="row" style={{ padding: '6px 4px', fontWeight: 600, textAlign: 'left' }}>{d.champ}</th>
                        <td style={{ padding: '6px 4px', color: 'var(--c-muted)', whiteSpace: 'pre-wrap' }}>{d.avant}</td>
                        <td style={{ padding: '6px 4px', whiteSpace: 'pre-wrap' }}>{d.apres}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {estBienMasque(choisi) && <div style={{ marginTop: 16 }}><AvisBienMasque statut={choisi.statut} /></div>}
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button type="button" className="btn-cancel" disabled={enCours || estBienMasque(choisi)} title={estBienMasque(choisi) ? INFO_BULLE_BIEN_MASQUE : undefined} onClick={() => void decider(choisi, 'rejeter')}>Refuser</button>
                <button type="button" className="btn-submit" disabled={enCours || estBienMasque(choisi)} title={estBienMasque(choisi) ? INFO_BULLE_BIEN_MASQUE : undefined} style={{ flex: 1 }} onClick={() => void decider(choisi, 'approuver')}>
                  {enCours ? 'Envoi…' : 'Approuver la modification'}
                </button>
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
