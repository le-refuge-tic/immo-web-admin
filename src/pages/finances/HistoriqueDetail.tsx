import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { LigneHistorique } from '../../api/historiqueApi';
import type { WalletTransaction } from '../../api/getWallet';
import { expliquerMouvement, formatFcfa } from '../commercial/historiquePortefeuille';
import {
  dateHeureBenin,
  libelle,
  lienHistoriqueUtilisateur,
  LIBELLES_METHODE,
  LIBELLES_ROLE,
  LIBELLES_STATUT,
  LIBELLES_TYPE,
} from '../../utils/historiqueTransactions';

/** Ligne d'historique (mouvement) → forme attendue par l'explication des primes. */
function versMouvementWallet(l: LigneHistorique): WalletTransaction {
  return {
    id: l.id,
    wallet_id: l.wallet_id ?? 0,
    type: l.type === 'retrait' ? 'retrait' : 'depot',
    amount: Number(l.montant),
    balance_before: Number(l.solde_avant ?? 0),
    balance_after: Number(l.solde_apres ?? 0),
    reference: l.reference,
    description: l.description ?? '',
    status: l.statut ?? '',
    metadata: l.metadata as WalletTransaction['metadata'],
    initiated_by: l.initie_par,
    created_at: l.date,
  };
}

function Champ({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--c-border)', fontSize: 13 }}>
      <span style={{ color: 'var(--c-muted)', flexShrink: 0 }}>{label}</span>
      <span style={{ fontWeight: 600, textAlign: 'right', wordBreak: 'break-all' }}>{children}</span>
    </div>
  );
}

function Personne({ id, nom, role }: { id: number | null; nom: string | null; role: string | null }) {
  if (!nom && !id) return <>—</>;
  return (
    <span>
      {nom || `Utilisateur #${id}`}
      {role && <span style={{ color: 'var(--c-muted)', fontWeight: 400 }}> · {libelle(LIBELLES_ROLE, role)}</span>}
      {id != null && role !== 'plateforme' && (
        <>
          {' '}
          <Link to={lienHistoriqueUtilisateur(id)} style={{ fontWeight: 600, fontSize: 12 }}>Voir son historique</Link>
        </>
      )}
    </span>
  );
}

interface Props {
  ligne: LigneHistorique;
  /** Chemin de la fiche du bien (admin : /annonces/:id). */
  lienBien: (id: number) => string;
  onClose: () => void;
}

/** Panneau latéral : tout le détail d'une ligne de l'historique. */
export default function HistoriqueDetail({ ligne: l, lienBien, onClose }: Props) {
  useEffect(() => {
    const fermer = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', fermer);
    return () => window.removeEventListener('keydown', fermer);
  }, [onClose]);

  const explication = l.source === 'mouvement' ? expliquerMouvement(versMouvementWallet(l)) : null;
  const signe = l.sens === 'debit' ? '−' : '+';

  return (
    <div role="presentation" onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.35)', zIndex: 1000 }}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Détail de l’opération"
        onClick={e => e.stopPropagation()}
        style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 'min(440px, 100%)', background: 'var(--c-card)', boxShadow: '-8px 0 24px rgba(0,0,0,0.15)', padding: 20, overflowY: 'auto' }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: 'var(--c-muted)' }}>
              {l.source === 'paiement' ? 'Paiement' : 'Mouvement de portefeuille'} #{l.id}
            </div>
            <h2 style={{ fontSize: 18, margin: '2px 0 0' }}>{explication?.titre ?? libelle(LIBELLES_TYPE, l.type)}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer" style={{ border: 'none', background: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--c-muted)' }}>×</button>
        </div>

        <div style={{ fontSize: 24, fontWeight: 800, color: l.sens === 'debit' ? 'var(--s-red)' : 'var(--s-green)', marginBottom: 12 }}>
          {signe} {formatFcfa(Number(l.montant))}
        </div>

        {explication && explication.details.filter(Boolean).length > 0 && (
          <ul style={{ margin: '0 0 12px', padding: '10px 12px 10px 28px', background: 'var(--c-surface-2)', borderRadius: 8, fontSize: 13, lineHeight: 1.6 }}>
            {explication.details.filter(Boolean).map((d, i) => <li key={i}>{d}</li>)}
          </ul>
        )}

        <Champ label="Date (heure du Bénin)">{dateHeureBenin(l.date)}</Champ>
        <Champ label="Type">{libelle(LIBELLES_TYPE, l.type)}</Champ>
        <Champ label="Statut">{libelle(LIBELLES_STATUT, l.statut)}</Champ>
        {l.methode && <Champ label="Méthode">{libelle(LIBELLES_METHODE, l.methode)}</Champ>}
        <Champ label={l.source === 'paiement' ? 'Payeur' : 'Titulaire'}>
          <Personne id={l.utilisateur_id} nom={l.utilisateur_nom} role={l.role_utilisateur} />
        </Champ>
        {l.source === 'paiement' && (
          <Champ label="Bénéficiaire">
            <Personne id={l.contrepartie_id} nom={l.contrepartie_nom} role={l.role_contrepartie} />
          </Champ>
        )}
        {l.bien_id != null && <Champ label="Bien"><Link to={lienBien(l.bien_id)}>Bien #{l.bien_id}</Link></Champ>}
        {l.visite_id != null && <Champ label="Visite">#{l.visite_id}</Champ>}
        {l.loyer_id != null && <Champ label="Loyer">#{l.loyer_id}</Champ>}
        {l.contrat_id != null && <Champ label="Contrat">#{l.contrat_id}</Champ>}
        {l.solde_avant != null && <Champ label="Solde avant">{formatFcfa(Number(l.solde_avant))}</Champ>}
        {l.solde_apres != null && <Champ label="Solde après">{formatFcfa(Number(l.solde_apres))}</Champ>}
        <Champ label="Référence">{l.reference ?? '—'}</Champ>
        {l.reference_externe && <Champ label="Référence FedaPay">{l.reference_externe}</Champ>}
        {l.initie_par != null && <Champ label="Initié par">{l.initie_par_nom ?? `#${l.initie_par}`}</Champ>}
        {l.description && <Champ label={l.source === 'paiement' ? 'Erreur' : 'Libellé'}>{l.description}</Champ>}
      </aside>
    </div>
  );
}
