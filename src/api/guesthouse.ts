import axios from 'axios';
const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } });

export type EquipementOption = { code: string; libelle: string; icone: string | null };
export type GroupeEquipements = { categorie: string; libelle: string; equipements: EquipementOption[] };

export const guesthouseApi = {
  /** Référentiel public des équipements, groupés par catégorie (GET /equipements). */
  equipements: (): Promise<GroupeEquipements[]> =>
    axios.get(`${BASE}/equipements`, { params: { type: 'guesthouse' } }).then(r => r.data),
  /** Création : bien + détails + équipements en une transaction côté serveur. */
  create: (body: unknown): Promise<{ id: number }> =>
    axios.post(`${BASE}/biens`, body, auth()).then(r => r.data),
};
