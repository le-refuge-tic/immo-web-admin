import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } });

export type QuartierPropose = {
  id: number;
  nom: string;
  ville: string | null;
  arrondissement: string | null;
  statut: 'en_attente' | 'valide' | 'rejete';
  propose_par: number | null;
  traite_par: number | null;
  created_at: string;
};

export const getQuartiers = {
  /** Autocomplétion des quartiers proposés (en attente + validés). */
  rechercher: (q?: string): Promise<QuartierPropose[]> =>
    axios.get(`${BASE}/quartiers`, { ...auth(), params: q ? { q } : {} }).then(r => r.data),

  /** Proposer un quartier absent de la liste officielle. */
  proposer: (nom: string, ville?: string, arrondissement?: string): Promise<QuartierPropose> =>
    axios.post(`${BASE}/quartiers`, { nom, ville, arrondissement }, auth()).then(r => r.data),

  // ── Admin ──
  lister: (statut?: string): Promise<QuartierPropose[]> =>
    axios.get(`${BASE}/quartiers/admin`, { ...auth(), params: statut ? { statut } : {} }).then(r => r.data),
  valider: (id: number): Promise<QuartierPropose> =>
    axios.patch(`${BASE}/quartiers/admin/${id}/valider`, {}, auth()).then(r => r.data),
  rejeter: (id: number): Promise<QuartierPropose> =>
    axios.patch(`${BASE}/quartiers/admin/${id}/rejeter`, {}, auth()).then(r => r.data),
};
