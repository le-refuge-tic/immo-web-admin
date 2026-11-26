import { useState } from 'react';
import type { RetraitAdmin } from '../../api/retraitsAdmin';
import { fmtDate, fmtMontant, fmtTelephone, initiales, libelleOperateur, walletLabel } from './retraitFormat';
import { STATUT_COLORS, STATUT_LABELS, actionsDisponibles, motifErreur } from '../../utils/retraitStatut';

export function StatutBadge({ statut }: { statut: string }) {
  const couleur = STATUT_COLORS[statut] ?? '#9ca3af';
  return (
    <span className="rt-badge" style={{ color: couleur, background: couleur + '1f', borderColor: couleur + '55' }}>
      <span className="rt-badge-dot" style={{ background: couleur }} />
      {STATUT_LABELS[statut] ?? statut}
    </span>
  );
}

type Props = {
  r: RetraitAdmin;
  estSuperAdmin: boolean;
  occupe: boolean;
  onRelancer: (id: number) => Promise<boolean>;
  onResynchroniser: (id: number) => Promise<boolean>;
  onMarquerEnvoye: (id: number, preuve: File | null) => Promise<boolean>;
  onRejeter: (id: number, motif: string) => Promise<boolean>;
};

export default function RetraitItem({ r, estSuperAdmin, occupe, onRelancer, onResynchroniser, onMarquerEnvoye, onRejeter }: Props) {
  const [confirmation, setConfirmation] = useState(false);
  const [secours, setSecours] = useState(false);
  const [motifRejet, setMotifRejet] = useState('');
  const [preuve, setPreuve] = useState<File | null>(null);

  const a = actionsDisponibles(r, estSuperAdmin);
  const nom = [r.user?.prenom, r.user?.nom].filter(Boolean).join(' ') || `Utilisateur #${r.user_id}`;
  const motif = motifErreur(r);
  const enErreur = r.statut === 'echoue' || r.statut === 'rejete';

  const fermer = (ok: boolean) => {
    if (!ok) return;
    setConfirmation(false);
    setSecours(false);
    setMotifRejet('');
    setPreuve(null);
  };

  return (
    <article className="rt-item" aria-label={`Retrait #${r.id} de ${nom}`}>
      <div className="rt-item-main">
        <div className="rt-who">
          <div className="rt-avatar" aria-hidden>{initiales(nom)}</div>
          <div className="rt-who-text">
            <div className="rt-name">{nom}</div>
            {r.user?.email && <div className="rt-sub">{r.user.email}</div>}
            <div className="rt-chips">
              <span className="rt-chip">{walletLabel(r.wallet?.type)}</span>
              <span className="rt-chip rt-chip-ghost">Demande #{r.id}</span>
            </div>
          </div>
        </div>

        <div className="rt-money">
          <div className="rt-label">Montant</div>
          <div className="rt-amount">{fmtMontant(r.montant)}</div>
          <div className="rt-dest">
            <span className="rt-phone">{fmtTelephone(r.numero_telephone)}</span>
            <span className={`rt-op rt-op-${r.operateur ?? 'x'}`}>{libelleOperateur(r.operateur)}</span>
          </div>
        </div>

        <div className="rt-state">
          <StatutBadge statut={r.statut} />
          <div className="rt-sub">Demandé le {fmtDate(r.created_at)}</div>
          {r.validateur && (
            <div className="rt-sub">Traité par {[r.validateur.prenom, r.validateur.nom].filter(Boolean).join(' ')}</div>
          )}
          {r.rembourse_le && <div className="rt-sub">Remboursé le {fmtDate(r.rembourse_le)}</div>}
          {r.statut === 'envoye' && r.preuve_url && (
            <a className="rt-link" href={r.preuve_url} target="_blank" rel="noopener noreferrer">Voir la preuve (secours)</a>
          )}
        </div>

        <div className="rt-actions">
          {a.relancer && !confirmation && (
            <button type="button" className="rt-btn rt-btn-primary" disabled={occupe} onClick={() => setConfirmation(true)}>
              Relancer le payout
            </button>
          )}
          {a.resynchroniser && (
            <button type="button" className="rt-btn rt-btn-soft" disabled={occupe} onClick={() => onResynchroniser(r.id).then(fermer)}>
              {occupe ? 'Patientez…' : 'Resynchroniser'}
            </button>
          )}
          {a.secours && (
            <button type="button" className="rt-btn rt-btn-ghost" aria-expanded={secours} onClick={() => setSecours(v => !v)}>
              {secours ? 'Masquer le secours' : 'Traitement de secours'}
            </button>
          )}
          {!a.relancer && !a.resynchroniser && !a.secours && <span className="rt-sub">Aucune action</span>}
        </div>
      </div>

      <div className="rt-info">
        <div className="rt-info-cell">
          <span className="rt-label">FedaPay</span>
          {r.fedapay_payout_id ? (
            <span>
              <code>#{r.fedapay_payout_id}</code> · {r.fedapay_payout_status ?? '—'}
              {r.nb_tentatives > 1 ? ` · ${r.nb_tentatives} tentatives` : ''}
            </span>
          ) : (
            <span className="rt-muted">{r.automatique ? 'Aucun payout lancé' : 'Ancienne demande (manuelle)'}</span>
          )}
        </div>
        {motif && (
          <div className={`rt-info-cell rt-motif ${enErreur ? 'rt-motif-err' : ''}`}>
            <span className="rt-label">{enErreur ? 'Erreur' : 'Dernier événement'}</span>
            <span>{motif}</span>
          </div>
        )}
      </div>

      {confirmation && (
        <div className="rt-panel rt-panel-confirm" role="group" aria-label="Confirmer la relance">
          <p>
            Un nouveau virement de <strong>{fmtMontant(r.montant)}</strong> va partir immédiatement
            vers <strong>{fmtTelephone(r.numero_telephone)}</strong> ({libelleOperateur(r.operateur)}).
          </p>
          <div className="rt-panel-actions">
            <button type="button" className="rt-btn rt-btn-ghost" disabled={occupe} onClick={() => setConfirmation(false)}>Annuler</button>
            <button type="button" className="rt-btn rt-btn-primary" disabled={occupe} onClick={() => onRelancer(r.id).then(fermer)}>
              {occupe ? 'Envoi…' : 'Confirmer la relance'}
            </button>
          </div>
        </div>
      )}

      {secours && a.secours && (
        <div className="rt-panel rt-panel-secours" role="group" aria-label="Traitement de secours">
          <p className="rt-warn">
            Hors du flux normal. À utiliser seulement si FedaPay est indisponible : aucun payout n&apos;a été lancé pour cette demande.
          </p>
          <div className="rt-secours-grid">
            <div className="rt-secours-col">
              <div className="rt-label">Virement fait hors application</div>
              <label className="rt-file">
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={e => setPreuve(e.target.files?.[0] ?? null)} />
                <span>{preuve ? preuve.name : 'Joindre une preuve (facultatif)'}</span>
              </label>
              <button type="button" className="rt-btn rt-btn-dark" disabled={occupe} onClick={() => onMarquerEnvoye(r.id, preuve).then(fermer)}>
                {occupe ? 'Patientez…' : 'Marquer comme envoyé'}
              </button>
            </div>
            <div className="rt-secours-col">
              <div className="rt-label">Refuser la demande</div>
              <input className="rt-input" placeholder="Motif du rejet (facultatif)" value={motifRejet} onChange={e => setMotifRejet(e.target.value)} />
              <button type="button" className="rt-btn rt-btn-danger" disabled={occupe} onClick={() => onRejeter(r.id, motifRejet).then(fermer)}>
                {occupe ? 'Patientez…' : 'Rejeter et rembourser'}
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
