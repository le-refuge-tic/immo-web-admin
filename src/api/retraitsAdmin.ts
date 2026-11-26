import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } });

/** Demande de retrait telle que la supervision la reçoit (`GET /retraits/admin`). */
export interface RetraitAdmin {
  id: number;
  user_id: number;
  wallet_id: number;
  montant: number | string;
  statut: string;
  numero_telephone: string;
  operateur: string | null;
  fedapay_payout_id: string | null;
  /** Dernier statut connu du payout chez FedaPay (pending, processing, sent, failed…). */
  fedapay_payout_status: string | null;
  motif_echec: string | null;
  motif_rejet: string | null;
  nb_tentatives: number;
  rembourse_le: string | null;
  payout_lance_le: string | null;
  automatique: boolean;
  preuve_url: string | null;
  valide_le: string | null;
  created_at: string;
  updated_at: string;
  user?: { prenom?: string; nom?: string; email?: string } | null;
  wallet?: { type?: string } | null;
  validateur?: { prenom?: string; nom?: string; role?: string } | null;
}

/** Action manuelle tracée dans journal_actions_retraits (lecture seule). */
export interface JournalActionRetrait {
  id: number;
  /** marquer_envoye ou rejeter. */
  action: string;
  admin: { id: number; nom: string | null; prenom: string | null; role: string | null } | null;
  cree_le: string;
  reference: string | null;
  moyen: string | null;
  /** Commentaire (marquer envoyé) ou motif (rejet). */
  commentaire: string | null;
  statut_avant: string | null;
  statut_apres: string | null;
}

/** `GET /retraits/admin/:id` : le retrait et l'historique de ses actions manuelles. */
export interface RetraitDetail extends RetraitAdmin {
  journal_actions: JournalActionRetrait[];
}

/** Champs obligatoires de « marquer envoyé » (secours). */
export interface InfosVirementManuel {
  reference: string;
  moyen: string;
  commentaire: string;
}

export interface SoldeFedaPay {
  disponible: number;
  devise: string;
  soldes: { id: number; montant: number; mode: string | null }[];
}

export const retraitsAdmin = {
  lister: (): Promise<RetraitAdmin[]> =>
    axios.get(`${BASE}/retraits/admin`, auth()).then(r => (Array.isArray(r.data) ? r.data : (r.data?.data ?? []))),

  soldeFedaPay: (): Promise<SoldeFedaPay> =>
    axios.get(`${BASE}/retraits/admin/solde-fedapay`, auth()).then(r => r.data),

  /** Relit le statut du payout chez FedaPay (webhook perdu). */
  resynchroniser: (id: number): Promise<RetraitAdmin> =>
    axios.post(`${BASE}/retraits/admin/${id}/resynchroniser`, {}, auth()).then(r => r.data),

  /** Nouveau payout pour une demande échouée (remboursée) ou en attente de fonds. Super administrateur. */
  relancer: (id: number): Promise<RetraitAdmin> =>
    axios.post(`${BASE}/retraits/admin/${id}/relancer`, {}, auth()).then(r => r.data),

  /** Détail du retrait et historique des actions manuelles (lecture seule). */
  detail: (id: number): Promise<RetraitDetail> =>
    axios.get(`${BASE}/retraits/admin/${id}`, auth()).then(r => r.data),

  /**
   * SECOURS (FedaPay indisponible) : le virement a été fait hors application.
   * Référence, moyen et commentaire obligatoires ; preuve facultative.
   */
  marquerEnvoye: (id: number, infos: InfosVirementManuel, preuve?: File | null): Promise<RetraitAdmin> => {
    const form = new FormData();
    form.append('reference', infos.reference.trim());
    form.append('moyen', infos.moyen.trim());
    form.append('commentaire', infos.commentaire.trim());
    if (preuve) form.append('preuve', preuve);
    return axios.post(`${BASE}/retraits/admin/${id}/marquer-envoye`, form, auth()).then(r => r.data);
  },

  /** SECOURS : refuse la demande et recrédite le portefeuille. Motif obligatoire. */
  rejeter: (id: number, motif: string): Promise<RetraitAdmin> =>
    axios.patch(`${BASE}/retraits/admin/${id}/rejeter-manuel`, { motif: motif.trim() }, auth()).then(r => r.data),
};
