import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } });

export interface Alerte {
  id: number;
  type: string;
  titre: string;
  corps: string;
  lu: boolean;
  created_at: string;
  meta?: Record<string, unknown> | null;
}

/** Lot 8 — alertes du compte connecté (admin ou commercial). */
export const alertesApi = {
  lister: (): Promise<Alerte[]> =>
    axios.get(`${BASE}/alertes`, auth()).then(r => (Array.isArray(r.data) ? r.data : r.data?.data ?? [])),
  compter: (): Promise<number> =>
    axios.get(`${BASE}/alertes/count`, auth()).then(r => Number(r.data?.count) || 0),
  lire: (id: number) => axios.patch(`${BASE}/alertes/${id}/lire`, {}, auth()).then(r => r.data),
  toutLire: () => axios.patch(`${BASE}/alertes/lire-tout`, {}, auth()).then(r => r.data),
};
