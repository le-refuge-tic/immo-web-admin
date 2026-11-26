import { useState } from 'react';
import type { VirementManuel } from '../../api/retraitsAdmin';

const MOYEN_PAR_DEFAUT = 'Mobile Money manuel';

type Props = {
  occupe: boolean;
  onMarquerEnvoye: (virement: VirementManuel) => Promise<unknown>;
  onRejeter: (motif: string) => Promise<unknown>;
};

/**
 * Traitement de secours (FedaPay indisponible). Le serveur trace chaque action :
 * référence, moyen et commentaire obligatoires pour un virement fait hors
 * application, motif obligatoire pour un rejet.
 */
export default function PanneauSecours({ occupe, onMarquerEnvoye, onRejeter }: Props) {
  const [reference, setReference] = useState('');
  const [moyen, setMoyen] = useState(MOYEN_PAR_DEFAUT);
  const [commentaire, setCommentaire] = useState('');
  const [preuve, setPreuve] = useState<File | null>(null);
  const [motif, setMotif] = useState('');

  const envoiComplet = !!(reference.trim() && moyen.trim() && commentaire.trim());
  const rejetComplet = !!motif.trim();

  return (
    <div className="rt-panel rt-panel-secours" role="group" aria-label="Traitement de secours">
      <p className="rt-warn">
        Hors du flux normal. À utiliser seulement si FedaPay est indisponible : aucun payout n&apos;a été lancé pour cette demande.
      </p>
      <div className="rt-secours-grid">
        <div className="rt-secours-col">
          <div className="rt-label">Virement fait hors application</div>
          <input className="rt-input" aria-label="Référence du virement" placeholder="Référence du virement (obligatoire)"
            maxLength={200} value={reference} onChange={e => setReference(e.target.value)} />
          <input className="rt-input" aria-label="Moyen utilisé" placeholder="Moyen utilisé (obligatoire)"
            maxLength={100} value={moyen} onChange={e => setMoyen(e.target.value)} />
          <textarea className="rt-input" aria-label="Commentaire" placeholder="Commentaire : pourquoi et comment (obligatoire)"
            rows={2} maxLength={1000} value={commentaire} onChange={e => setCommentaire(e.target.value)} />
          <label className="rt-file">
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={e => setPreuve(e.target.files?.[0] ?? null)} />
            <span>{preuve ? preuve.name : 'Joindre une preuve (facultatif)'}</span>
          </label>
          <button type="button" className="rt-btn rt-btn-dark" disabled={occupe || !envoiComplet}
            onClick={() => onMarquerEnvoye({ reference: reference.trim(), moyen: moyen.trim(), commentaire: commentaire.trim(), preuve })}>
            {occupe ? 'Patientez…' : 'Marquer comme envoyé'}
          </button>
        </div>
        <div className="rt-secours-col">
          <div className="rt-label">Refuser la demande</div>
          <input className="rt-input" aria-label="Motif du rejet" placeholder="Motif du rejet (obligatoire)"
            maxLength={500} value={motif} onChange={e => setMotif(e.target.value)} />
          <button type="button" className="rt-btn rt-btn-danger" disabled={occupe || !rejetComplet} onClick={() => onRejeter(motif.trim())}>
            {occupe ? 'Patientez…' : 'Rejeter et rembourser'}
          </button>
        </div>
      </div>
    </div>
  );
}
