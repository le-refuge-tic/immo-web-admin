import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } });

/** Identité figée au moment de la suppression définitive (table dossiers_comptes_supprimes). */
export interface DossierSupprime {
  id: number;
  ancien_user_id: number;
  nom: string | null;
  prenom: string | null;
  telephone: string | null;
  email: string | null;
  role: string | null;
  date_creation_compte: string | null;
  suppression_demandee_le: string | null;
  suppression_effective_le: string;
  purge_prevue_le: string | null;
  motif: string | null;
  created_at: string;
}

export interface TransactionDossier {
  id: number;
  reference: string | null;
  type: string;
  statut: string;
  montant: number | string;
  created_at: string;
}

export interface BienDossier {
  id: number;
  titre?: string | null;
  type?: string | null;
  statut: string;
  localisation?: { ville?: string | null; quartier?: string | null } | null;
}

export interface PageDossiers {
  data: DossierSupprime[];
  total: number;
  page: number;
  limit: number;
}

export interface DetailDossier {
  dossier: DossierSupprime;
  transactions: TransactionDossier[];
  biens: BienDossier[];
}

/** Dossier restreint des comptes supprimés : super administrateur uniquement, lecture seule. */
export const dossiersSupprimes = {
  lister: (params: { page: number; limit: number; q?: string }): Promise<PageDossiers> =>
    axios.get(`${BASE}/admin/dossiers-supprimes`, { ...auth(), params }).then(r => r.data),

  /** Chaque appel est journalisé côté serveur. */
  detail: (id: number): Promise<DetailDossier> =>
    axios.get(`${BASE}/admin/dossiers-supprimes/${id}`, auth()).then(r => r.data),
};
