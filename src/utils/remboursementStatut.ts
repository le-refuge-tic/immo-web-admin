import type { MotifRemboursement, StatutRemboursement } from '../api/remboursementsAdmin';

export type FiltreRemboursement = StatutRemboursement | 'tous';

export const FILTRES_REMBOURSEMENT: { cle: FiltreRemboursement; label: string }[] = [
  { cle: 'a_rembourser', label: 'À rembourser' },
  { cle: 'rembourse', label: 'Versés' },
  { cle: 'rejete', label: 'Rejetés' },
  { cle: 'tous', label: 'Tous' },
];

export const STATUT_REMBOURSEMENT: Record<StatutRemboursement, { label: string; couleur: string }> = {
  a_rembourser: { label: 'À rembourser', couleur: '#d97706' },
  rembourse: { label: 'Versé', couleur: '#10b981' },
  rejete: { label: 'Rejeté', couleur: '#ef4444' },
};

export const MOTIF_REMBOURSEMENT: Record<MotifRemboursement, string> = {
  annulation_client: 'Annulée par le prospect',
  annulation_gestionnaire: 'Annulée par le propriétaire',
  annulation_admin: 'Annulée par REFUGE',
  paiement_doublon: 'Paiement en double',
  visite_close: 'Payée après annulation',
};

const JOUR_MS = 86_400_000;

export type Echeance = { texte: string; enRetard: boolean; proche: boolean };

/**
 * Échéance d'une demande à verser : en retard, aujourd'hui, ou nombre de jours
 * restants. Une demande traitée n'a plus d'échéance.
 */
export function echeance(r: { statut: StatutRemboursement; echeance: string }, maintenant = Date.now()): Echeance | null {
  if (r.statut !== 'a_rembourser') return null;
  const reste = new Date(r.echeance).getTime() - maintenant;
  if (reste < 0) {
    const jours = Math.max(1, Math.floor(-reste / JOUR_MS));
    return { texte: `En retard de ${jours} jour${jours > 1 ? 's' : ''}`, enRetard: true, proche: true };
  }
  const jours = Math.floor(reste / JOUR_MS);
  if (jours === 0) return { texte: "À verser aujourd'hui", enRetard: false, proche: true };
  return { texte: `${jours} jour${jours > 1 ? 's' : ''} restant${jours > 1 ? 's' : ''}`, enRetard: false, proche: jours <= 2 };
}
