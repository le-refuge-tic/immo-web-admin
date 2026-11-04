/**
 * Statuts d'une demande de retrait automatique (payout FedaPay) : libellés, couleurs,
 * regroupements d'écran et actions possibles. Les règles d'actions reprennent celles du
 * serveur (qui reste seul juge) pour n'afficher que des boutons utiles.
 */

export type StatutRetrait =
  | 'en_attente'
  | 'en_cours'
  | 'en_attente_fonds'
  | 'envoye'
  | 'echoue'
  | 'rejete'
  | 'approuve';

export const STATUT_LABELS: Record<string, string> = {
  en_attente: 'En attente',
  en_cours: 'En cours',
  en_attente_fonds: 'Attente de fonds',
  envoye: 'Envoyé',
  echoue: 'Échoué',
  rejete: 'Rejeté',
  approuve: 'Approuvé (ancien)',
};

export const STATUT_COLORS: Record<string, string> = {
  en_attente: '#f59e0b',
  en_cours: '#3b82f6',
  en_attente_fonds: '#f97316',
  envoye: '#10b981',
  echoue: '#ef4444',
  rejete: '#ef4444',
  approuve: '#3b82f6',
};

/** Statuts qui demandent l'attention d'un administrateur (aucun payout parti). */
export const STATUTS_A_TRAITER: readonly string[] = ['en_attente_fonds', 'en_attente'];

/** Le virement n'est pas terminé : l'écran se rafraîchit seul tant que c'est le cas. */
export function estEnCours(statut: string): boolean {
  return statut === 'en_cours';
}

export type FiltreRetrait = 'a_traiter' | 'en_cours' | 'envoye' | 'echoue' | 'rejete' | 'tous';

export const FILTRES: ReadonlyArray<{ cle: FiltreRetrait; label: string }> = [
  { cle: 'a_traiter', label: 'À traiter' },
  { cle: 'en_cours', label: 'En cours' },
  { cle: 'envoye', label: 'Envoyés' },
  { cle: 'echoue', label: 'Échoués' },
  { cle: 'rejete', label: 'Rejetés' },
  { cle: 'tous', label: 'Tous' },
];

export function correspondAuFiltre(statut: string, filtre: FiltreRetrait): boolean {
  switch (filtre) {
    case 'tous': return true;
    case 'a_traiter': return STATUTS_A_TRAITER.includes(statut);
    default: return statut === filtre;
  }
}

/** Nombre de demandes à traiter : sert au badge de la barre latérale. */
export function compterATraiter(retraits: ReadonlyArray<{ statut: string }>): number {
  return retraits.filter(r => STATUTS_A_TRAITER.includes(r.statut)).length;
}

export interface RetraitActionnable {
  statut: string;
  fedapay_payout_id?: string | null;
  rembourse_le?: string | null;
}

export interface ActionsRetrait {
  /** Relire le statut chez FedaPay (webhook perdu) : tout administrateur. */
  resynchroniser: boolean;
  /** Nouveau payout (échoué remboursé, en attente de fonds ou d'envoi) : super administrateur. */
  relancer: boolean;
  /** Traitement à la main, en secours seulement, avant tout payout : super administrateur. */
  secours: boolean;
}

export function actionsDisponibles(r: RetraitActionnable, estSuperAdmin: boolean): ActionsRetrait {
  const sansPayout = !r.fedapay_payout_id;
  return {
    resynchroniser: r.statut === 'en_cours',
    relancer:
      estSuperAdmin &&
      ((r.statut === 'echoue' && !!r.rembourse_le) ||
        r.statut === 'en_attente_fonds' ||
        (r.statut === 'en_attente' && sansPayout)),
    secours: estSuperAdmin && sansPayout && STATUTS_A_TRAITER.includes(r.statut),
  };
}

/** Motif technique à montrer à l'administrateur (jamais à l'utilisateur). */
export function motifErreur(r: { motif_echec?: string | null; motif_rejet?: string | null }): string | null {
  return r.motif_echec || r.motif_rejet || null;
}

/** Montants des demandes en attente de fonds : ce que le compte FedaPay doit couvrir. */
export function totalAttenteFonds(retraits: ReadonlyArray<{ statut: string; montant: number | string }>): number {
  return retraits
    .filter(r => r.statut === 'en_attente_fonds')
    .reduce((somme, r) => somme + Number(r.montant), 0);
}
