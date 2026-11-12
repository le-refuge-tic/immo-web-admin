import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } });

export type StatutRemboursement = 'a_rembourser' | 'rembourse' | 'rejete';
export type MotifRemboursement =
  | 'annulation_client'
  | 'annulation_gestionnaire'
  | 'annulation_admin'
  | 'paiement_doublon'
  | 'visite_close';

/** Demande de remboursement de frais de visite (`GET /admin/remboursements`). */
export interface RemboursementAdmin {
  id: number;
  transaction_id: number;
  visite_id: number | null;
  client_id: number;
  motif: MotifRemboursement;
  montant_paye: number | string;
  pourcentage: number;
  montant: number | string;
  /** Faux pour un paiement en anomalie, jamais crédité au wallet plateforme. */
  debiter_plateforme: boolean;
  statut: StatutRemboursement;
  /** Date limite de versement (annulation + 7 jours). */
  echeance: string;
  /** Numéro Mobile Money du paiement, vers lequel rembourser. */
  telephone: string | null;
  /** Référence du versement, ou motif du rejet. */
  commentaire: string | null;
  traite_par_id: number | null;
  traite_le: string | null;
  created_at: string;
  client?: { id: number; nom?: string; prenom?: string; telephone?: string } | null;
  transaction?: { id: number; reference: string; methode_paiement?: string } | null;
}

export interface FileRemboursements {
  data: RemboursementAdmin[];
  total: number;
  page: number;
  limit: number;
  /** Totaux de tout ce qui reste à verser, quel que soit le filtre affiché. */
  a_rembourser: { nombre: number; montant: number; en_retard: number };
}

export const remboursementsAdmin = {
  lister: (params: { statut?: StatutRemboursement; page?: number; limit?: number } = {}): Promise<FileRemboursements> =>
    axios.get(`${BASE}/admin/remboursements`, { ...auth(), params }).then(r => r.data),

  /** L'argent a été envoyé au client hors application : débite le wallet plateforme. */
  marquerRembourse: (id: number, referenceVersement: string): Promise<RemboursementAdmin> =>
    axios.patch(`${BASE}/admin/remboursements/${id}/rembourse`, { reference_versement: referenceVersement }, auth()).then(r => r.data),

  rejeter: (id: number, motif: string): Promise<RemboursementAdmin> =>
    axios.patch(`${BASE}/admin/remboursements/${id}/rejeter`, { motif }, auth()).then(r => r.data),
};
