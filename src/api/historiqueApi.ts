import axios from 'axios';
import { versParams, type FiltresHistorique, type TriHistorique } from '../utils/historiqueTransactions';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } });

/** Une ligne de l'historique unifié (`GET /admin/historique-transactions`). */
export interface LigneHistorique {
  source: 'paiement' | 'mouvement';
  id: number;
  date: string;
  type: string;
  sens: 'credit' | 'debit';
  montant: string | number;
  statut: string | null;
  methode: string | null;
  reference: string | null;
  reference_externe: string | null;
  utilisateur_id: number | null;
  utilisateur_nom: string | null;
  role_utilisateur: string | null;
  contrepartie_id: number | null;
  contrepartie_nom: string | null;
  role_contrepartie: string | null;
  bien_id: number | null;
  visite_id: number | null;
  loyer_id: number | null;
  contrat_id: number | null;
  wallet_id: number | null;
  wallet_type: string | null;
  solde_avant: string | number | null;
  solde_apres: string | number | null;
  initie_par: number | null;
  initie_par_nom: string | null;
  description: string | null;
  metadata: Record<string, unknown> | null;
}

export interface TotauxHistorique {
  nombre: number;
  entrees: number;
  sorties: number;
  net: number;
}

export interface PageHistorique {
  data: LigneHistorique[];
  total: number;
  page: number;
  limit: number;
  totaux: TotauxHistorique;
}

/** Nom du fichier annoncé par le serveur, sinon un nom par défaut. */
export function nomFichierExport(disposition: string | undefined, format: 'csv' | 'xlsx'): string {
  const m = /filename="?([^";]+)"?/i.exec(disposition ?? '');
  return m?.[1] ?? `historique-transactions.${format}`;
}

export const historiqueApi = {
  lister: (filtres: FiltresHistorique, tri: TriHistorique, page: number, limit: number): Promise<PageHistorique> =>
    axios
      .get(`${BASE}/admin/historique-transactions`, {
        ...auth(),
        params: { ...versParams(filtres), tri: tri.cle, ordre: tri.ordre, page, limit },
      })
      .then(r => r.data),

  /** Télécharge l'export (CSV ou XLSX) de la sélection filtrée ; le serveur le journalise. */
  exporter: async (filtres: FiltresHistorique, tri: TriHistorique, format: 'csv' | 'xlsx'): Promise<void> => {
    const r = await axios.get(`${BASE}/admin/historique-transactions/export`, {
      ...auth(),
      params: { ...versParams(filtres), tri: tri.cle, ordre: tri.ordre, format },
      responseType: 'blob',
    });
    const url = URL.createObjectURL(r.data as Blob);
    const lien = document.createElement('a');
    lien.href = url;
    lien.download = nomFichierExport(r.headers['content-disposition'] as string | undefined, format);
    document.body.appendChild(lien);
    lien.click();
    lien.remove();
    URL.revokeObjectURL(url);
  },
};
