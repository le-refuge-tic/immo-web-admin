import axios from 'axios';
import type { GroupeEquipements } from './guesthouse';
const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } });

export type TypeEvenement = { code: string; libelle: string };

export const salleFeteApi = {
  /** Référentiel public des équipements de salle, groupés par catégorie (GET /equipements). */
  equipements: (): Promise<GroupeEquipements[]> =>
    axios.get(`${BASE}/equipements`, { params: { type: 'salle_fete' } }).then(r => r.data),
  /** Types d'événements à cocher (GET /evenements-types). */
  evenements: (): Promise<TypeEvenement[]> =>
    axios.get(`${BASE}/evenements-types`).then(r => r.data),
  /** Création : bien + détails + équipements + événements en une transaction côté serveur. */
  create: (body: unknown): Promise<{ id: number }> =>
    axios.post(`${BASE}/biens`, body, auth()).then(r => r.data),
};
