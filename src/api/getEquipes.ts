import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } });

export type EquipeMembre = { id: number; nom: string; prenom: string; email: string | null; telephone: string | null };
export type Equipe = { id: number; membres: EquipeMembre[] };

export const equipesApi = {
  list: (): Promise<Equipe[]> =>
    axios.get(`${BASE}/admin/equipes`, auth()).then(r => r.data),

  create: (membreIds: number[]): Promise<Equipe> =>
    axios.post(`${BASE}/admin/equipes`, { membre_ids: membreIds }, auth()).then(r => r.data),

  remove: (id: number) =>
    axios.delete(`${BASE}/admin/equipes/${id}`, auth()).then(r => r.data),

  mine: (): Promise<{ equipe: Equipe | null }> =>
    axios.get(`${BASE}/admin/equipes/mine`, auth()).then(r => r.data),
};
